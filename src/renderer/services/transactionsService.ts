// src/renderer/src/services/transactionsService.ts
import { withErrorHandling } from './api';
import { customersService } from './customerService';
import { formatDateForUgandaAPI } from '../src/utils/ugandaTime';

// Interfaces matching the database schema
export interface Transaction {
  id: number;
  order_number: number;
  ref_number: string;
  discount: number;
  customer_id?: number;
  customer_name: string;
  status: number;
  subtotal: number;
  tax: number;
  order_type: number;
  total: number;
  paid: number;
  change_amount: number;
  payment_type: string;
  payment_info?: string;
  till: number;
  user_id: number;
  user_name: string;
  created_at: string;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: number;
  transaction_id: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface CreateTransactionRequest {
  customer_id?: number;
  customer_name?: string;
  discount?: number;
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  change_amount: number;
  payment_type: string;
  payment_info?: string;
  ref_number?: string;
  till?: number;
  user_id: number;
  user_name: string;
  order_number?: number;  
  status?: number;       
  order_type?: number;    
  items: {
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    category: string;
  }[];
}

export interface SalesReport {
  period: string;
  transaction_count: number;
  total_sales: number;
  total_subtotal: number;
  total_tax: number;
  total_discount: number;
  average_sale: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  category: string;
  total_quantity: number;
  total_revenue: number;
  transaction_count: number;
}

export interface DailySummary {
  date: string;
  summary: {
    total_transactions: number;
    total_sales: number;
    total_subtotal: number;
    total_tax: number;
    total_discount: number;
    total_paid: number;
    total_change: number;
    first_transaction?: string;
    last_transaction?: string;
  };
  payment_methods: Array<{
    payment_type: string;
    transaction_count: number;
    total_amount: number;
  }>;
}

export interface RefundRequest {
  reason?: string;
  items?: Array<{
    product_id: number;
    quantity: number;
  }>;
  user_id: number;
  user_name: string;
}

class TransactionsService {
  private baseURL: string;

  constructor() {
    this.baseURL = 'http://192.168.1.3:3001/api';
    console.log('🚀 TransactionsService using:', this.baseURL);
  }

  // ===== CORE TRANSACTION OPERATIONS =====

