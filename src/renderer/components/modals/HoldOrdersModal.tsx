// src/renderer/src/components/modals/HoldOrdersModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Trash2, RefreshCw, Search, AlertCircle } from 'lucide-react';
import { useOrdersStore } from '../../src/stores/ordersStore';
import { HoldOrder } from '../../types/orders.types';
import './HoldOrdersModal.css';

interface HoldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreOrder: (order: HoldOrder) => void;
  onDeleteOrder?: (orderId: string) => void;
}

const HoldOrdersModal: React.FC<HoldOrdersModalProps> = ({ 
  isOpen, 
  onClose, 
  onRestoreOrder,
  onDeleteOrder 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { 
    pendingOrders, 
    loading, 
    error,
    fetchPendingOrders,
    cancelOrder 
  } = useOrdersStore();

  useEffect(() => {
    if (isOpen) {
      fetchPendingOrders();
    }
  }, [isOpen, fetchPendingOrders]);

  const filteredOrders = pendingOrders.filter(order => {
    if (!order) return false; // Handle undefined orders
    
    const searchLower = searchQuery.toLowerCase();
    
    // Handle order number (convert to string for search)
    const orderNumberStr = order.order?.toString().toLowerCase() || '';
    
    // Handle reference number (might be undefined)
    const refNumberStr = order.ref_number?.toString().toLowerCase() || '';
    
    // Handle customer (could be number or object)
    let customerNameStr = '';
    if (typeof order.customer === 'object' && order.customer !== null) {
      customerNameStr = order.customer.name?.toLowerCase() || '';
    } else if (typeof order.customer === 'number') {
      customerNameStr = order.customer.toString().toLowerCase();
    }
    
    return (
      orderNumberStr.includes(searchLower) ||
      refNumberStr.includes(searchLower) ||
      customerNameStr.includes(searchLower)
    );
  });

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Unknown time';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleRestore = (order: HoldOrder) => {
    onRestoreOrder(order);
    onClose();
  };

  const handleDelete = async (orderId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const confirmed = window.confirm('Are you sure you want to delete this held order?');
    if (confirmed) {
      await cancelOrder(orderId);
      // Call the callback if provided
      if (onDeleteOrder) {
        onDeleteOrder(orderId);
      }
    }
  };

  const getOrderTotal = (order: HoldOrder): number => {
    return parseFloat(order.total) || 0;
  };

  const getTotalItems = (order: HoldOrder): number => {
    return order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="hold-orders-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className="hold-orders-modal-content"
            initial={{ scale: 0.95, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hold-orders-modal-header">
              <h4 className="hold-orders-modal-title">
                <ShoppingCart className="hold-orders-icon" size={24} />
                Held Orders ({pendingOrders.length})
              </h4>
              <button className="hold-orders-close-btn" onClick={onClose}>
                <X className="hold-orders-icon" size={24} />
              </button>
            </div>

            <div className="hold-orders-modal-body">
              <div className="form-group">
                <div className="input-group">
                  <span className="input-label">Search Orders</span>
                  <div className="search-input-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search by order ID, reference, or customer..."
                      className="form-control"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="hold-orders-list">
                {loading ? (
                  <div className="hold-orders-loading">
                    <div className="spinner"></div>
                    <p>Loading held orders...</p>
                  </div>
                ) : error ? (
                  <div className="hold-orders-error">
                    <AlertCircle size={48} className="error-icon" />
                    <p>{error}</p>
                    <button 
                      className="retry-btn"
                      onClick={fetchPendingOrders}
                    >
                      Retry
                    </button>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="hold-orders-empty">
                    <ShoppingCart size={48} className="empty-icon" />
                    <p>No held orders found</p>
                    {searchQuery && <small>Try adjusting your search</small>}
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <motion.div
                      key={order.id} 
                      className="hold-order-card"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="hold-order-header">
                        <div className="hold-order-id">
                          <strong>Order #{order.order}</strong>
                          {order.ref_number && (
                            <span className="hold-order-ref">
                              Ref: {order.ref_number}
                            </span>
                          )}
                          <span className="hold-order-time">
                            {formatTime(order.date)}
                          </span>
                        </div>
                        <div className="hold-order-actions">
                          <button
                            className="hold-order-action-btn restore"
                            onClick={() => handleRestore(order)}
                            title="Restore order to cart"
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button
                            className="hold-order-action-btn delete"
                            onClick={(e) => handleDelete(order.id, e)} 
                            title="Delete order"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="hold-order-details">
                        <div className="hold-order-info">
                          <div className="info-row">
                            <span className="info-label">Items:</span>
                            <span className="info-value">
                              {getTotalItems(order)}
                            </span>
                          </div>
                          {order.customer && (
                            <div className="info-row">
                              <span className="info-label">Customer:</span>
                              <span className="info-value">
                                {typeof order.customer === 'object' 
                                  ? order.customer.name 
                                  : `Customer ID: ${order.customer}`
                                }
                              </span>
                            </div>
                          )}
                          <div className="info-row">
                            <span className="info-label">Status:</span>
                            <span className="info-value status-badge">On Hold</span>
                          </div>
                        </div>

                        <div className="hold-order-total">
                          <div className="total-label">Total</div>
                          <div className="total-amount">
                            UGX {getOrderTotal(order).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="hold-order-items">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="hold-order-item">
                            <span className="item-name">
                              {item.product_name}
                            </span>
                            <span className="item-qty">
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                        {order.items && order.items.length > 3 && (
                          <div className="hold-order-item more-items">
                            +{order.items.length - 3} more items
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HoldOrdersModal;