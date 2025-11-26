// src/renderer/src/components/modals/OrderModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer } from 'lucide-react';
import axios from 'axios';
import './OrderModal.css';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string | null;
}

interface Transaction {
  id: string;
  order: number;
  ref_number: string;
  discount: string;
  customer: { id: number; name: string } | number;
  status: number;
  subtotal: string;
  tax: number;
  order_type: number;
  items: { id: number; product_name: string; price: string; quantity: number }[];
  date: string;
  payment_type: 'Cash' | 'Card' | 'Due';
  payment_info: string;
  total: string;
  paid: string;
  change: string;
  till: number;
  user: string;
  user_id: number;
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, transactionId }) => {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transactionId) {
      const fetchTransaction = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await axios.get(`http://192.168.1.3:3001/api/${transactionId}`);
          setTransaction(response.data);
        } catch (err) {
          setError('Failed to load transaction');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchTransaction();
    }
  }, [isOpen, transactionId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="order-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          >
            <motion.div
              className="order-modal-content"
              initial={{ scale: 0.95, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 50 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="order-modal-header">
                <button className="order-close-btn" onClick={onClose}>
                  <X className="order-icon" size={24} />
                </button>
              </div>
              <div className="order-modal-body">Loading...</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (error || !transaction) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="order-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          >
            <motion.div
              className="order-modal-content"
              initial={{ scale: 0.95, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 50 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="order-modal-header">
                <button className="order-close-btn" onClick={onClose}>
                  <X className="order-icon" size={24} />
                </button>
              </div>
              <div className="order-modal-body">Error loading transaction</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const subtotal = parseFloat(transaction.subtotal);
  const discount = parseFloat(transaction.discount || '0');
  const tax = transaction.tax || 0;
  const total = parseFloat(transaction.total);
  const paid = parseFloat(transaction.paid || '0');
  const change = parseFloat(transaction.change || '0');
  const due = total - paid;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="order-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className="order-modal-content"
            initial={{ scale: 0.95, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="order-modal-header">
              <motion.button
                className="print-btn"
                onClick={handlePrint}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Printer className="order-icon" size={18} />
                Print
              </motion.button>
              <button className="order-close-btn" onClick={onClose}>
                <X className="order-icon" size={24} />
              </button>
            </div>
            <div className="order-modal-body">
              <div className="order-header">
                <div className="order-info">
                  <h2>Invoice #{transaction.order}</h2>
                  <p>Date: {new Date(transaction.date).toLocaleString()}</p>
                  <p>Cashier: {transaction.user}</p>
                  <p>Till: {transaction.till}</p>
                  <p>Customer: {typeof transaction.customer === 'object' ? transaction.customer.name : 'Walk-in'}</p>
                </div>
              </div>
              <div className="order-items">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaction.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>${parseFloat(item.price).toFixed(2)}</td>
                        <td>${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="order-totals">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="total-row">
                    <span>Discount:</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="total-row">
                    <span>Tax:</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="total-row grand-total">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Paid:</span>
                  <span>${paid.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Change:</span>
                  <span>${change.toFixed(2)}</span>
                </div>
                {due > 0 && (
                  <div className="total-row due">
                    <span>Due:</span>
                    <span>${due.toFixed(2)}</span>
                  </div>
                )}
                <div className="total-row">
                  <span>Method:</span>
                  <span className={`method-badge ${transaction.payment_type.toLowerCase()}`}>
                    {transaction.payment_type}
                  </span>
                </div>
              </div>
            </div>
            <div className="order-warning">
              Right-Click and Reload if you get stuck after cancelling a print.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderModal;