// src/renderer/src/components/pos/PosCart/CartItemRow.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { CartItem } from '../../../src/types/pos.types';
import { formatUGX } from '../currencyFormatter';
import './CartItemRow.css';

interface CartItemRowProps {
  item: CartItem;
  index: number;
  onRemove: (id: number) => void;
  onQuantityChange: (id: number, quantity: number) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  index,
  onRemove,
  onQuantityChange,
}) => {
  const [inputValue, setInputValue] = useState(String(item.quantity));
  const [showStockWarning, setShowStockWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep input in sync with external changes (e.g. + / - buttons)
  useEffect(() => {
    setInputValue(String(item.quantity));
  }, [item.quantity]);

  const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
  const itemTotal = itemPrice * item.quantity;
  const maxStock = item.quantityInStock;

  // STRICT VALIDATION: Prevent any input that exceeds stock
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty or valid positive integers only
    if (value === '' || /^\d+$/.test(value)) {
      const numValue = value === '' ? 0 : parseInt(value, 10);
      
      // STRICT VALIDATION: Immediately block if exceeds stock
      if (numValue > maxStock) {
        setShowStockWarning(true);
        setWarningMessage(`Cannot exceed available stock of ${maxStock}`);
        
        // Keep current value but show warning
        setInputValue(String(item.quantity));
        return;
      }

      // STRICT VALIDATION: Block zero or negative
      if (numValue < 1) {
        setShowStockWarning(true);
        setWarningMessage('Quantity must be at least 1');
        setInputValue(String(item.quantity));
        return;
      }

      // Valid input - clear warnings and update
      setShowStockWarning(false);
      setInputValue(value);
      
      // Instantly update cart quantity on every valid keystroke
      onQuantityChange(item.id, numValue);
    }
  };

  // Handle blur to clean up empty/invalid input
  const handleBlur = () => {
    let finalQty = parseInt(inputValue) || 1;
    
    // STRICT VALIDATION: Enforce stock limits on blur
    if (finalQty > maxStock) {
      finalQty = maxStock;
      setShowStockWarning(true);
      setWarningMessage(`Automatically adjusted to maximum available stock: ${maxStock}`);
    }
    
    if (finalQty < 1) finalQty = 1;

    setInputValue(String(finalQty));
    if (finalQty !== item.quantity) {
      onQuantityChange(item.id, finalQty);
    }
    
    // Clear warning after a delay
    setTimeout(() => setShowStockWarning(false), 3000);
  };

  // Handle + button with strict validation
  const handleIncrement = () => {
    if (item.quantity >= maxStock) {
      setShowStockWarning(true);
      setWarningMessage(`Cannot exceed available stock of ${maxStock}`);
      setTimeout(() => setShowStockWarning(false), 3000);
      return;
    }
    onQuantityChange(item.id, item.quantity + 1);
  };

  // Handle - button
  const handleDecrement = () => {
    if (item.quantity > 1) {
      onQuantityChange(item.id, item.quantity - 1);
    }
  };

  // Handle keypress to prevent invalid characters
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow only numbers and control keys
    if (!/[\d\b\t]/.test(e.key) && 
        !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(e.key)) {
      e.preventDefault();
      setShowStockWarning(true);
      setWarningMessage('Only numbers are allowed');
      setTimeout(() => setShowStockWarning(false), 2000);
    }
  };

  // Handle paste to validate pasted content
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (!/^\d+$/.test(pastedText)) {
      e.preventDefault();
      setShowStockWarning(true);
      setWarningMessage('Cannot paste non-numeric values');
      setTimeout(() => setShowStockWarning(false), 2000);
    }
    
    const pastedNumber = parseInt(pastedText, 10);
    if (pastedNumber > maxStock) {
      e.preventDefault();
      setShowStockWarning(true);
      setWarningMessage(`Cannot paste value exceeding stock of ${maxStock}`);
      setTimeout(() => setShowStockWarning(false), 3000);
    }
  };

  // Clear warning when user starts typing again
  const handleFocus = () => {
    setShowStockWarning(false);
  };

  return (
    <motion.div
      className="cir-cart-item-row"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      layout
    >
      <div className="cir-item-index">{index + 1}</div>

      <div className="cir-item-content">
        <div className="cir-item-header">
          <h3 className="cir-item-name">{item.product_name}</h3>
          <span className="cir-unit-price">UGX {formatUGX(itemPrice)}</span>
        </div>

        {/* Stock Warning - Always show if quantity exceeds stock */}
        {(item.quantity > item.quantityInStock || showStockWarning) && (
          <motion.div 
            className="cir-stock-warning"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <AlertTriangle size={12} className="cir-warning-icon" />
            <span>{warningMessage || `Only ${item.quantityInStock} in stock`}</span>
            <button 
              className="cir-warning-close"
              onClick={() => setShowStockWarning(false)}
            >
              <X size={12} />
            </button>
          </motion.div>
        )}

        {/* Stock Indicator */}
        <div className="cir-stock-indicator">
          <span className="cir-stock-label">Available: </span>
          <span className={`cir-stock-count ${item.quantityInStock <= 10 ? 'cir-low-stock' : ''}`}>
            {item.quantityInStock}
          </span>
        </div>

        <div className="cir-item-controls">
          {/* Quantity Controls */}
          <div className="cir-quantity-controls">
            <motion.button
              className="cir-qty-btn cir-minus-btn"
              onClick={handleDecrement}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={item.quantity <= 1}
            >
              −
            </motion.button>

            {/* Strictly Validated Input */}
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              onPaste={handlePaste}
              onBlur={handleBlur}
              onFocus={handleFocus}
              className={`cir-qty-input ${showStockWarning ? 'cir-input-warning' : ''}`}
              aria-label="Edit quantity"
              maxLength={String(maxStock).length} // Prevent typing more digits than max stock
            />

            <motion.button
              className="cir-qty-btn cir-plus-btn"
              onClick={handleIncrement}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={item.quantity >= maxStock}
            >
              +
            </motion.button>
          </div>

          {/* Total */}
          <div className="cir-total-section">
            <span className="cir-total-label">Total</span>
            <motion.span
              className="cir-total-amount"
              key={itemTotal}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              UGX {formatUGX(itemTotal)}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <div className="cir-item-actions">
        <motion.button
          className="cir-remove-btn"
          onClick={() => onRemove(item.id)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ×
        </motion.button>
      </div>
    </motion.div>
  );
};