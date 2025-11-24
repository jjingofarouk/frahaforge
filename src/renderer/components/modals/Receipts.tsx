import React from 'react';
import { motion } from 'framer-motion';
import { Printer, X, Download } from 'lucide-react';
import { CartItem, Customer } from '../../src/types/pos.types';
import './Receipt.css';
import logoImage from './logo.png';

interface ReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  transactionData: {
    id: string;
    date: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paid: number;
    change: number;
    paymentMethod: string;
    customer?: Customer;
  };
  onPrint?: () => void;
  onDownload?: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({
  isOpen,
  onClose,
  transactionData,
  onPrint,
  onDownload
}) => {
  const formatCurrency = (amount: number): string => {
    return `UGX ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="receipt-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="receipt-container"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with controls */}
        <div className="receipt-header">
          <h2 className="receipt-title">Transaction Receipt</h2>
          <div className="receipt-controls">
            <button className="receipt-btn" onClick={handlePrint} title="Print Receipt">
              <Printer size={18} />
            </button>
            <button className="receipt-btn" onClick={onDownload} title="Download PDF">
              <Download size={18} />
            </button>
            <button className="receipt-btn close" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="receipt-content" id="receipt-content">
          {/* Company Header */}
          <div className="receipt-company">
            <div className="company-logo">
              <img
                src={logoImage}
                alt="Fraha Pharmacy Logo"
                className="logo-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            <h1 className="company-name">FRAHA PHARMACY</h1>
            <div className="company-info">
              <p>New Taxi Park, Kampala</p>
              <p>Tel: 0752047212</p>
              <p>Email: frahapharmacy@gmail.com</p>
            </div>
          </div>

          <div className="receipt-divider"></div>

          {/* Transaction Details */}
          <div className="receipt-section">
            <div className="receipt-row">
              <span>Receipt No:</span>
              <span><strong>{transactionData.id}</strong></span>
            </div>
            <div className="receipt-row">
              <span>Date & Time:</span>
              <span>{formatDate(transactionData.date)}</span>
            </div>
            {transactionData.customer && transactionData.customer.id !== 'walkin_customer' && (
              <div className="receipt-row">
                <span>Customer:</span>
                <span><strong>{transactionData.customer.name}</strong></span>
              </div>
            )}
            <div className="receipt-row">
              <span>Payment Method:</span>
              <span><strong>{transactionData.paymentMethod?.toUpperCase()}</strong></span>
            </div>
          </div>

          <div className="receipt-divider"></div>

          {/* Items Table */}
          <div className="receipt-section">
            <table className="items-table">
              <thead>
                <tr>
                  <th className="text-left">ITEM</th>
                  <th className="text-center">QTY</th>
                  <th className="text-right">PRICE</th>
                  <th className="text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {transactionData.items.map((item, index) => (
                  <tr key={index} className="receipt-item">
                    <td className="text-left">
                      <div className="item-name">{item.product_name}</div>
                      {item.category && item.category !== 'Uncategorized' && (
                        <div className="item-category">{item.category}</div>
                      )}
                    </td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">{formatCurrency(parseFloat(item.price))}</td>
                    <td className="text-right">
                      {formatCurrency(parseFloat(item.price) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="receipt-divider"></div>

          {/* Totals */}
          <div className="receipt-section">
            <div className="receipt-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(transactionData.subtotal)}</span>
            </div>
            {transactionData.discount > 0 && (
              <div className="receipt-row">
                <span>Discount:</span>
                <span>-{formatCurrency(transactionData.discount)}</span>
              </div>
            )}
            {transactionData.tax > 0 && (
              <div className="receipt-row">
                <span>Tax:</span>
                <span>{formatCurrency(transactionData.tax)}</span>
              </div>
            )}
            <div className="receipt-divider-dashed"></div>
            <div className="receipt-row total-row">
              <span><strong>TOTAL:</strong></span>
              <span><strong>{formatCurrency(transactionData.total)}</strong></span>
            </div>
            <div className="receipt-row">
              <span>Amount Paid:</span>
              <span>{formatCurrency(transactionData.paid)}</span>
            </div>
            {transactionData.change > 0 && (
              <div className="receipt-row change-row">
                <span><strong>Change:</strong></span>
                <span><strong>{formatCurrency(transactionData.change)}</strong></span>
              </div>
            )}
          </div>

          <div className="receipt-divider"></div>

          {/* Footer */}
          <div className="receipt-footer">
            <p className="thank-you">*** THANK YOU FOR YOUR BUSINESS ***</p>
            <p className="return-policy">Goods sold are not returnable unless defective</p>
            <p className="support">For inquiries: 0752047212</p>
            <p className="support">frahapharmacy@gmail.com</p>
            <div className="receipt-end">*** END OF RECEIPT ***</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="receipt-actions">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            Print Receipt
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Receipt;