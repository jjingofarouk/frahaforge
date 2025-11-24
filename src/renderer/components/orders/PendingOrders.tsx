// src/renderer/src/components/orders/components/PendingOrders.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, Play, Trash2, Package, AlertCircle, Phone, User, ShoppingCart } from 'lucide-react';
import { useOrdersStore } from '../../src/stores/ordersStore';
import { Order, Customer } from '../../types/orders.types';

interface PendingOrdersProps {
  onViewOrder: (order: Order) => void;
}

const PendingOrders: React.FC<PendingOrdersProps> = ({ onViewOrder }) => {
  const { 
    pendingOrders, 
    loading, 
    error, 
    searchQuery, 
    setSearchQuery,
    processOrder,
    cancelOrder,
    searchOrders 
  } = useOrdersStore();

  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredOrders(searchOrders(searchQuery));
    } else {
      setFilteredOrders(pendingOrders);
    }
  }, [pendingOrders, searchQuery, searchOrders]);

  const handleProcessOrder = async (orderId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const success = await processOrder(orderId);
    if (success) {
      console.log('Order processed successfully');
    }
  };

  const handleCancelOrder = async (orderId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const confirmed = window.confirm('Are you sure you want to cancel this order?');
    if (confirmed) {
      const success = await cancelOrder(orderId);
      if (success) {
        console.log('Order cancelled successfully');
      }
    }
  };

  // IMPROVED: Better customer info extraction
  const getCustomerInfo = (order: Order): { name: string; phone?: string } => {
    console.log('🔍 Raw customer data for order:', order.id, order.customer);
    
    // Case 1: Customer is a full object
    if (typeof order.customer === 'object' && order.customer !== null) {
      const customer = order.customer as Customer;
      return {
        name: customer.name || 'Unknown Customer',
        phone: customer.phone
      };
    }
    
    // Case 2: Customer data is in separate fields
    if (order.customer_name) {
      return {
        name: order.customer_name,
        phone: order.customer_phone
      };
    }
    
    // Case 3: Fallback to walk-in customer
    return {
      name: 'Walk-in Customer',
      phone: undefined
    };
  };

  // IMPROVED: Better items counting
  const getTotalItemsCount = (order: Order): number => {
    console.log('📦 Order items for counting:', order.id, order.items);
    
    if (!order.items || !Array.isArray(order.items)) {
      console.log('❌ No valid items array found for order:', order.id);
      return 0;
    }
    
    const total = order.items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      return total + quantity;
    }, 0);
    
    console.log(`✅ Order ${order.id} has ${total} total items`);
    return total;
  };

  const getUniqueItemsCount = (order: Order): number => {
    if (!order.items || !Array.isArray(order.items)) {
      return 0;
    }
    return order.items.length;
  };

  const getItemsPreview = (order: Order): string => {
    if (!order.items || order.items.length === 0) {
      return 'No items';
    }
    
    const topItems = order.items.slice(0, 2).map(item => 
      `${item.product_name || 'Unknown Product'} (x${item.quantity || 0})`
    ).join(', ');
    
    if (order.items.length > 2) {
      return `${topItems} +${order.items.length - 2} more`;
    }
    
    return topItems;
  };

  const getTotalAmount = (order: Order): number => {
    return parseFloat(order.total) || 0;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    if (!dateString) return 'Unknown time';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="orders-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Package size={32} />
        </motion.div>
        <p>Loading pending orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-error">
        <AlertCircle size={32} />
        <p>{error}</p>
        <button onClick={() => useOrdersStore.getState().fetchPendingOrders()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="pending-orders">
      <div className="pending-orders__toolbar">
        <div className="pending-orders__search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by order ID, reference, customer name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pending-orders__search-input"
          />
        </div>
        <div className="pending-orders__stats">
          <span>{filteredOrders.length} pending orders</span>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {filteredOrders.length === 0 ? (
          <motion.div
            className="orders-empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Package size={48} className="orders-empty__icon" />
            <h3>No Pending Orders</h3>
            <p>There are no orders on hold.</p>
          </motion.div>
        ) : (
          <div className="pending-orders__grid">
            {filteredOrders.map((order, index) => {
              const customerInfo = getCustomerInfo(order);
              const totalItemsCount = getTotalItemsCount(order);
              const uniqueItemsCount = getUniqueItemsCount(order);
              const totalAmount = getTotalAmount(order);
              const itemsPreview = getItemsPreview(order);
              
              console.log(`📊 Order ${order.id} details:`, {
                customerInfo,
                totalItemsCount,
                uniqueItemsCount,
                items: order.items
              });
              
              return (
                <motion.div
                  key={order.id}
                  className="pending-order-card pending-order-card--pending"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onClick={() => onViewOrder(order)}
                >
                  <div className="pending-order-card__header">
                    <div className="pending-order-card__info">
                      <h4>Order #{order.order}</h4>
                      {order.ref_number && (
                        <span className="pending-order-card__ref">
                          Ref: {order.ref_number}
                        </span>
                      )}
                      <span className="pending-order-card__time">
                        {formatTimeAgo(order.date)}
                      </span>
                    </div>
                    <div className="pending-order-card__amount">
                      UGX {totalAmount.toFixed(2)}
                    </div>
                  </div>

                  {/* FIXED: Enhanced Customer Information */}
                  <div className="pending-order-card__customer">
                    <div className="pending-order-card__customer-info">
                      <User size={14} />
                      <span className="pending-order-card__customer-name">
                        {customerInfo.name}
                      </span>
                    </div>
                    {customerInfo.phone && (
                      <div className="pending-order-card__customer-phone">
                        <Phone size={14} />
                        <span>{customerInfo.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* FIXED: Enhanced Items Information */}
                  <div className="pending-order-card__items-info">
                    <div className="pending-order-card__items-stats">
                      <ShoppingCart size={14} />
                      <span className="pending-order-card__items-count">
                        {totalItemsCount} total items ({uniqueItemsCount} products)
                      </span>
                    </div>
                    <div className="pending-order-card__items-preview">
                      {itemsPreview}
                    </div>
                  </div>

                  <div className="pending-order-card__details">
                    <div className="pending-order-card__date">
                      {formatDate(order.date)}
                    </div>
                    <div className="pending-order-card__status pending-order-card__status--pending">
                      On Hold
                    </div>
                  </div>

                  <div className="pending-order-card__actions">
                    <motion.button
                      className="pending-order-card__btn pending-order-card__btn--view"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewOrder(order);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="View Full Details"
                    >
                      <Eye size={18} />
                      <span className="pending-order-card__btn-text">Details</span>
                    </motion.button>
                    <motion.button
                      className="pending-order-card__btn pending-order-card__btn--process"
                      onClick={(e) => handleProcessOrder(order.id, e)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Process Order to Payment"
                    >
                      <Play size={18} />
                      <span className="pending-order-card__btn-text">Process</span>
                    </motion.button>
                    <motion.button
                      className="pending-order-card__btn pending-order-card__btn--cancel"
                      onClick={(e) => handleCancelOrder(order.id, e)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Cancel Order"
                    >
                      <Trash2 size={18} />
                      <span className="pending-order-card__btn-text">Cancel</span>
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PendingOrders;