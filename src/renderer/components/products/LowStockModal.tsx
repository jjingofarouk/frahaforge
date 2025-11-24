import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Package, TrendingDown } from 'lucide-react';
import { Product } from '../../types/products.types';
import './LowStockModal.css';

interface LowStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  stockType: 'low-stock' | 'out-of-stock';
  onSelectProduct: (product: Product) => void;
}

export const LowStockModal: React.FC<LowStockModalProps> = ({
  isOpen,
  onClose,
  products,
  stockType,
  onSelectProduct
}) => {
  const getStockStatus = (product: Product): string => {
    if (product.quantity === 0) return 'OUT OF STOCK';
    if (product.quantity <= 3) return 'CRITICAL';
    if (product.quantity <= 6) return 'LOW';
    if (product.quantity <= 9) return 'WARNING';
    return 'HEALTHY';
  };

  const getStockClass = (product: Product): string => {
    if (product.quantity === 0) return 'stock-out';
    if (product.quantity <= 3) return 'stock-critical';
    if (product.quantity <= 6) return 'stock-low';
    if (product.quantity <= 9) return 'stock-warning';
    return 'stock-healthy';
  };

  const getStockIcon = () => {
    return stockType === 'out-of-stock' ? Package : AlertTriangle;
  };

  const StockIcon = getStockIcon();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="low-stock-modal-backdrop" 
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="low-stock-modal-container"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="low-stock-modal-header">
            <div className="modal-title-section">
              <div className="modal-icon-wrapper">
                <StockIcon size={20} />
              </div>
              <div>
                <h2>
                  {stockType === 'low-stock' ? 'Low Stock Alert' : 'Out of Stock Items'}
                </h2>
                <p className="modal-subtitle">
                  {products.length} {products.length === 1 ? 'product' : 'products'} requiring attention
                </p>
              </div>
            </div>
            <button 
              className="modal-close-btn" 
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="low-stock-modal-content">
            {products.length === 0 ? (
              <motion.div 
                className="empty-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <TrendingDown size={48} />
                <p className="empty-state-title">All Clear</p>
                <p className="empty-state-description">
                  No {stockType === 'low-stock' ? 'low stock' : 'out of stock'} products at this time
                </p>
              </motion.div>
            ) : (
              <div className="products-table-wrapper">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th className="text-center">Stock Level</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <motion.tr
                        key={product.id}
                        onClick={() => onSelectProduct(product)}
                        className="product-row"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                      >
                        <td className="product-name">{product.name}</td>
                        <td>
                          <span className="category-tag">{product.category}</span>
                        </td>
                        <td className="text-center stock-quantity">
                          {product.quantity}
                        </td>
                        <td className="text-center">
                          <span className={`stock-badge ${getStockClass(product)}`}>
                            {getStockStatus(product)}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};