import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Product } from '../../src/types/pos.types';
import { formatUGX } from './currencyFormatter';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  isLowStock: boolean;
  getCategoryName: (categoryId: string) => string;
  index: number;
}

// SVG Icons
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ShoppingCartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const PackageIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

// Constants
const MAX_DISPLAY_LENGTH = 27;

// Helper: Get product ID
const getProductId = (product: Product): string => {
  const id = product.id;
  if (!id) {
    console.warn('Product missing ID:', product);
    return 'unknown';
  }
  return id.toString();
};

// Helper: Local image path
// Helper: Local image path
const getLocalImagePath = (product: Product): string => {
  const productId = getProductId(product);
  if (productId === 'unknown') {
    const backendUrl = window.electron?.backend?.getBackendUrl?.() || 'http://192.168.1.3:3000';
    return `${backendUrl}/assets/product-images/default-product.jpg`;
  }

  const sanitizedName = product.name
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);

  const backendUrl = window.electron?.backend?.getBackendUrl?.() || 'http://192.168.1.3:3000';
  return `${backendUrl}/assets/product-images/${productId}_${sanitizedName}.jpg`;
};

// Helper: Has image
const hasProductImage = (product: Product): boolean => {
  const id = getProductId(product);
  return !!(id && id !== 'unknown' && product.name && product.name !== 'Unknown Product');
};

// Helper: Image error fallback
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, product: Product) => {
  const img = e.target as HTMLImageElement;
  if (product.img && product.img.startsWith('http')) {
    img.src = product.img;
  } else {
    img.style.display = 'none';
    const placeholder = img.nextElementSibling as HTMLElement;
    if (placeholder?.classList.contains('pos-product-img-placeholder')) {
      placeholder.style.display = 'flex';
    }
  }
};

// Helper: Stock level with solid colors
const getStockLevel = (quantity: number): { level: string; className: string } => {
  if (quantity <= 0) return { level: 'Out of Stock', className: 'out-of-stock' };
  if (quantity <= 10) return { level: quantity.toString(), className: 'low-stock' };
  if (quantity <= 25) return { level: quantity.toString(), className: 'medium-stock' };
  return { level: quantity.toString(), className: 'high-stock' };
};

// Helper: Format product name with 27 character limit
const formatProductName = (name: string): string => {
  if (!name) return '';
  
  if (name.length <= MAX_DISPLAY_LENGTH) {
    return name;
  }
  
  // Truncate to exactly 27 characters and add ellipsis
  return name.substring(0, MAX_DISPLAY_LENGTH).trim() + '...';
};

const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  onAddToCart,
  onViewProduct,
  isLowStock,
  index,
}) => {
  const localImagePath = getLocalImagePath(product);
  const hasImage = hasProductImage(product);
  const { level: stockLevel, className: stockClass } = getStockLevel(product.quantity || 0);
  const formattedPrice = formatUGX(parseFloat(product.price));
  const displayName = formatProductName(product.name);
  const needsTruncation = product.name.length > MAX_DISPLAY_LENGTH;

  const handleCardClick = React.useCallback(() => {
    if (product.quantity > 0) {
      onAddToCart(product);
    }
  }, [product, onAddToCart]);

  const handleViewDetails = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onViewProduct(product);
  }, [product, onViewProduct]);

  const handleAddToCart = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.quantity > 0) {
      onAddToCart(product);
    }
  }, [product, onAddToCart]);

  return (
    <motion.div
      className={`
        pos-product-card
        ${product.quantity <= 0 ? 'out-of-stock' : ''}
        ${isLowStock ? 'low-stock' : ''}
        ${!hasImage ? 'no-image' : ''}
      `.trim()}
      onClick={handleCardClick}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{
        scale: product.quantity > 0 ? 1.02 : 1,
        y: product.quantity > 0 ? -4 : 0,
      }}
      whileTap={{ scale: product.quantity > 0 ? 0.98 : 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: index * 0.01,
      }}
      layout
    >
      {/* Image Wrapper */}
      <div className="pos-product-image-wrapper">
        {hasImage ? (
          <>
            <img
              src={localImagePath}
              alt={product.name}
              className="pos-product-img"
              onError={(e) => handleImageError(e, product)}
              loading="lazy"
            />
            <div className="pos-product-img-placeholder" style={{ display: 'none' }}>
              <PackageIcon />
              <span>No Image</span>
            </div>
          </>
        ) : (
          <div className="pos-product-img-placeholder">
            <PackageIcon />
            <span>No Image</span>
          </div>
        )}

        {/* Stock Overlays */}
        {product.quantity <= 0 && (
          <div className="pos-out-of-stock-overlay">
            <span>Out of Stock</span>
          </div>
        )}
        {isLowStock && product.quantity > 0 && (
          <div className="pos-low-stock-badge">
            <span>Low Stock</span>
          </div>
        )}

        {/* Hover Actions */}
        {product.quantity > 0 && (
          <div className="pos-card-actions">
            <button
              className="pos-action-btn view-btn"
              onClick={handleViewDetails}
              aria-label="View details"
              title="View Details"
            >
              <EyeIcon />
            </button>
            <button
              className="pos-action-btn cart-btn"
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
              title="Add to Cart"
            >
              <ShoppingCartIcon />
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="pos-product-info">
        <h5 
          className="pos-product-name" 
          data-fullname={needsTruncation ? product.name : undefined}
        >
          {displayName}
        </h5>
        <div className="pos-product-price">UGX {formattedPrice}</div>

        <div className="pos-stock-quantity">
          <span className="pos-stock-label">Stock</span>
          <span className={`pos-stock-value ${stockClass}`}>
            {stockLevel}
          </span>
        </div>

        {!hasImage && (
          <div className="pos-no-image-indicator">
            No image available
          </div>
        )}
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;