// src/renderer/src/components/orders/components/HoldOrderForm.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PauseCircle, ShoppingCart, CheckCircle } from 'lucide-react';
import { useOrdersStore } from '../../src/stores/ordersStore';

interface HoldOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentCart?: any;
  onHoldOrder?: (refNumber: string, cartData: any) => Promise<boolean>;
}

const HoldOrderForm: React.FC<HoldOrderFormProps> = ({ 
  isOpen, 
  onClose, 
  currentCart, 
  onHoldOrder 
}) => {
  const { 
    holdRefNumber, 
    setHoldRefNumber, 
    holdOrder, 
    loading,
    fetchPendingOrders
  } = useOrdersStore();

  const [localRefNumber, setLocalRefNumber] = useState(holdRefNumber);
  const [success, setSuccess] = useState(false);

  const handleNumberInput = (value: string) => {
    if (value === 'del') {
      setLocalRefNumber((prev) => prev.slice(0, -1));
    } else if (value === 'ac') {
      setLocalRefNumber('');
    } else if (value === 'enter') {
      handleSubmit();
    } else {
      setLocalRefNumber((prev) => prev + value);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!localRefNumber.trim()) {
      alert('Please enter a reference number');
      return;
    }

    if (!currentCart || currentCart.items.length === 0) {
      alert('Cart is empty. Please add items to cart before holding.');
      return;
    }

    try {
      let success = false;
      
      if (onHoldOrder) {
        success = await onHoldOrder(localRefNumber, currentCart);
      } else {
        success = await holdOrder(localRefNumber, currentCart);
      }

      if (success) {
        console.log('Order held successfully!');
        setSuccess(true);
        
        await fetchPendingOrders();
        
        setTimeout(() => {
          setSuccess(false);
          setLocalRefNumber('');
          onClose();
        }, 1500);
      } else {
        alert('Failed to hold order. Please try again.');
      }
    } catch (error) {
      console.error('Error holding order:', error);
      alert('Failed to hold order. Please try again.');
    }
  };

  const handleClose = () => {
    setHoldRefNumber(localRefNumber);
    setSuccess(false);
    setLocalRefNumber('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="hold-order-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleClose}
        >
          <motion.div
            className="hold-order-content"
            initial={{ scale: 0.95, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hold-order__header">
              <div className="hold-order__title">
                <PauseCircle size={24} />
                <h4>Hold Order</h4>
              </div>
              <button 
                className="hold-order__close-btn" 
                onClick={handleClose}
                disabled={loading}
              >
                <X size={24} />
              </button>
            </div>

            <div className="hold-order__body">
              {success ? (
                <div className="hold-order__success">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle size={48} className="hold-order__success-icon" />
                  </motion.div>
                  <h5>Order Held Successfully!</h5>
                  <p>Reference: {localRefNumber}</p>
                  <p className="hold-order__success-hint">
                    The order has been saved to pending orders.
                  </p>
                </div>
              ) : currentCart && currentCart.items.length > 0 ? (
                <>
                  <div className="hold-order__cart-summary">
                    <h5>Cart Summary</h5>
                    <div className="hold-order__cart-items">
                      {currentCart.items.slice(0, 3).map((item: any) => (
                        <div key={item.id} className="hold-order__cart-item">
                          <span className="hold-order__cart-item-name">{item.product_name}</span>
                          <span className="hold-order__cart-item-qty">x{item.quantity}</span>
                        </div>
                      ))}
                      {currentCart.items.length > 3 && (
                        <div className="hold-order__cart-more">
                          +{currentCart.items.length - 3} more items
                        </div>
                      )}
                    </div>
                    <div className="hold-order__cart-totals">
                      <div className="hold-order__cart-total-row">
                        <span>Subtotal:</span>
                        <span>UGX {currentCart.subtotal?.toFixed(2)}</span>
                      </div>
                      <div className="hold-order__cart-total-row">
                        <span>Tax:</span>
                        <span>UGX {currentCart.tax?.toFixed(2)}</span>
                      </div>
                      <div className="hold-order__cart-total-row hold-order__cart-total-row--grand">
                        <span>Total:</span>
                        <span>UGX {currentCart.total?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="hold-order__form-group">
                      <label htmlFor="refNumber" className="hold-order__label">
                        Reference Number *
                      </label>
                      <input
                        type="text"
                        id="refNumber"
                        value={localRefNumber}
                        onChange={(e) => setLocalRefNumber(e.target.value)}
                        placeholder="Enter order reference"
                        className="hold-order__input"
                        disabled={loading}
                        autoFocus
                        required
                      />
                      <p className="hold-order__hint">
                        Enter a unique reference to identify this held order
                      </p>
                    </div>

                    <div className="hold-order__divider"></div>

                    <div className="hold-order__keypad">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <motion.button
                          key={num}
                          type="button"
                          className="hold-order__keypad-btn"
                          onClick={() => handleNumberInput(num.toString())}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={loading}
                        >
                          {num}
                        </motion.button>
                      ))}
                      <motion.button
                        type="button"
                        className="hold-order__keypad-btn hold-order__keypad-delete"
                        onClick={() => handleNumberInput('del')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                      >
                        ⌫
                      </motion.button>
                      <motion.button
                        type="button"
                        className="hold-order__keypad-btn"
                        onClick={() => handleNumberInput('0')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                      >
                        0
                      </motion.button>
                      <motion.button
                        type="button"
                        className="hold-order__keypad-btn hold-order__keypad-clear"
                        onClick={() => handleNumberInput('ac')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                      >
                        AC
                      </motion.button>
                    </div>

                    <div className="hold-order__actions">
                      <motion.button
                        type="button"
                        className="hold-order__cancel-btn"
                        onClick={handleClose}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="submit"
                        className="hold-order__submit-btn"
                        disabled={!localRefNumber.trim() || loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {loading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              style={{ display: 'inline-block', marginRight: '8px' }}
                            >
                              <PauseCircle size={16} />
                            </motion.div>
                            Holding...
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={16} />
                            Hold Order
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="hold-order__empty-cart">
                  <ShoppingCart size={48} />
                  <p>Your cart is empty</p>
                  <p className="hold-order__empty-hint">
                    Add items to your cart before holding an order
                  </p>
                  <button 
                    className="hold-order__cancel-btn"
                    onClick={handleClose}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HoldOrderForm;