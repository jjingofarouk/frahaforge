// src/renderer/src/components/receipt/Receipt.tsx
import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './Receipt.css';

interface ReceiptItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
}

interface ReceiptProps {
  transactionId: number;
  orderNumber?: string;
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
  onPrint?: () => void;
  onClose?: () => void;
  showActions?: boolean;
}

export interface ReceiptRef {
  handlePrint: () => void;
  handleDownloadPDF: () => Promise<void>;
}

const formatUGX = (amount: number): string => {
  return new Intl.NumberFormat('en-UG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const Receipt = forwardRef<ReceiptRef, ReceiptProps>(({
  transactionId,
  orderNumber,
  items,
  subtotal,
  tax,
  discount,
  total,
  amountPaid,
  change,
  paymentMethod,
  customer,
  user,
  timestamp,
  onPrint,
  onClose,
  showActions = true
}, ref) => {
  const receiptRef = useRef<HTMLDivElement>(null);

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
    if (onPrint) onPrint();
  };

  const handleDownloadPDF = async (): Promise<void> => {
    if (!receiptRef.current) return;

    try {
      const element = receiptRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);

      // Generate unique filename with order number if available
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
      
      let filename: string;
      if (orderNumber) {
        filename = `FrahaPharmacy-Receipt-${orderNumber}-${date}.pdf`;
      } else {
        filename = `FrahaPharmacy-Receipt-${transactionId}-${date}-${time}.pdf`;
      }

      pdf.save(filename);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Try printing instead.');
    }
  };

  useImperativeHandle(ref, () => ({
    handlePrint,
    handleDownloadPDF
  }));

  // Split items into pages (max 18 items per page for better space utilization)
  const itemsPerPage = 18;
  const totalPages = Math.ceil(items.length / itemsPerPage);

  return (
    <div className="receipt-wrapper">
      <div ref={receiptRef} className="printable-receipt">
        {/* Header - Compact and clean */}
        <div className="receipt-header">
          <h1 className="receipt-title">FRAHA PHARMACY</h1>
          <p className="receipt-subtitle">New Taxi Park Exit, Kampala, Uganda</p>
          <p className="receipt-contact">frahapharmacy@gmail.com | +256 752 047 212</p>
        </div>

        {/* Transaction Info */}
        <div className="receipt-section">
          <div className="receipt-row">
            <span>Receipt #:</span>
            <span className="text-bold">{transactionId}</span>
          </div>
          {orderNumber && (
            <div className="receipt-row">
              <span>Order #:</span>
              <span>{orderNumber}</span>
            </div>
          )}
          <div className="receipt-row">
            <span>Date:</span>
            <span>{formatDate(timestamp)}</span>
          </div>
          <div className="receipt-row">
            <span>Cashier:</span>
            <span>{user.name}</span>
          </div>
          {customer && customer.name !== 'Walk-in Customer' && (
            <div className="receipt-row">
              <span>Customer:</span>
              <span>{customer.name}</span>
            </div>
          )}
        </div>

        <div className="receipt-divider"></div>

        {/* Items Table with Pagination */}
        {Array.from({ length: totalPages }, (_, pageIndex) => {
          const startIndex = pageIndex * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const pageItems = items.slice(startIndex, endIndex);

          return (
            <div key={pageIndex} className="receipt-page">
              {/* Show page number if multiple pages */}
              {totalPages > 1 && (
                <div className="page-number">
                  Page {pageIndex + 1} of {totalPages}
                </div>
              )}

              <table className="receipt-items">
                <thead>
                  <tr>
                    <th className="item-name">Item</th>
                    <th className="item-quantity">Qty</th>
                    <th className="item-price">Price</th>
                    <th className="item-total">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item, index) => (
                    <tr key={`${item.product_id}-${startIndex + index}`}>
                      <td className="item-name">{item.product_name}</td>
                      <td className="item-quantity">{item.quantity}</td>
                      <td className="item-price">UGX {formatUGX(item.price)}</td>
                      <td className="item-total">UGX {formatUGX(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Show totals only on last page */}
              {pageIndex === totalPages - 1 && (
                <>
                  <div className="receipt-divider"></div>

                  {/* Totals */}
                  <table className="receipt-totals">
                    <tbody>
                      <tr>
                        <td>Subtotal:</td>
                        <td className="text-right">UGX {formatUGX(subtotal)}</td>
                      </tr>
                      {discount > 0 && (
                        <tr>
                          <td>Discount:</td>
                          <td className="text-right">UGX {formatUGX(discount)}</td>
                        </tr>
                      )}
                      {tax > 0 && (
                        <tr>
                          <td>Tax:</td>
                          <td className="text-right">UGX {formatUGX(tax)}</td>
                        </tr>
                      )}
                      <tr className="total-row">
                        <td className="text-bold">TOTAL:</td>
                        <td className="text-right text-bold">UGX {formatUGX(total)}</td>
                      </tr>
                      <tr>
                        <td>Paid ({paymentMethod}):</td>
                        <td className="text-right">UGX {formatUGX(amountPaid)}</td>
                      </tr>
                      {change > 0 && (
                        <tr>
                          <td>Change:</td>
                          <td className="text-right">UGX {formatUGX(change)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Footer */}
                  <div className="receipt-footer">
                    <p className="thank-you-message">
                      <em>Thank you for your purchase! Items cannot be returned without this receipt. Valid for 7 days from purchase date.</em>
                    </p>
                  </div>
                </>
              )}

              {/* Page break for multi-page receipts */}
              {pageIndex < totalPages - 1 && (
                <div className="page-break"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons (hidden when printing) */}
      {showActions && (
        <div className="receipt-actions">
          <button className="print-btn" onClick={handlePrint}>
            <Printer size={18} />
            Print Receipt
          </button>
          <button className="pdf-btn" onClick={handleDownloadPDF}>
            <Download size={18} />
            Save as PDF
          </button>
          {onClose && (
            <button className="done-btn" onClick={onClose}>
              Done
            </button>
          )}
        </div>
      )}
    </div>
  );
});

Receipt.displayName = 'Receipt';
export default Receipt;