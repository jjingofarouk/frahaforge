import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PauseCircle } from 'lucide-react';
import '../../../styles/DueModal.css';

interface DueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DueModal: React.FC<DueModalProps> = ({ isOpen, onClose }) => {
  const [refNumber, setRefNumber] = useState('');

  const handleNumberInput = (value: string) => {
    if (value === 'del') {
      setRefNumber((prev) => prev.slice(0, -1));
    } else if (value === 'ac') {
      setRefNumber('');
    } else {
      setRefNumber((prev) => prev + value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Hold Order Submitted:', { refNumber });
    alert('Order held successfully!');
    setRefNumber('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="due-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className="due-modal-content"
            initial={{ scale: 0.95, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="due-modal-header">
              <h4 className="due-modal-title">
                <PauseCircle className="due-modal-icon" size={24} />
                Hold Order
              </h4>
              <button className="due-modal-close-btn" onClick={onClose}>
                <X className="due-modal-icon" size={24} />
              </button>
            </div>
            <div className="due-modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <input
                    type="text"
                    id="refNumber"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    placeholder="Enter a reference"
                    className="form-control"
                  />
                </div>
                <div className="due-modal-divider"></div>
                <div className="due-modal-keypad">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <motion.button
                      key={num}
                      className="keypad-btn"
                      onClick={() => handleNumberInput(num.toString())}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {num}
                    </motion.button>
                  ))}
                  <motion.button
                    className="keypad-btn keypad-delete"
                    onClick={() => handleNumberInput('del')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ⌫
                  </motion.button>
                  <motion.button
                    className="keypad-btn"
                    onClick={() => handleNumberInput('0')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    0
                  </motion.button>
                  <motion.button
                    className="keypad-btn keypad-clear"
                    onClick={() => handleNumberInput('ac')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    AC
                  </motion.button>
                </div>
                <motion.button
                  type="submit"
                  className="submit-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Hold Order
                </motion.button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DueModal;