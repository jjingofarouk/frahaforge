import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, AlertTriangle, Skull, Hourglass } from 'lucide-react';
import { Product } from '../../services/inventoryService';
import './AlertModal.css';

interface ExpiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  expiryType: 'expiring-soon' | 'expired';
  onSelectProduct: (product: Product) => void;
}

export const ExpiryModal: React.FC<ExpiryModalProps> = ({
  isOpen,
  onClose,
  products,
  expiryType,
  onSelectProduct
}) => {
  const getExpiryStatus = (product: Product): { 
    text: string; 
    class: string; 
    days: string; 
    icon: React.ReactNode;
    severity: 'critical' | 'warning' | 'safe' | 'expired';
  } => {
    if (!product.expiration_date) {
      return { 
        text: 'NO DATE', 
        class: 'status-neutral', 
        days: 'No date',
        icon: <Calendar size={12} />,
        severity: 'safe'
      };
    }
    
    const expiryDate = new Date(product.expiration_date);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { 
        text: 'EXPIRED', 
        class: 'status-expired', 
        days: `${Math.abs(daysUntilExpiry)} days ago`,
        icon: <Skull size={12} />,
        severity: 'expired'
      };
    }
    if (daysUntilExpiry <= 7) {
      return { 
        text: 'CRITICAL', 
        class: 'status-critical', 
        days: `${daysUntilExpiry} days`,
        icon: <AlertTriangle size={12} />,
        severity: 'critical'
      };
    }
    if (daysUntilExpiry <= 30) {
      return { 
        text: 'WARNING', 
        class: 'status-warning', 
        days: `${daysUntilExpiry} days`,
        icon: <Clock size={12} />,
        severity: 'warning'
      };
    }
    return { 
      text: 'SAFE', 
      class: 'status-healthy', 
      days: `${daysUntilExpiry} days`,
      icon: <Hourglass size={12} />,
      severity: 'safe'
    };
  };

  const getSeverityCounts = () => {
    const expired = products.filter(p => {
      if (!p.expiration_date) return false;
      const days = Math.floor((new Date(p.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return days < 0;
    }).length;
    
    const critical = products.filter(p => {
      if (!p.expiration_date) return false;
      const days = Math.floor((new Date(p.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 7;
    }).length;
    
    const warning = products.filter(p => {
      if (!p.expiration_date) return false;
      const days = Math.floor((new Date(p.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return days > 7 && days <= 30;
    }).length;

    return { expired, critical, warning };
  };

  const severityCounts = getSeverityCounts();

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
          className={`alert-modal-container expiry-alert-modal ${expiryType}`}
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
          <div className={`alert-modal-header ${
            expiryType === 'expired' ? 'expired-header' : 'expiring-header'
          }`}>
            <div className="header-background"></div>
            <div className="modal-title-section">
              <div className="modal-icon-wrapper">
                {expiryType === 'expired' ? <Skull size={24} /> : <Clock size={24} />}
              </div>
              <div className="title-content">
                <h2>
                  {expiryType === 'expired' ? 'Expired Products' : 'Products Expiring Soon'}
                </h2>
                <p className="modal-subtitle">
                  {products.length} product{products.length !== 1 ? 's' : ''} requiring immediate action
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
            
            {/* Severity Indicators */}
            <div className="severity-indicators">
              {expiryType === 'expired' ? (
                <div className="severity-indicator expired">
                  <span className="severity-count">{severityCounts.expired}</span>
                  <span className="severity-label">Expired</span>
                </div>
              ) : (
                <>
                  {severityCounts.critical > 0 && (
                    <div className="severity-indicator critical">
                      <span className="severity-count">{severityCounts.critical}</span>
                      <span className="severity-label">Critical</span>
                    </div>
                  )}
                  {severityCounts.warning > 0 && (
                    <div className="severity-indicator warning">
                      <span className="severity-count">{severityCounts.warning}</span>
                      <span className="severity-label">Warning</span>
                    </div>
                  )}
                </>
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
                <Calendar size={64} className="empty-icon" />
                <p className="empty-state-title">No Expiry Issues</p>
                <p className="empty-state-description">
                  All products have healthy expiration dates
                </p>
              </motion.div>
            ) : (
              <div className="products-table-wrapper">
                <div className="table-header-stats">
                  {expiryType === 'expired' ? (
                    <div className="stat-pill expired">
                      <Skull size={14} />
                      <span>{severityCounts.expired} Expired</span>
                    </div>
                  ) : (
                    <>
                      <div className="stat-pill critical">
                        <AlertTriangle size={14} />
                        <span>{severityCounts.critical} Critical</span>
                      </div>
                      <div className="stat-pill warning">
                        <Clock size={14} />
                        <span>{severityCounts.warning} Warning</span>
                      </div>
                    </>
                  )}
                </div>
                
                <table className="products-table">
                  <thead>
                    <tr>
                      <th className="col-product">Product</th>
                      <th className="col-category">Category</th>
                      <th className="col-stock">Stock</th>
                      <th className="col-expiry">Expiry Date</th>
                      <th className="col-status">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => {
                      const status = getExpiryStatus(product);
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
                            backgroundColor: status.severity === 'expired' 
                              ? 'rgba(220, 38, 38, 0.04)' 
                              : status.severity === 'critical'
                                ? 'rgba(245, 158, 11, 0.04)'
                                : 'rgba(0, 0, 0, 0.02)',
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
                            <span className="quantity">{product.quantity}</span>
                          </td>
                          <td className="expiry-date">
                            <div className="expiry-info">
                              <span className="date">
                                {product.expiration_date 
                                  ? new Date(product.expiration_date).toLocaleDateString()
                                  : 'N/A'
                                }
                              </span>
                              <span className="days-remaining">
                                {status.days}
                              </span>
                            </div>
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
                {expiryType === 'expired' ? 'Mark as Disposed' : 'Create Sales Push'}
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};