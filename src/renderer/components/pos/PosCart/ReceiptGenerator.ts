import jsPDF from 'jspdf';
import { CartItem, Customer } from '../../../src/types/pos.types';

interface ReceiptData {
  cart: CartItem[];
  subtotal: number;
  discountAmount: number;
  tax: number;
  grossPrice: number;
  customer?: Customer;
  cashier: string;
  transactionId: string;
  paymentMethod: string;
  amountPaid: number;
  change: number;
}

export class ReceiptGenerator {
  private doc: jsPDF;
  private margin = 20;
  private currentY = 0;
  private pageWidth = 80; // mm for thermal printer style
  private companyName = 'Your Company Name';
  private companyAddress = '123 Business Street, City, State 12345';
  private companyPhone = '+1 (555) 123-4567';
  private companyWebsite = 'www.yourcompany.com';

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 297] // Standard thermal receipt size
    });
  }

  private addHeader(): void {
    // Company Logo (you can add a base64 encoded logo here)
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.companyName, this.margin, (this.currentY += 10));
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.companyAddress, this.margin, (this.currentY += 5));
    this.doc.text(this.companyPhone, this.margin, (this.currentY += 3));
    this.doc.text(this.companyWebsite, this.margin, (this.currentY += 3));
    
    // Divider line
    this.doc.line(this.margin, (this.currentY += 5), this.pageWidth - this.margin, this.currentY);
  }

  private addReceiptInfo(data: ReceiptData): void {
    this.currentY += 8;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SALES RECEIPT', this.margin, this.currentY);
    
    this.currentY += 4;
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    
    const receiptInfo = [
      `Receipt #: ${data.transactionId}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Time: ${new Date().toLocaleTimeString()}`,
      `Cashier: ${data.cashier}`,
    ];
    
    receiptInfo.forEach(info => {
      this.doc.text(info, this.margin, (this.currentY += 4));
    });

    if (data.customer) {
      this.currentY += 3;
      this.doc.text(`Customer: ${data.customer.name}`, this.margin, this.currentY);
    }
    
    this.currentY += 5;
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
  }

  private addItems(data: ReceiptData): void {
    this.currentY += 8;
    
    // Table header
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.text('ITEM', this.margin, this.currentY);
    this.doc.text('QTY', this.pageWidth - 30, this.currentY, { align: 'right' });
    this.doc.text('AMOUNT', this.pageWidth - this.margin, this.currentY, { align: 'right' });
    
    this.currentY += 4;
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    // Items
    this.doc.setFont('helvetica', 'normal');
    data.cart.forEach(item => {
      this.currentY += 5;
      
      // Item name (with word wrap)
      const itemName = this.truncateText(item.product_name, 25);
      this.doc.text(itemName, this.margin, this.currentY);
      
      // Quantity and price
      this.doc.text(item.quantity.toString(), this.pageWidth - 30, this.currentY, { align: 'right' });
      const total = (parseFloat(item.price) * item.quantity).toFixed(2);
      this.doc.text(`UGX ${total}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });
      
      // Barcode
      this.doc.setFontSize(6);
      this.doc.text(`#${item.barcode}`, this.margin, this.currentY + 2);
      this.doc.setFontSize(8);
    });
    
    this.currentY += 5;
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
  }

  private addTotals(data: ReceiptData): void {
    this.currentY += 8;
    
    const totals = [
      { label: 'Subtotal:', amount: data.subtotal },
      { label: 'Discount:', amount: -data.discountAmount },
      { label: 'Tax:', amount: data.tax },
    ];
    
    totals.forEach(total => {
      this.doc.text(total.label, this.margin, this.currentY);
      this.doc.text(`UGX ${total.amount.toFixed(2)}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });
      this.currentY += 4;
    });
    
    // Total line
    this.currentY += 2;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('TOTAL:', this.margin, this.currentY);
    this.doc.text(`UGX ${data.grossPrice.toFixed(2)}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });
    
    this.currentY += 6;
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Payment: ${data.paymentMethod}`, this.margin, this.currentY);
    this.doc.text(`Paid: UGX ${data.amountPaid.toFixed(2)}`, this.margin, this.currentY + 4);
    
    if (data.change > 0) {
      this.doc.text(`Change: UGX ${data.change.toFixed(2)}`, this.margin, this.currentY + 8);
    }
  }

  private addFooter(): void {
    this.currentY += 15;
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Thank you for your business!', this.margin, this.currentY, { align: 'center' });
    
    this.currentY += 4;
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Items cannot be returned without receipt', this.margin, this.currentY, { align: 'center' });
    
    this.currentY += 4;
    this.doc.text('7-day return policy with original receipt', this.margin, this.currentY, { align: 'center' });
    
    // QR Code placeholder for loyalty program
    this.currentY += 8;
    this.doc.text('Scan for loyalty rewards:', this.margin, this.currentY, { align: 'center' });
    
    // You can add an actual QR code here using qrcode library
    // const qrCodeData = 'https://yourcompany.com/loyalty';
    // this.addQRCode(qrCodeData, this.margin + 15, this.currentY + 3, 20);
  }

  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  private addQRCode(data: string, x: number, y: number, size: number): void {
    // Implementation for QR code generation
    // You can use a library like qrcode to generate QR codes
    // This is a placeholder for QR code implementation
    this.doc.rect(x, y, size, size);
    this.doc.text('QR', x + size/2 - 2, y + size/2 + 1);
  }

  public generateReceipt(data: ReceiptData): void {
    // Reset position
    this.currentY = 0;
    
    // Add receipt sections
    this.addHeader();
    this.addReceiptInfo(data);
    this.addItems(data);
    this.addTotals(data);
    this.addFooter();
    
    // Save the PDF
    this.doc.save(`receipt-${data.transactionId}.pdf`);
  }

  public printReceipt(data: ReceiptData): void {
    this.generateReceipt(data);
    
    // For actual printing, you might want to:
    // 1. Open print dialog
    // 2. Send to thermal printer
    // 3. Use browser's print functionality
    
    if (window.print) {
      window.print();
    }
  }

  public getReceiptBlob(data: ReceiptData): Blob {
    this.generateReceipt(data);
    return this.doc.output('blob');
  }
}

// Utility function to generate receipt
export const generateModernReceipt = (data: ReceiptData) => {
  const generator = new ReceiptGenerator();
  return generator.generateReceipt(data);
};