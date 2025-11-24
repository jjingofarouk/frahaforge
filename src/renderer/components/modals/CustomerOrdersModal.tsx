import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users } from 'lucide-react';
import '../../../styles/CustomerOrdersModal.css';

interface CustomerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="customer-orders-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      >
        <motion.div
          className="customer-orders-modal-content"
          initial={{ scale: 0.95, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="customer-orders-modal-header">
            <h4 className="customer-orders-modal-title">
              <Users className="customer-orders-icon" size={24} />
              Customer Orders
            </h4>
            <button className="customer-orders-close-btn" onClick={onClose}>
              <X className="customer-orders-icon" size={24} />
            </button>
          </div>
          <div className="customer-orders-modal-body">
            <div className="form-group">
              <div className="input-group">
                <span className="input-label">Search Customer Order</span>
                <input
                  type="text"
                  id="holdCustomerOrderInput"
                  placeholder="Search order by customer name"
                  className="form-control"
                />
              </div>
            </div>
            <div className="customer-orders-content">
              <p>Please wait <span className="dot"></span></p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default CustomerOrdersModal;