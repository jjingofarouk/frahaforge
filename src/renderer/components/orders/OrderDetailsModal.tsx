// src/renderer/src/components/modals/OrderDetailsModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Mail, Calendar, ShoppingCart, Package } from 'lucide-react';
import './OrderDetailsModal.css';

interface OrderItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  category: string;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    order_number: number;
    ref_number: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    items: OrderItem[];
    created_at: string;
    status: number;
  } | null;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order }) => {
  if (!order) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalItems = () => {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="order-details-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="order-details-modal"
            initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
            transition={{ duration: 0.2 }}
          >
            <div className="order-details-header">
              <div className="order-details-header__info">
                <h2>Order Details</h2>
                <div className="order-details-header__meta">
                  <span className="order-number">Order #{order.order_number}</span>
                  <span className="order-ref">Ref: {order.ref_number}</span>
                </div>
              </div>
              <button className="order-details-close" onClick={onClose}>
                <X size={24} />
              </button>
            </div>

            <div className="order-details-content">
              {/* Customer Information */}
              <div className="order-details-section">
                <h3 className="section-title">
                  <User size={18} />
                  Customer Information
                </h3>
                <div className="customer-details">
                  <div className="customer-detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{order.customer_name}</span>
                  </div>
                  {order.customer_phone && (
                    <div className="customer-detail-row">
                      <Phone size={14} />
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{order.customer_phone}</span>
                    </div>
                  )}
                  {order.customer_email && (
                    <div className="customer-detail-row">
                      <Mail size={14} />
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{order.customer_email}</span>
                    </div>
                  )}
                  <div className="customer-detail-row">
                    <Calendar size={14} />
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{formatDate(order.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="order-details-section">
                <h3 className="section-title">
                  <Package size={18} />
                  Order Summary
                </h3>
                <div className="order-summary">
                  <div className="summary-row">
                    <ShoppingCart size={14} />
                    <span>Total Items:</span>
                    <span className="summary-value">{getTotalItems()} items</span>
                  </div>
                  <div className="summary-row">
                    <span>Unique Products:</span>
                    <span className="summary-value">{order.items.length}</span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="order-details-section">
                <h3 className="section-title">
                  <ShoppingCart size={18} />
                  Items ({order.items.length})
                </h3>
                <div className="order-items-list">
                  <div className="order-items-header">
                    <span className="item-header-name">Product</span>
                    <span className="item-header-qty">Qty</span>
                    <span className="item-header-price">Price</span>
                    <span className="item-header-total">Total</span>
                  </div>
                  <div className="order-items-body">
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item-row">
                        <div className="item-name">
                          <span className="item-product-name">{item.product_name}</span>
                          <span className="item-category">{item.category}</span>
                        </div>
                        <span className="item-qty">×{item.quantity}</span>
                        <span className="item-price">UGX {formatCurrency(item.price)}</span>
                        <span className="item-total">UGX {formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="order-details-section order-totals-section">
                <h3 className="section-title">Payment Summary</h3>
                <div className="order-totals">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>UGX {formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="total-row discount-row">
                      <span>Discount:</span>
                      <span>- UGX {formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div className="total-row">
                      <span>Tax:</span>
                      <span>UGX {formatCurrency(order.tax)}</span>
                    </div>
                  )}
                  <div className="total-row grand-total-row">
                    <span>Total Amount:</span>
                    <span>UGX {formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OrderDetailsModal;