// src/renderer/src/components/pos/PosCart/CartTotals.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Percent } from 'lucide-react';
import { Customer } from '../../../src/types/pos.types';
import { formatUGX } from '../currencyFormatter';

interface CartTotalsProps {
  totalItems: number;
  subtotal: number;
  discount: number;
  discountAmount: number;
  isDiscountPercentage: boolean;
  tax: number;
  grossPrice: number;
  selectedCust?: Customer;
  taxRate: number;
  onDiscountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleDiscountType: () => void;
}

export const CartTotals: React.FC<CartTotalsProps> = ({
  totalItems,
  subtotal,
  discount,
  discountAmount,
  isDiscountPercentage,
  tax,
  grossPrice,
  selectedCust,
  taxRate,
  onDiscountChange,
  onToggleDiscountType
}) => (
  <motion.div 
    className="pos-cart-totals"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.4 }}
  >
    <div className="cart-total-row">
      <span className="cart-total-label">Items</span>
      <motion.span 
        className="cart-total-value"
        key={totalItems}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {totalItems}
      </motion.span>
    </div>
    
    <div className="cart-total-row">
      <span className="cart-total-label">Subtotal</span>
      <motion.span 
        className="cart-total-value"
        key={subtotal}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
      >
        UGX {formatUGX(subtotal)}
      </motion.span>
    </div>
    
    <div className="cart-total-row cart-discount-row">
      <span className="cart-total-label">Discount</span>
      <div className="cart-discount-controls">
        <input
          type="number"
          className="cart-discount-input"
          value={discount}
          onChange={onDiscountChange}
          placeholder="0"
          min="0"
        />
        <motion.button
          className="cart-discount-type-btn"
          onClick={onToggleDiscountType}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={isDiscountPercentage ? 'Percentage' : 'Fixed Amount'}
        >
          {isDiscountPercentage ? <Percent size={14} /> : <DollarSign size={14} />}
        </motion.button>
        {discountAmount > 0 && (
          <motion.span 
            className="cart-discount-amount"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            -UGX {formatUGX(discountAmount)}
          </motion.span>
        )}
      </div>
    </div>
  
    
    <motion.div 
      className="cart-total-row cart-gross-row"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <span className="cart-total-label-large">Total</span>
      <motion.h3 
        className="cart-total-value-large"
        key={grossPrice}
        initial={{ scale: 1.15, color: 'var(--warning)' }}
        animate={{ scale: 1, color: 'var(--primary-teal)' }}
        transition={{ duration: 0.3 }}
      >
        UGX {formatUGX(grossPrice)}
      </motion.h3>
    </motion.div>
    
    {selectedCust && selectedCust.loyaltyPoints && (
      <motion.div 
        className="cart-total-row cart-loyalty-row"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="cart-loyalty-label">💎 Loyalty Points</span>
        <span className="cart-loyalty-value">{selectedCust.loyaltyPoints} pts</span>
      </motion.div>
    )}
  </motion.div>
);