// src/renderer/src/components/pos/PosProducts.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { Product, Category } from '../../src/types/pos.types';
import ProductCard from './ProductCard';
import './PosProducts.css';

interface PosProductsProps {
  products: Product[];
  loading: boolean;
  categories: Category[];
  onAddToCart: (product: Product) => void;
  isLowStock: (product: Product) => boolean;
  onViewProduct: (product: Product) => void;
}

// Performance constants
const VISIBLE_PRODUCTS_LIMIT = 48;
const RENDER_BATCH_SIZE = 24;

// Custom Skeleton Component
const CustomSkeleton: React.FC<{ height?: string | number; width?: string | number; style?: React.CSSProperties }> = ({ 
  height = '1rem', 
  width = '100%', 
  style 
}) => {
  return (
    <div 
      className="pos-custom-skeleton"
      style={{ 
        height,
        width,
        ...style 
      }}
    />
  );
};

const ProductSkeleton: React.FC<{ count?: number }> = ({ count = 12 }) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);
  
  return (
    <>
      {skeletons.map((index) => (
        <div key={index} className="pos-product-card pos-skeleton-card">
          <div className="pos-product-image-wrapper">
            <CustomSkeleton height="100%" />
          </div>
          <div className="pos-product-info">
            <CustomSkeleton height={16} width="80%" style={{ marginBottom: '0.5rem' }} />
            <CustomSkeleton height={14} width="60%" />
          </div>
        </div>
      ))}
    </>
  );
};

// Helper function to check if product has an image
const hasProductImage = (product: Product): boolean => {
  const productId = product.id?.toString() || product.id?.toString();
  if (!productId) return false;
  
  const sanitizedName = product.name
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  
  // Check if we have a backend URL stored, otherwise use localhost
  const backendUrl = window.electron?.backend?.getBackendUrl?.() || 'http://192.168.1.3:3001';
  const imageUrl = `${backendUrl}/assets/product-images/${productId}_${sanitizedName}.jpg`;
  
  // For now, we'll assume products with valid IDs and names have images
  return !!(productId && product.name && product.name !== 'Unknown Product');
};

const PosProducts: React.FC<PosProductsProps> = React.memo(({
  products,
  loading,
  categories,
  onAddToCart,
  isLowStock,
  onViewProduct
}) => {
  const [autoRefreshLoading, setAutoRefreshLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(VISIBLE_PRODUCTS_LIMIT);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoRefreshLoading(true);
      
      // Simulate data refresh
      setTimeout(() => {
        setAutoRefreshLoading(false);
      }, 2000);
      
    }, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Reset visible count when products change
  useEffect(() => {
    setVisibleCount(VISIBLE_PRODUCTS_LIMIT);
  }, [products.length]);

  // Load more products on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container || products.length <= VISIBLE_PRODUCTS_LIMIT) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        setVisibleCount(prev => Math.min(prev + RENDER_BATCH_SIZE, products.length));
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [products.length]);

  const getCategoryName = useMemo(() => (categoryId: string) => {
    const category = categories.find(cat => cat.id.toString() === categoryId);
    return category ? category.name : 'Unknown';
  }, [categories]);

  // Separate products with and without images
  const { productsWithImages, productsWithoutImages } = useMemo(() => {
    const withImages: Product[] = [];
    const withoutImages: Product[] = [];

    products.forEach(product => {
      if (hasProductImage(product)) {
        withImages.push(product);
      } else {
        withoutImages.push(product);
      }
    });

    return { productsWithImages: withImages, productsWithoutImages: withoutImages };
  }, [products]);

  // Limit the number of products rendered at once, maintaining the separation
  const visibleProductsWithImages = useMemo(() => {
    return productsWithImages.slice(0, visibleCount);
  }, [productsWithImages, visibleCount]);

  const visibleProductsWithoutImages = useMemo(() => {
    // Show products without images only when we're showing all products
    return visibleCount >= productsWithImages.length ? productsWithoutImages : [];
  }, [productsWithoutImages, visibleCount, productsWithImages.length]);

  // Calculate total visible count
  const totalVisibleProducts = visibleProductsWithImages.length + visibleProductsWithoutImages.length;
  const hasMoreProducts = totalVisibleProducts < products.length;

  // Show loading state for both initial load and auto-refresh
  const showLoading = loading || autoRefreshLoading;

  console.log('PosProducts - Rendering:', totalVisibleProducts, 'of', products.length, 'products');
  console.log('With images:', visibleProductsWithImages.length, 'Without images:', visibleProductsWithoutImages.length);

  if (showLoading && products.length === 0) {
    return (
      <div className="pos-products-grid" ref={containerRef}>
        <ProductSkeleton count={12} />
      </div>
    );
  }

  return (
    <div className="pos-products-grid" ref={containerRef}>
      {/* Show skeleton overlay during auto-refresh while keeping existing products visible */}
      {autoRefreshLoading && (
        <div className="pos-refresh-overlay">
          <div className="pos-refresh-skeleton">
            <ProductSkeleton count={6} />
          </div>
        </div>
      )}
      
      {/* Products with images */}
      <AnimatePresence mode="popLayout">
        {visibleProductsWithImages.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onViewProduct={onViewProduct}
            isLowStock={isLowStock(product)}
            getCategoryName={getCategoryName}
            index={index}
          />
        ))}
      </AnimatePresence>

      {/* Products without images section - only show when we have them and are showing enough products */}
      {visibleProductsWithoutImages.length > 0 && (
        <div className="pos-products-no-images-section">
          <div className="pos-section-divider">
            <span>Products Without Images</span>
          </div>
          <AnimatePresence mode="popLayout">
            {visibleProductsWithoutImages.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onViewProduct={onViewProduct}
                isLowStock={isLowStock(product)}
                getCategoryName={getCategoryName}
                index={index + visibleProductsWithImages.length} // Continue index from previous section
              />
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {/* Show loading indicator for virtual scroll */}
      {hasMoreProducts && (
        <div className="pos-products-loading">
          <div className="pos-loading-spinner"></div>
          <p>Loading more products... ({totalVisibleProducts} of {products.length})</p>
        </div>
      )}
      
      {/* Show message if there are more products */}
      {!hasMoreProducts && products.length > 0 && (
        <div className="pos-products-more">
          <p>Showing all {products.length} products</p>
          {productsWithoutImages.length > 0 && (
            <p className="pos-products-no-images-count">
              ({productsWithoutImages.length} without images)
            </p>
          )}
        </div>
      )}
      
      {products.length === 0 && !showLoading && (
        <motion.div 
          className="pos-no-products"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ShoppingBag size={48} />
          <p>No products found</p>
          <p className="pos-no-products-hint">Try adjusting your search or category filter</p>
        </motion.div>
      )}
    </div>
  );
});

PosProducts.displayName = 'PosProducts';

export default PosProducts;