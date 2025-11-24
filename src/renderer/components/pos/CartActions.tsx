// src/renderer/src/components/pos/CartActions/CartActions.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, CreditCard, History } from 'lucide-react';
import { usePosStore } from '../../src/stores/posStore';
import { transactionsService } from '../../services/transactionsService';
import { Product } from '../../src/types/pos.types';

interface CartActionsProps {
  cartLength: number;
  grossPrice: number;
  products: Product[];
  onCancel: () => void;
  onHoldOrder: (holdData: any) => void; // Updated to accept hold data
  onOpenHoldOrders: () => void;
  onOpenPayment: () => void;
  onPaymentComplete?: (paymentData: any) => void;
  selectedCustomer?: any;
  currentCart?: any;
}

export const CartActions: React.FC<CartActionsProps> = ({
  cartLength,
  grossPrice,
  onCancel,
  onHoldOrder, // Now receives hold data
  onOpenHoldOrders,
  onOpenPayment,
  selectedCustomer,
  currentCart,
}) => {
  const { cart } = usePosStore();
  const [holdLoading, setHoldLoading] = useState(false);

  // SIMPLE: Hold order function that passes data to parent
  const handleHoldOrder = async () => {
    if (cartLength === 0) {
      alert('Cart is empty. Please add items to cart before holding.');
      return;
    }

    if (!selectedCustomer) {
      alert('Please select a customer before holding the order.');
      return;
    }

    setHoldLoading(true);

    try {
      // Generate a reference number
      const refNumber = `HOLD-${Date.now()}`;

      // Prepare the hold order data
      const holdOrderData = {
        id: `hold-${Date.now()}`, // Temporary ID for frontend
        order_number: Date.now(), // Temporary order number
        ref_number: refNumber,
        customer_name: selectedCustomer.name,
        customer_phone: selectedCustomer.phone || '',
        customer_email: selectedCustomer.email || '',
        subtotal: currentCart?.subtotal || 0,
        tax: currentCart?.tax || 0,
        discount: currentCart?.discount || 0,
        total: grossPrice,
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.product_name,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
          quantity: item.quantity,
          category: item.category || 'Uncategorized'
        })),
        created_at: new Date().toISOString(),
        status: 0 // Mark as pending
      };

      console.log('🔄 Creating hold order:', holdOrderData);

      // Pass the hold data to parent component (PosCart)
      onHoldOrder(holdOrderData);
      
      // Clear the cart after successful hold
      onCancel();

    } catch (error: any) {
      console.error('❌ Error holding order:', error);
      alert(`Failed to hold order: ${error.message}`);
    } finally {
      setHoldLoading(false);
    }
  };

  const handlePaymentClick = () => {
    console.log('💳 Opening payment modal...');
    onOpenPayment();
  };

  const handleOpenHoldOrders = () => {
    console.log('📋 Opening hold orders modal...');
    onOpenHoldOrders();
  };

  return (
    <motion.div 
      className="pos-cart-actions"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.6 }}
    >

      <motion.button
        className="pos-cart-btn pos-cancel-btn"
        onClick={onCancel}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={cartLength === 0}
      >
        <X size={18} />
        <span>Cancel</span>
      </motion.button>

      <motion.button
        className="pos-cart-btn pos-hold-btn"
        onClick={handleHoldOrder}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={cartLength === 0 || !selectedCustomer || holdLoading}
        title={!selectedCustomer ? "Select a customer to hold order" : "Hold Order"}
      >
        {holdLoading ? (
          <>
            <div className="button-spinner"></div>
            Holding...
          </>
        ) : (
          <>
            <Clock size={18} />
            <span>Hold</span>
          </>
        )}
      </motion.button>

      <motion.button
        className="pos-cart-btn pos-pay-btn"
        onClick={handlePaymentClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={cartLength === 0 || grossPrice <= 0}
        title="Proceed to Payment"
      >
        <CreditCard size={18} />
        <span>Pay</span>
      </motion.button>
    </motion.div>
  );
};