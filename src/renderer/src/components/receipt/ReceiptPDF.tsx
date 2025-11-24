// src/renderer/src/components/receipt/ReceiptPDF.tsx
import React from 'react';

interface ReceiptItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  category?: string;
}

interface ReceiptPDFProps {
  transactionData: {
    transactionId: number;
    orderNumber: number;
    items: ReceiptItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    amountPaid: number;
    change: number;
    paymentMethod: string;
    customer?: {
      name: string;
      phone?: string;
      email?: string;
    };
    user: {
      name: string;
    };
    timestamp: string;
  };
}

// Built-in UGX formatter
const formatUGX = (amount: number): string => {
  return new Intl.NumberFormat('en-UG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const ReceiptPDF: React.FC<ReceiptPDFProps> = ({ transactionData }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Auto-print when component mounts
  React.useEffect(() => {
    const timer = setTimeout(() => {
      handlePrint();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="receipt-pdf">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .receipt-pdf,
            .receipt-pdf * {
              visibility: visible;
            }
            .receipt-pdf {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0;
              margin: 0;
            }
            .no-print {
              display: none !important;
            }
          }
          
          @page {
            margin: 0;
            size: auto;
          }
        `}
      </style>

      <div className="receipt-container">
        {/* Receipt Header with properly sized logo */}
        <div className="receipt-header">
          <div className="logo-container">
            <img 
              src="/assets/images/logo.png" 
              alt="Fraha Pharmacy" 
              className="company-logo"
              onError={(e) => {
                // Fallback if logo doesn't load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="receipt-title">Fraha Pharmacy</h1>
          <p className="receipt-subtitle">New Taxi Park Exit</p>
          <p className="receipt-subtitle">Kampala, Uganda</p>
          <p className="receipt-subtitle text-bold">Tel: +256752047212</p>
        </div>

        {/* Transaction Info */}
        <div className="transaction-info">
          <div className="receipt-row">
            <span>Receipt #:</span>
            <span className="text-bold text-large">{transactionData.transactionId}</span>
          </div>
          <div className="receipt-row">
            <span>Date:</span>
            <span>{formatDate(transactionData.timestamp)}</span>
          </div>
          <div className="receipt-row">
            <span>Cashier:</span>
            <span>{transactionData.user.name}</span>
          </div>
          {transactionData.customer && transactionData.customer.name !== 'Walk-in Customer' && (
            <div className="receipt-row">
              <span>Customer:</span>
              <span className="text-bold">{transactionData.customer.name}</span>
            </div>
          )}
        </div>

        <div className="receipt-divider"></div>

        {/* Items Table */}
        <table className="receipt-items">
          <thead>
            <tr>
              <th>Item</th>
              <th className="item-quantity">Qty</th>
              <th className="item-price">Price</th>
              <th className="item-total">Total</th>
            </tr>
          </thead>
          <tbody>
            {transactionData.items.map((item, index) => (
              <tr key={`${item.product_id}-${index}`}>
                <td className="item-name">
                  <div className="text-bold">{item.product_name}</div>
                  {item.category && item.category !== 'Uncategorized' && (
                    <div className="item-category">({item.category})</div>
                  )}
                </td>
                <td className="item-quantity">{item.quantity}</td>
                <td className="item-price">UGX {formatUGX(item.price)}</td>
                <td className="item-total">UGX {formatUGX(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-divider"></div>

        {/* Totals */}
        <table className="receipt-totals">
          <tbody>
            <tr>
              <td>Subtotal:</td>
              <td className="text-right">UGX {formatUGX(transactionData.subtotal)}</td>
            </tr>
            {transactionData.discount > 0 && (
              <tr>
                <td>Discount:</td>
                <td className="text-right">-UGX {formatUGX(transactionData.discount)}</td>
              </tr>
            )}
            {transactionData.tax > 0 && (
              <tr>
                <td>Tax:</td>
                <td className="text-right">UGX {formatUGX(transactionData.tax)}</td>
              </tr>
            )}
            <tr className="total-row">
              <td className="text-bold">TOTAL:</td>
              <td className="text-right text-bold">UGX {formatUGX(transactionData.total)}</td>
            </tr>
            <tr>
              <td>Paid ({transactionData.paymentMethod}):</td>
              <td className="text-right">UGX {formatUGX(transactionData.amountPaid)}</td>
            </tr>
            {transactionData.change > 0 && (
              <tr>
                <td>Change:</td>
                <td className="text-right text-bold">UGX {formatUGX(transactionData.change)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="receipt-footer">
          <div className="thank-you">
            Thank you for your purchase!
          </div>
          <p>Items cannot be returned without receipt</p>
          <p>Valid for 7 days from purchase date</p>
          <p>For inquiries: +256752047212</p>
        </div>
      </div>

      {/* Print button for manual printing */}
      <div className="receipt-actions no-print">
        <button className="print-btn" onClick={handlePrint}>
          Print Receipt
        </button>
      </div>
    </div>
  );
};

export default ReceiptPDF;