import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, AlertTriangle, TrendingUp, Zap, BatteryWarning } from 'lucide-react';
import { Product } from '../../services/inventoryService';
import './AlertModal.css';

interface LowStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const LowStockModal: React.FC<LowStockModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct
}) => {
  const getStockStatus = (product: Product): { text: string; class: string; icon: React.ReactNode } => {
    const quantity = product.quantity || 0;
    const minStock = product.min_stock || 0;
    
    if (quantity === 0) return { 
      text: 'OUT OF STOCK', 
      class: 'status-critical', 
      icon: <BatteryWarning size={12} /> 
    };
    if (quantity <= minStock) return { 
      text: 'CRITICAL', 
      class: 'status-critical', 
      icon: <Zap size={12} /> 
    };
    if (quantity <= (minStock * 2)) return { 
      text: 'LOW STOCK', 
      class: 'status-warning', 
      icon: <AlertTriangle size={12} /> 
    };
    return { 
      text: 'HEALTHY', 
      class: 'status-healthy', 
      icon: <Package size={12} /> 
    };
  };

  const getUrgencyCounts = () => {
    const critical = products.filter(p => (p.quantity || 0) === 0 || (p.quantity || 0) <= (p.min_stock || 0)).length;
    const warning = products.filter(p => {
      const quantity = p.quantity || 0;
      const minStock = p.min_stock || 0;
      return quantity > minStock && quantity <= (minStock * 2);
    }).length;
    
    return { critical, warning };
  };

  const urgencyCounts = getUrgencyCounts();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="alert-modal-backdrop" 
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <motion.div
          className="alert-modal-container stock-alert-modal"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ 
            duration: 0.4, 
            type: "spring", 
            damping: 25, 
            stiffness: 300 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient background */}
          <div className="alert-modal-header critical-header">
            <div className="header-background"></div>
            <div className="modal-title-section">
              <div className="modal-icon-wrapper">
                <AlertTriangle size={24} />
              </div>
              <div className="title-content">
                <h2>Low Stock Alert</h2>
                <p className="modal-subtitle">
                  {products.length} product{products.length !== 1 ? 's' : ''} requiring immediate attention
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
            
            {/* Urgency Indicators */}
            <div className="urgency-indicators">
              {urgencyCounts.critical > 0 && (
                <div className="urgency-indicator critical">
                  <span className="urgency-count">{urgencyCounts.critical}</span>
                  <span className="urgency-label">Critical</span>
                </div>
              )}
              {urgencyCounts.warning > 0 && (
                <div className="urgency-indicator warning">
                  <span className="urgency-count">{urgencyCounts.warning}</span>
                  <span className="urgency-label">Warning</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="alert-modal-content">
            {products.length === 0 ? (
              <motion.div 
                className="empty-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TrendingUp size={64} className="empty-icon" />
                <p className="empty-state-title">Inventory Optimized</p>
                <p className="empty-state-description">
                  All products are well-stocked and ready for sales
                </p>
              </motion.div>
            ) : (
              <div className="products-table-wrapper">
                <div className="table-header-stats">
                  <div className="stat-pill critical">
                    <Zap size={14} />
                    <span>{urgencyCounts.critical} Critical</span>
                  </div>
                  <div className="stat-pill warning">
                    <AlertTriangle size={14} />
                    <span>{urgencyCounts.warning} Warning</span>
                  </div>
                </div>
                
                <table className="products-table">
                  <thead>
                    <tr>
                      <th className="col-product">Product</th>
                      <th className="col-category">Category</th>
                      <th className="col-stock">Current</th>
                      <th className="col-min">Minimum</th>
                      <th className="col-status">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => {
                      const status = getStockStatus(product);
                      return (
                        <motion.tr
                          key={product.id}
                          onClick={() => onSelectProduct(product)}
                          className="product-row"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ 
                            duration: 0.4, 
                            delay: index * 0.05,
                            ease: "easeOut" 
                          }}
                          whileHover={{ 
                            backgroundColor: 'rgba(239, 68, 68, 0.04)',
                            scale: 1.002
                          }}
                          whileTap={{ scale: 0.995 }}
                        >
                          <td className="product-name">
                            <div className="product-info">
                              <span className="name">{product.name}</span>
                              {product.supplier && (
                                <span className="supplier">{product.supplier}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="category-tag">{product.category}</span>
                          </td>
                          <td className="stock-quantity">
                            <span className={`quantity ${status.class}`}>
                              {product.quantity}
                            </span>
                          </td>
                          <td className="min-stock">
                            {product.min_stock || 'N/A'}
                          </td>
                          <td>
                            <span className={`status-badge ${status.class}`}>
                              <span className="status-icon">{status.icon}</span>
                              {status.text}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {products.length > 0 && (
            <motion.div 
              className="modal-footer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <button className="footer-btn primary" onClick={onClose}>
                Review All Products
              </button>
              <button className="footer-btn secondary" onClick={onClose}>
                Dismiss Alerts
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};