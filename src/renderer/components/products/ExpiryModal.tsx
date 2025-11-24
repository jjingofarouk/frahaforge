import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Product } from '../../types/products.types';
import './ExpiryModal.css';

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
  const getExpiryStatus = (product: Product): string => {
    if (!product.expirationDate) return 'NO DATE';
    
    const expDate = new Date(product.expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'EXPIRED';
    if (diffDays <= 7) return 'CRITICAL';
    if (diffDays <= 30) return 'WARNING';
    return 'SAFE';
  };

  const getExpiryClass = (product: Product): string => {
    const status = getExpiryStatus(product);
    const classes = {
      'EXPIRED': 'expiry-expired',
      'CRITICAL': 'expiry-critical',
      'WARNING': 'expiry-warning',
      'SAFE': 'expiry-safe',
      'NO DATE': 'expiry-no-date'
    };
    return classes[status as keyof typeof classes];
  };

  const getDaysUntilExpiry = (product: Product): string => {
    if (!product.expirationDate) return 'No date';
    
    const expDate = new Date(product.expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="expiry-modal-backdrop" onClick={onClose}>
        <motion.div
          className="expiry-modal-container"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, type: "spring" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="expiry-modal-header">
            <div className="modal-title-section">
              {expiryType === 'expiring-soon' ? (
                <Clock size={24} color="#ea580c" />
              ) : (
                <Calendar size={24} color="#dc2626" />
              )}
              <div>
                <h2>{expiryType === 'expiring-soon' ? 'Expiring Soon' : 'Expired Products'}</h2>
                <p>{products.length} items</p>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="expiry-modal-content">
            {products.length === 0 ? (
              <div className="no-products-message">
                No {expiryType === 'expiring-soon' ? 'expiring soon' : 'expired'} products found.
              </div>
            ) : (
              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        onClick={() => onSelectProduct(product)}
                        className="product-row"
                      >
                        <td className="product-name">{product.name}</td>
                        <td className="product-category">{product.category}</td>
                        <td className="product-stock">{product.quantity}</td>
                        <td className="expiry-date">
                          {product.expirationDate 
                            ? new Date(product.expirationDate).toLocaleDateString()
                            : 'N/A'
                          }
                        </td>
                        <td>
                          <span className={`expiry-badge ${getExpiryClass(product)}`}>
                            <span className="expiry-badge-icon">
                              {getExpiryStatus(product) === 'EXPIRED' && <AlertTriangle size={12} />}
                              {getExpiryStatus(product) === 'CRITICAL' && <Clock size={12} />}
                              {getExpiryStatus(product) === 'WARNING' && <Calendar size={12} />}
                            </span>
                            {getExpiryStatus(product)} • {getDaysUntilExpiry(product)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};