// src/renderer/src/components/modals/PaymentModal.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Printer, RefreshCw, CreditCard, Smartphone, DollarSign } from 'lucide-react';
import { transactionsService } from '../../services/transactionsService';
import authService from '../../services/authService';
import { Receipt, ReceiptRef } from '../../src/components/receipt/Receipt';
import { usePosStore } from '../../src/stores/posStore';
import { globalDataRefresh } from '../pos/GlobalPosDataManager';
import { PaymentData, CartItem, Customer } from '../../src/types/pos.types';
import './PaymentModal.css';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  cart: CartItem[];
  customer?: Customer;
  discount: number;
  tax: number;
  subtotal: number;
  onPaymentComplete: (paymentData: PaymentData) => void;
}

const formatUGX = (amount: number): string => {
  return new Intl.NumberFormat('en-UG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  cart,
  customer,
  discount,
  tax,
  subtotal,
  onPaymentComplete
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [changeAmount, setChangeAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isRefreshingData, setIsRefreshingData] = useState(false);

  const receiptRef = useRef<ReceiptRef>(null);
  const { handlePaymentComplete, clearCart } = usePosStore();

  // NEW: Function to refresh product data after transaction
  const refreshProductData = useCallback(async () => {
    console.log('🔄 PaymentModal: Refreshing product data after transaction...');
    setIsRefreshingData(true);
    try {
      await globalDataRefresh.refreshProductsImmediately();
      console.log('✅ PaymentModal: Product data refreshed successfully');
    } catch (error) {
      console.error('❌ PaymentModal: Failed to refresh product data:', error);
    } finally {
      setIsRefreshingData(false);
    }
  }, []);

  // Memoized calculations
  const calculateChange = useCallback((paid: number, total: number) => {
    const change = paid - total;
    setChangeAmount(change >= 0 ? change : 0);
  }, []);

  // Effects
  useEffect(() => {
    if (isOpen) {
      setAmountPaid(totalAmount.toString());
      calculateChange(totalAmount, totalAmount);
    }
  }, [isOpen, totalAmount, calculateChange]);

  useEffect(() => {
    if (amountPaid) {
      const paid = parseFloat(amountPaid) || 0;
      calculateChange(paid, totalAmount);
    }
  }, [amountPaid, totalAmount, calculateChange]);

  // Handlers
  const handleAmountChange = useCallback((value: string) => {
    const numericValue = value.replace(/[^\d.]/g, '');
    setAmountPaid(numericValue);
  }, []);

  const handlePrintReceipt = useCallback(() => {
    receiptRef.current?.handlePrint();
  }, []);

  // ENHANCED: Clear cart AND refresh data when payment is successful
  const handlePaymentSubmit = useCallback(async () => {
    if (!amountPaid || parseFloat(amountPaid) < totalAmount) {
      alert('Amount paid must be greater than or equal to total amount');
      return;
    }

    setIsProcessing(true);

    try {
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser?.id || !currentUser?.fullname) {
        throw new Error('User information not found. Please log in again.');
      }

      // FIXED: Convert customer_id to number properly
      const customerId = customer?.id ? Number(customer.id) : 0; // Use 0 for walk-in customers
      const customerName = customer?.name || 'Walk-in Customer';

      const transactionData = {
        customer_id: customerId,
        customer_name: customerName,
        discount,
        subtotal,
        tax,
        total: totalAmount,
        paid: parseFloat(amountPaid),
        change_amount: changeAmount,
        payment_type: paymentMethod,
        payment_info: '',
        till: 1,
        user_id: Number(currentUser.id),
        user_name: currentUser.fullname,
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.product_name,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
          quantity: item.quantity,
          category: item.category || 'Uncategorized'
        }))
      };

      console.log('💳 Processing payment transaction...', transactionData);

      const result = await transactionsService.createTransaction(transactionData);

      if (result.success) {
        console.log('✅ Payment transaction successful, clearing cart and refreshing data...', result);
        
        // 🛒 CLEAR CART IMMEDIATELY HERE!
        console.log('🛒 Clearing cart from PaymentModal...');
        handlePaymentComplete();
        clearCart();
        
        // 🔄 REFRESH PRODUCT DATA TO UPDATE STOCK AMOUNTS
        console.log('🔄 Refreshing product data to reflect stock changes...');
        await refreshProductData();
        
        setTransactionId(result.id);
        setPaymentSuccess(true);
        
        const receiptData = {
          transactionId: result.id,
          orderNumber: result.order_number,
          items: cart.map(item => ({
            product_id: item.id,
            product_name: item.product_name,
            price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
            quantity: item.quantity,
            category: item.category || 'Uncategorized'
          })),
          subtotal,
          tax,
          discount,
          total: totalAmount,
          amountPaid: parseFloat(amountPaid),
          change: changeAmount,
          paymentMethod,
          customer: customer ? {
            name: customer.name,
            phone: customer.phone,
            email: customer.email
          } : undefined,
          user: {
            name: currentUser.fullname
          },
          timestamp: new Date().toISOString()
        };

        setReceiptData(receiptData);

        setTimeout(() => {
          setShowReceipt(true);
        }, 1200);

      } else {
        throw new Error(result.message || 'Transaction failed');
      }

    } catch (error: any) {
      console.error('❌ Payment processing failed:', error);
      alert(`Payment failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [
    amountPaid, 
    totalAmount, 
    customer, 
    discount, 
    subtotal, 
    tax, 
    changeAmount, 
    paymentMethod, 
    cart, 
    handlePaymentComplete, 
    clearCart, 
    refreshProductData
  ]);

  // ENHANCED: Simplified receipt close handler
  const handleReceiptClose = useCallback(() => {
    console.log('✅ Closing receipt, cart cleared and data refreshed');
    
    // Prepare payment data for callback
    const paymentData: PaymentData = {
      success: true,
      method: paymentMethod,
      amount: totalAmount,
      change: changeAmount,
      transactionId: transactionId || 0,
      orderNumber: receiptData?.orderNumber,
      clearCart: true,
      dataRefreshed: true,
      message: 'Payment processed successfully and stock updated'
    };

    // Call parent completion handler
    onPaymentComplete(paymentData);
    
    // Reset and close modal
    resetModal();
    onClose();
  }, [onPaymentComplete, transactionId, receiptData, totalAmount, changeAmount, paymentMethod, onClose]);

  const resetModal = useCallback(() => {
    setPaymentMethod('cash');
    setAmountPaid('');
    setChangeAmount(0);
    setIsProcessing(false);
    setPaymentSuccess(false);
    setTransactionId(null);
    setShowReceipt(false);
    setReceiptData(null);
    setIsRefreshingData(false);
  }, []);

  const handleClose = useCallback(() => {
    console.log('❌ Payment modal closed without completion');
    resetModal();
    onClose();
  }, [resetModal, onClose]);

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay">
      <motion.div
        className="payment-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Modal Header */}
        <div className="payment-modal-header">
          <div className="header-content">
            <h2>Process Payment</h2>
            <p className="header-subtitle">Complete transaction for customer</p>
          </div>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="payment-modal-content">
          {/* Data Refresh Indicator */}
          {isRefreshingData && (
            <div className="data-refresh-indicator">
              <RefreshCw size={16} className="refresh-spinner" />
              <span>Updating stock levels...</span>
            </div>
          )}

          {/* Payment Success */}
          <AnimatePresence>
            {paymentSuccess && !showReceipt && (
              <motion.div
                className="payment-success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <div className="success-content">
                  <CheckCircle size={48} className="success-icon" />
                  <h3>Payment Successful</h3>
                  <p>Transaction #{transactionId} has been processed</p>
                  <div className="success-loading">
                    <div className="loading-spinner"></div>
                    <span>Stock updated! Preparing receipt...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Receipt View */}
          {showReceipt && receiptData && (
            <motion.div
              className="receipt-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="receipt-view-header">
                <div className="receipt-header-content">
                  <CheckCircle size={24} className="success-icon" />
                  <div>
                    <h3>Payment Complete</h3>
                    <p>Receipt #{receiptData.transactionId}</p>
                    <p className="stock-updated-notice">✅ Stock levels updated</p>
                  </div>
                </div>
                <button className="print-receipt-btn" onClick={handlePrintReceipt}>
                  <Printer size={18} />
                  Print Receipt
                </button>
              </div>
              <div className="receipt-container">
                <Receipt
                  ref={receiptRef}
                  transactionId={receiptData.transactionId}
                  orderNumber={receiptData.orderNumber}
                  items={receiptData.items}
                  subtotal={receiptData.subtotal}
                  tax={receiptData.tax}
                  discount={receiptData.discount}
                  total={receiptData.total}
                  amountPaid={receiptData.amountPaid}
                  change={receiptData.change}
                  paymentMethod={receiptData.paymentMethod}
                  customer={receiptData.customer}
                  user={receiptData.user}
                  timestamp={receiptData.timestamp}
                  onClose={handleReceiptClose}
                  showActions={false}
                />
              </div>
            </motion.div>
          )}

          {/* Payment Form */}
          {!paymentSuccess && !showReceipt && (
            <div className="payment-content">
              {/* Order Summary */}
              <div className="order-summary">
                <h3 className="section-title">Order Summary</h3>
                <div className="summary-grid">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>UGX {formatUGX(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="summary-row discount">
                      <span>Discount</span>
                      <span>- UGX {formatUGX(discount)}</span>
                    </div>
                  )}
                  <div className="summary-row total">
                    <span>Total Amount</span>
                    <span>UGX {formatUGX(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="payment-method-section">
                <h3 className="section-title">Payment Method</h3>
                <div className="payment-methods">
                  <button
                    className={`payment-method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <DollarSign size={18} />
                    <span>Cash</span>
                  </button>
                  <button
                    className={`payment-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <CreditCard size={18} />
                    <span>Card</span>
                  </button>
                  <button
                    className={`payment-method-btn ${paymentMethod === 'mobile' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('mobile')}
                  >
                    <Smartphone size={18} />
                    <span>Mobile Money</span>
                  </button>
                </div>
              </div>

              {/* Amount Paid */}
              <div className="amount-section">
                <h3 className="section-title">Amount Received</h3>
                <div className="amount-input-container">
                  <span className="currency-symbol">UGX</span>
                  <input
                    type="text"
                    className="amount-input"
                    value={amountPaid ? formatUGX(parseFloat(amountPaid)) : ''}
                    onChange={(e) => handleAmountChange(e.target.value.replace(/,/g, ''))}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Change Amount */}
              {changeAmount > 0 && (
                <div className="change-section">
                  <div className="change-info">
                    <span className="change-label">Customer's Change</span>
                    <span className="change-amount">UGX {formatUGX(changeAmount)}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="payment-actions">
                <button 
                  className="cancel-btn" 
                  onClick={handleClose} 
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  className="submit-btn"
                  onClick={handlePaymentSubmit}
                  disabled={isProcessing || !amountPaid || parseFloat(amountPaid) < totalAmount}
                >
                  {isProcessing ? (
                    <>
                      <div className="button-spinner"></div>
                      Processing...
                    </>
                  ) : (
                    `Complete ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} Payment`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentModal;