// src/renderer/src/components/orders/OrdersPage.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Trash2, User, Phone, ShoppingCart, Calendar, Package, Eye } from 'lucide-react';
import PaymentModal from '../modals/PaymentModal';
import OrderDetailsModal from './OrderDetailsModal';
import './OrdersPage.css';

interface HoldOrder {
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
  items: Array<{
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    category: string;
  }>;
  created_at: string;
  status: number;
}

interface OrdersPageProps {
  onViewTransaction?: (id: string) => void;
  currentCart?: any;
  onProcessOrder?: (order: HoldOrder) => void;
}

const OrdersPage: React.FC<OrdersPageProps> = () => {
  const [holdOrders, setHoldOrders] = useState<HoldOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<HoldOrder | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [orderToView, setOrderToView] = useState<HoldOrder | null>(null);

  // Load hold orders from localStorage
  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem('fraha-hold-orders') || '[]');
    setHoldOrders(savedOrders);
  }, []);

  const handleViewDetails = (order: HoldOrder) => {
    setOrderToView(order);
    setIsDetailsOpen(true);
  };

  const handleProcessOrder = (order: HoldOrder) => {
    console.log('🔄 Processing order:', order);
    setSelectedOrder(order);
    setIsPaymentOpen(true);
  };

  const handleDeleteOrder = (orderId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this hold order?');
    if (!confirmed) return;

    const updatedOrders = holdOrders.filter(order => order.id !== orderId);
    setHoldOrders(updatedOrders);
    localStorage.setItem('fraha-hold-orders', JSON.stringify(updatedOrders));
    console.log('✅ Hold order deleted');
  };

  const handlePaymentComplete = (paymentData: any) => {
    console.log('✅ Payment completed for hold order:', paymentData);
    setIsPaymentOpen(false);
    
    if (paymentData.success && selectedOrder) {
      // Remove the processed order from hold orders
      const updatedOrders = holdOrders.filter(order => order.id !== selectedOrder.id);
      setHoldOrders(updatedOrders);
      localStorage.setItem('fraha-hold-orders', JSON.stringify(updatedOrders));
      
      alert(`Order #${selectedOrder.order_number} processed successfully!`);
      setSelectedOrder(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
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

  const getTotalItems = (order: HoldOrder) => {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="orders-container">
      <motion.div
        className="orders-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="orders-header__content">
          <div className="orders-header__title">
            <h1>Pending Hold Orders</h1>
            <p>Manage orders that are on hold - Process or delete them</p>
          </div>
          <div className="orders-header__stats">
            <span>{holdOrders.length} pending orders</span>
          </div>
        </div>
      </motion.div>

      <div className="orders-content">
        <AnimatePresence mode="popLayout">
          {holdOrders.length === 0 ? (
            <motion.div
              className="orders-empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Package size={48} className="orders-empty__icon" />
              <h3>No Pending Orders</h3>
              <p>There are no orders currently on hold.</p>
            </motion.div>
          ) : (
            <div className="hold-orders-grid">
              {holdOrders.map((order) => (
                <motion.div
                  key={order.id}
                  className="hold-order-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="hold-order-card__header">
                    <div className="hold-order-card__info">
                      <h4>Order #{order.order_number}</h4>
                      <span className="hold-order-card__ref">
                        Ref: {order.ref_number}
                      </span>
                      <span className="hold-order-card__time">
                        <Calendar size={14} />
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    <div className="hold-order-card__amount">
                      UGX {formatCurrency(order.total)}
                    </div>
                  </div>

                  <div className="hold-order-card__customer">
                    <div className="hold-order-card__customer-info">
                      <User size={14} />
                      <span className="hold-order-card__customer-name">
                        {order.customer_name}
                      </span>
                    </div>
                    {order.customer_phone && (
                      <div className="hold-order-card__customer-phone">
                        <Phone size={14} />
                        <span>{order.customer_phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="hold-order-card__items-info">
                    <div className="hold-order-card__items-stats">
                      <ShoppingCart size={14} />
                      <span className="hold-order-card__items-count">
                        {getTotalItems(order)} total items ({order.items.length} products)
                      </span>
                    </div>
                    <div className="hold-order-card__items-preview">
                      {order.items.slice(0, 2).map((item, index) => (
                        <span key={index} className="item-preview">
                          {item.product_name} (x{item.quantity})
                        </span>
                      ))}
                      {order.items.length > 2 && (
                        <span className="more-items">+{order.items.length - 2} more</span>
                      )}
                    </div>
                  </div>

                  <div className="hold-order-card__totals">
                    <div className="total-row">
                      <span>Subtotal:</span>
                      <span>UGX {formatCurrency(order.subtotal)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="total-row discount">
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
                    <div className="total-row grand-total">
                      <span>Total:</span>
                      <span>UGX {formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  <div className="hold-order-card__actions">
                    <motion.button
                      className="hold-order-card__btn hold-order-card__btn--view"
                      onClick={() => handleViewDetails(order)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Eye size={18} />
                      <span>View Details</span>
                    </motion.button>
                    <motion.button
                      className="hold-order-card__btn hold-order-card__btn--process"
                      onClick={() => handleProcessOrder(order)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <CheckCircle size={18} />
                      <span>Process</span>
                    </motion.button>
                    <motion.button
                      className="hold-order-card__btn hold-order-card__btn--delete"
                      onClick={() => handleDeleteOrder(order.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setOrderToView(null);
        }}
        order={orderToView}
      />

      {/* Payment Modal for Processing Hold Orders */}
      {selectedOrder && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
            setSelectedOrder(null);
          }}
          totalAmount={selectedOrder.total}
          cart={selectedOrder.items.map(item => ({
            id: item.product_id,
            product_name: item.product_name,
            price: item.price,
            quantity: item.quantity,
            barcode: '',
            quantityInStock: 0,
            category: item.category,
            img: '',
            description: ''
          }))}
          customer={{
            id: 0,
            name: selectedOrder.customer_name,
            phone: selectedOrder.customer_phone,
            email: selectedOrder.customer_email
          }}
          discount={selectedOrder.discount}
          tax={selectedOrder.tax}
          subtotal={selectedOrder.subtotal}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default OrdersPage;