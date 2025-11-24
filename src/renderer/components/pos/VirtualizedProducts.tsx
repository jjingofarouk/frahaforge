// src/renderer/src/components/pos/VirtualizedProducts.tsx
import React, { memo, useMemo } from 'react';
import { Product, Category } from '../../src/types/pos.types';
import ProductCard from './ProductCard';

interface VirtualizedProductsProps {
  products: Product[];
  viewMode: 'grid' | 'list';
  categories: Category[];
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  isLowStock: (product: Product) => boolean;
  containerHeight?: number;
}

// Simple chunking for basic virtualization
const VirtualizedProducts: React.FC<VirtualizedProductsProps> = memo(({
  products,
  viewMode,
  categories,
  onAddToCart,
  onViewProduct,
  isLowStock,
  containerHeight = 600,
}) => {
  const getCategoryName = useMemo(() => (categoryId: string) => {
    const category = categories.find(cat => cat.id.toString() === categoryId);
    return category ? category.name : 'Unknown';
  }, [categories]);

  // Simple virtualization: only render visible products
  const visibleProducts = useMemo(() => {
    // For now, return all products. In a real implementation, 
    // you would calculate which products are visible based on scroll position
    return products;
  }, [products]);

  if (viewMode === 'grid') {
    return (
      <div 
        className="pos-product-grid grid-view virtualized-grid"
        style={{ height: containerHeight, overflowY: 'auto' }}
      >
        {visibleProducts.map((product, index) => (
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
      </div>
    );
  }

  return (
    <div 
      className="pos-product-grid list-view virtualized-list"
      style={{ height: containerHeight, overflowY: 'auto' }}
    >
      {visibleProducts.map((product, index) => (
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
    </div>
  );
});

VirtualizedProducts.displayName = 'VirtualizedProducts';

export default VirtualizedProducts;