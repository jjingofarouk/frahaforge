// src/renderer/src/components/pos/PosCart/PosCart.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, ShoppingCart, Search, X, Users } from 'lucide-react';
import Lottie from 'lottie-react';
import { CartItemRow } from './CartItemRow';
import { CartTotals } from './CartTotals';
import { CartActions } from '../CartActions';
import NewCustomer from '../../modals/NewCustomer';
import HoldOrdersModal from '../../modals/HoldOrdersModal';
import { usePosStore } from '../../../src/stores/posStore';
import { customersService, Customer } from '../../../services/customerService';
import { PosCartProps, CartItem } from '../../../src/types/pos.types';
import cartAnimation from './cart.json';
import './PosCart.css';

// Safe helpers
const safeIdToString = (id: any): string => {
  if (id === null || id === undefined) return '';
  return String(id);
};

const safeNumber = (val: any): number => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const safeString = (val: any): string => String(val || '');

export const PosCart: React.FC<PosCartProps> = ({
  cart,
  customers = [],
  selectedCustomer,
  discount = 0,
  isDiscountPercentage = false,
  taxRate = 0,
  totalItems = 0,
  subtotal = 0,
  discountAmount = 0,
  tax = 0,
  grossPrice = 0,
  selectedCust,
  products = [],
  onCustomerChange,
  onOpenNewCustomer,
  onRemoveItem,
  onQuantityChange,
  onDiscountChange,
  onToggleDiscountType,
  onCancel,
  onHoldOrder, // This will receive the hold data
  onOpenPayment,
  onPaymentComplete,
}) => {
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isHoldOrdersModalOpen, setIsHoldOrdersModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [holdOrders, setHoldOrders] = useState<any[]>([]); // Store hold orders locally

  // Use store for cart operations
  const { handlePaymentComplete, clearCart } = usePosStore();

  // Customer search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await customersService.searchCustomers(searchQuery);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (err) {
        console.error(err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCustomerSelect = (customer: Customer) => {
    if (onCustomerChange) onCustomerChange(customer.id.toString());
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleClearCustomer = () => {
    if (onCustomerChange) onCustomerChange('');
  };

  const handleOpenNewCustomer = () => {
    if (onOpenNewCustomer) {
      onOpenNewCustomer();
    } else {
      setIsNewCustomerOpen(true);
    }
  };

  // Enhanced payment handler
  const handlePaymentSuccess = (paymentData: any) => {
    console.log('✅ Payment completion callback received:', paymentData);
    
    if (onPaymentComplete) {
      onPaymentComplete(paymentData);
    }
  };

  // NEW: Handle hold order from CartActions
  const handleHoldOrder = (holdData: any) => {
    console.log('🔄 Received hold order data:', holdData);
    
    // Add to local hold orders
    setHoldOrders(prev => [...prev, holdData]);
    
    // Also save to localStorage for persistence
    const savedOrders = JSON.parse(localStorage.getItem('fraha-hold-orders') || '[]');
    localStorage.setItem('fraha-hold-orders', JSON.stringify([...savedOrders, holdData]));
    
    alert(`Order held successfully! Reference: ${holdData.ref_number}`);
  };

  // Handle restoring order from hold
  const handleRestoreOrder = (order: any) => {
    console.log('🔄 Restoring held order to cart:', order);
    // This would be implemented to add the held order items to the current cart
    setIsHoldOrdersModalOpen(false);
    alert(`Order #${order.order_number} restored to cart. You can now make changes before payment.`);
  };

  // Load hold orders from localStorage on component mount
  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem('fraha-hold-orders') || '[]');
    setHoldOrders(savedOrders);
  }, []);

  const currentCartData = {
    items: cart || [],
    subtotal: subtotal || 0,
    tax: tax || 0,
    total: grossPrice || 0,
    discount: discountAmount || 0,
    customer: selectedCust,
  };

  return (
    <motion.div
      className="pos-cart"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="pos-cart-header">
        <div className="pos-cart-title">
          <ShoppingCart size={20} />
          <span>Current Sale ({totalItems || 0})</span>
        </div>
      </div>

      {/* Customer Section */}
      <div className="pos-cart-customer-section">
        <div className="customer-search-header">
          <Users size={16} />
          <span>Customer</span>
          {!selectedCust && (
            <span className="customer-required-badge">Default customer is Walk-in Customer | Required for Pending Orders. </span>
          )}
        </div>

        <div className="customer-search-container">
          <div className="customer-search-input-wrapper">
            <Search size={16} className="customer-search-icon" />
            <input
              type="text"
              className="customer-search-input"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSearchResults(true)}
            />
            {searchQuery && (
              <button className="customer-search-clear" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <motion.button
            className="customer-add-btn"
            onClick={handleOpenNewCustomer}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserPlus size={16} /> Add
          </motion.button>
        </div>

        <AnimatePresence>
          {showSearchResults && searchResults.length > 0 && (
            <motion.div
              className="customer-search-results"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {searchResults.map((c) => (
                <div
                  key={c.id}
                  className="customer-search-result"
                  onClick={() => handleCustomerSelect(c)}
                >
                  <div className="customer-result-name">{c.name}</div>
                  {c.phone && <div className="customer-result-details">{c.phone}</div>}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {selectedCust && (
          <div className="selected-customer-info">
            <div className="selected-customer-details">
              <span className="customer-name">{selectedCust.name}</span>
              {selectedCust.phone && <span className="customer-phone">{selectedCust.phone}</span>}
            </div>
            <button className="clear-customer-btn" onClick={handleClearCustomer}>
              <X size={14} />
            </button>
          </div>
        )}

        {isSearching && <div className="customer-search-loading">Searching...</div>}
        {showSearchResults && searchQuery && !isSearching && searchResults.length === 0 && (
          <div className="customer-no-results">
            <span>No customers found</span>
            <button className="add-customer-link" onClick={handleOpenNewCustomer}>
              Add new customer
            </button>
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="pos-cart-items">
        <AnimatePresence mode="popLayout">
          {!cart || cart.length === 0 ? (
            <motion.div className="pos-cart-empty">
              <div className="lottie-cart-container">
                <Lottie animationData={cartAnimation} loop={true} style={{ width: 120, height: 120 }} />
              </div>
              <p>Your cart is empty</p>
              <p className="pos-cart-empty-hint">Select products to add to cart</p>
            </motion.div>
          ) : (
            <div className="pos-cart-table">
              <div className="pos-cart-table-header">
                <div>#</div>
                <div>Item</div>
                <div>Qty</div>
                <div>Total</div>
                <div></div>
              </div>
              {cart.map((item, index) => (
                <CartItemRow
                  key={`${item?.id || ''}-${index}`}
                  item={item}
                  index={index}
                  onRemove={onRemoveItem}
                  onQuantityChange={onQuantityChange}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Totals & Actions */}
      {cart && cart.length > 0 && (
        <>
          <CartTotals
            totalItems={totalItems}
            subtotal={subtotal}
            discount={discount}
            discountAmount={discountAmount}
            isDiscountPercentage={isDiscountPercentage}
            tax={tax}
            grossPrice={grossPrice}
            selectedCust={selectedCust}
            taxRate={taxRate}
            onDiscountChange={onDiscountChange}
            onToggleDiscountType={onToggleDiscountType}
          />

          <CartActions
            cartLength={cart.length}
            grossPrice={grossPrice}
            products={products}
            onCancel={onCancel}
            onHoldOrder={handleHoldOrder} // Pass the handler
            onOpenHoldOrders={() => setIsHoldOrdersModalOpen(true)}
            onOpenPayment={onOpenPayment}
            onPaymentComplete={handlePaymentSuccess}
            selectedCustomer={selectedCust}
            currentCart={currentCartData}
          />
        </>
      )}

      {/* Modals */}
      <NewCustomer
        isOpen={isNewCustomerOpen}
        onClose={() => setIsNewCustomerOpen(false)}
        onCustomerAdded={(newCustomer) => {
          if (onCustomerChange) onCustomerChange(newCustomer.id.toString());
          setIsNewCustomerOpen(false);
        }}
      />

      <HoldOrdersModal
        isOpen={isHoldOrdersModalOpen}
        onClose={() => setIsHoldOrdersModalOpen(false)}
        onRestoreOrder={handleRestoreOrder}
        holdOrders={holdOrders} // Pass the hold orders
        onUpdateHoldOrders={setHoldOrders} // Pass setter to update orders
      />
    </motion.div>
  );
};

export default PosCart;