  /**
   * Get all transactions with pagination and filtering
   * FIXED: Proper Uganda timezone handling
   */
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    customer_id?: number;
    status?: number;
    start_date?: string;
    end_date?: string;
  }) {
    return withErrorHandling(async () => {
      console.log('📅 TransactionsService - Date params:', {
        start_date: params?.start_date,
        end_date: params?.end_date
      });

      const response = await fetch(`${this.baseURL}/transactions?${new URLSearchParams(params as any)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ TransactionsService - Found ${data.transactions?.length || 0} transactions`);
      return data;
    }, 'Failed to fetch transactions');
  }

  /**
   * Get a single transaction by ID with its items
   */
  async getTransaction(transactionId: number) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    }, 'Failed to fetch transaction');
  }

  /**
   * Create a new transaction
   */
  async createTransaction(transactionData: CreateTransactionRequest) {
    return withErrorHandling(async () => {
      // Validate cart items have required fields
      if (!transactionData.items || transactionData.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Validate each item has required fields
      transactionData.items.forEach((item, index) => {
        if (!item.product_id || !item.product_name) {
          throw new Error(`Item ${index + 1} is missing required product data`);
        }
      });

      // ✅ GENERATE TIMESTAMP-BASED REF NUMBER TO MATCH BACKEND PATTERN
      const timestampRef = Date.now();
      if (!transactionData.ref_number) {
        transactionData.ref_number = `REF-${timestampRef}`;
      }

      console.log(`🔄 Sending POST request to: ${this.baseURL}/transactions`);

      const response = await fetch(`${this.baseURL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      console.log('✅ Transaction created successfully:', {
        id: result.id,
        order_number: result.order_number,
        transactionId: result.transactionId
      });

      // ✅ AUTOMATICALLY UPDATE CUSTOMER SEGMENT IF CUSTOMER EXISTS
      if (transactionData.customer_id && transactionData.customer_id !== 0) {
        try {
          console.log('🔄 Triggering automatic segment update for customer:', transactionData.customer_id);
          await customersService.updateCustomerSegmentAuto(transactionData.customer_id);
          console.log('✅ Customer segment update triggered');
        } catch (segmentError: any) {
          console.log('⚠️ Segment update failed (non-critical):', segmentError.message);
        }
      }

      return result;
    }, 'Failed to create transaction');
  }

  /**
   * Get transaction items
   */
  async getTransactionItems(transactionId: number) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/transactions/${transactionId}/items`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    }, 'Failed to fetch transaction items');
  }

  // In src/renderer/src/services/transactionsService.ts, add this method:

/**
 * Create a hold order (status = 0)
 */
async createHoldOrder(holdOrderData: CreateTransactionRequest) {
  return withErrorHandling(async () => {
    // Validate cart items have required fields
    if (!holdOrderData.items || holdOrderData.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Validate each item has required fields
    holdOrderData.items.forEach((item, index) => {
      if (!item.product_id || !item.product_name) {
        throw new Error(`Item ${index + 1} is missing required product data`);
      }
    });

    console.log(`🔄 Sending POST request to: ${this.baseURL}/transactions/hold`);

    const response = await fetch(`${this.baseURL}/transactions/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(holdOrderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    console.log('✅ Hold order created successfully:', {
      id: result.id,
      order_number: result.order_number,
      status: result.status
    });

    return result;
  }, 'Failed to create hold order');
}

// Add this method to the transactions service:

/**
 * Process a held order (convert from status 0 to status 1)
 */
async processHeldOrder(transactionId: number, paymentData: any) {
  return withErrorHandling(async () => {
    console.log(`🔄 Processing held order ${transactionId} with payment data:`, paymentData);

    const response = await fetch(`${this.baseURL}/transactions/${transactionId}/process-hold`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Held order processed successfully:', result);
    return result;
  }, 'Failed to process held order');
}

  // ===== REFUND OPERATIONS =====

  /**
   * Process a refund for a transaction
   */
  async processRefund(transactionId: number, refundData: RefundRequest) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/transactions/${transactionId}/refund`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    }, 'Failed to process refund');
  }

  async updateTransaction(transactionId: number, updateData: any) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    }, 'Failed to update transaction');
  }

  // ===== REPORTS & ANALYTICS =====

  /**
   * Get sales reports with various time periods
   */
  async getSalesReport(params?: {
    startDate?: string;
    endDate?: string;
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  }) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/transactions/reports/sales?${new URLSearchParams(params as any)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    }, 'Failed to fetch sales report');
  }

  /**
   * Get top selling products
   */
  async getTopProducts(params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/transactions/reports/top-products?${new URLSearchParams(params as any)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    }, 'Failed to fetch top products');
  }

  /**
   * Get daily summary report
   */
  async getDailySummary(date?: string) {
    return withErrorHandling(async () => {
      const params: any = {};
      if (date) params.date = date;

      const response = await fetch(`${this.baseURL}/transactions/reports/daily-summary?${new URLSearchParams(params)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    }, 'Failed to fetch daily summary');
  }

  async deleteTransaction(transactionId: number) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    }, 'Failed to delete transaction');
  }

  /**
   * Get product sales performance report
   */
  async getProductSalesPerformance(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<any[]> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/transactions/reports/product-sales?${new URLSearchParams(params as any)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    }, 'Failed to fetch product sales performance');
  }

  // ===== UTILITY METHODS =====

  /**
   * Generate a receipt for a transaction
   */
  generateReceipt(transaction: Transaction & { items?: TransactionItem[] }): string {
    const receipt = `
FRAHA PHARMACY
Old Kampala, Uganda
0751360385
${new Date(transaction.created_at).toLocaleString()}

Receipt #: ${transaction.order_number}
Cashier: ${transaction.user_name}
${transaction.customer_name !== 'walkin_customer' ? `Customer: ${transaction.customer_name}` : ''}

ITEMS:
${transaction.items?.map(item => 
  `${item.product_name} x${item.quantity}
  ${(item.price * item.quantity).toFixed(2)}`
).join('\n') || 'No items'}

Subtotal: ${transaction.subtotal.toFixed(2)}
Tax: ${transaction.tax.toFixed(2)}
Discount: ${transaction.discount.toFixed(2)}
Total: ${transaction.total.toFixed(2)}

Paid: ${transaction.paid.toFixed(2)}
Change: ${transaction.change_amount.toFixed(2)}
Payment: ${transaction.payment_type}

Thank you for your business!
Fraha Pharmacy 2025
    `.trim();

    return receipt;
  }

  /**
   * Calculate transaction statistics
   */
  calculateTransactionStats(transactions: Transaction[]) {
    const stats = {
      totalSales: 0,
      totalTransactions: transactions.length,
      averageTransaction: 0,
      totalTax: 0,
      totalDiscount: 0,
      paymentMethodBreakdown: {} as Record<string, number>
    };

    transactions.forEach((transaction) => {
      stats.totalSales += transaction.total;
      stats.totalTax += transaction.tax;
      stats.totalDiscount += transaction.discount;
      
      const method = transaction.payment_type;
      stats.paymentMethodBreakdown[method] = (stats.paymentMethodBreakdown[method] || 0) + 1;
    });

    stats.averageTransaction = stats.totalTransactions > 0 ? stats.totalSales / stats.totalTransactions : 0;

    return stats;
  }

  /**
   * Validate transaction data before submission
   */
  validateTransaction(data: CreateTransactionRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.subtotal || data.subtotal <= 0) {
      errors.push('Subtotal must be greater than 0');
    }

    if (!data.total || data.total <= 0) {
      errors.push('Total must be greater than 0');
    }

    if (!data.paid || data.paid < data.total) {
      errors.push('Paid amount must be greater than or equal to total');
    }

    if (!data.payment_type) {
      errors.push('Payment type is required');
    }

    if (!data.user_id || !data.user_name) {
      errors.push('User information is required');
    }

    if (!data.items || data.items.length === 0) {
      errors.push('At least one item is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create and export singleton instance
export const transactionsService = new TransactionsService();
export default transactionsService;