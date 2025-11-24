// src/renderer/src/services/customersService.ts
import { withErrorHandling } from './api';

// Interfaces matching the database schema
export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  store: string;
  loyalty_points: number;
  total_spent: number;
  total_orders: number;
  last_order_date?: string;
  average_order_value: number;
  favorite_category?: string;
  segment: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  store?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  store?: string;
}

export interface CustomerStats {
  total_customers: number;
  active_customers: number;
  new_customers_today: number;
  total_loyalty_points: number;
  average_order_value: number;
  segment_distribution: Array<{
    segment: string;
    customer_count: number;
    percentage: number;
    avg_spent?: number;
    avg_orders?: number;
  }>;
}

export interface TopCustomer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  segment: string;
  order_count: number;
  total_spent: number;
  last_order_date?: string;
}

export interface CustomerTransaction {
  id: number;
  order_number: number;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  payment_type: string;
  created_at: string;
  items?: Array<{
    product_name: string;
    price: number;
    quantity: number;
    category: string;
  }>;
}

export interface LoyaltyPointsRequest {
  points: number;
  action: 'add' | 'subtract';
  reason?: string;
}

export interface SegmentUpdateRequest {
  segment: 'new' | 'regular' | 'vip' | 'loyal' | 'inactive';
}

class CustomersService {
  private baseURL: string;

  constructor() {
    this.baseURL = 'http://192.168.1.3:3000/api/customers';
    console.log('🚀 CustomersService using:', this.baseURL);
  }

  // ===== CORE CUSTOMER OPERATIONS =====

  /**
   * Get all customers with pagination and filtering
   */
  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    segment?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}?${new URLSearchParams(params as any)}`, {
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
    }, 'Failed to fetch customers');
  }

  /**
   * Get a single customer by ID
   */
  async getCustomer(customerId: number) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/${customerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const customer = await response.json();
      return customer;
    }, 'Failed to fetch customer');
  }

  /**
   * Create a new customer
   */
  async createCustomer(customerData: CreateCustomerRequest) {
    return withErrorHandling(async () => {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    }, 'Failed to create customer');
  }

  /**
   * Update customer information
   */
  async updateCustomer(customerId: number, customerData: UpdateCustomerRequest) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    }, 'Failed to update customer');
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(customerId: number) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/${customerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    }, 'Failed to delete customer');
  }

  // ===== CUSTOMER TRANSACTIONS =====

  /**
   * Get customer transaction history
   */
  async getCustomerTransactions(customerId: number, params?: {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/${customerId}/transactions?${new URLSearchParams(params as any)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    }, 'Failed to fetch customer transactions');
  }

  // ===== LOYALTY POINTS MANAGEMENT =====

  /**
   * Update customer loyalty points
   */
  async updateLoyaltyPoints(customerId: number, loyaltyData: LoyaltyPointsRequest) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/${customerId}/loyalty-points`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loyaltyData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    }, 'Failed to update loyalty points');
  }

  /**
   * Add loyalty points to customer
   */
  async addLoyaltyPoints(customerId: number, points: number, reason?: string) {
    return this.updateLoyaltyPoints(customerId, {
      points,
      action: 'add',
      reason
    });
  }

  /**
   * Subtract loyalty points from customer
   */
  async subtractLoyaltyPoints(customerId: number, points: number, reason?: string) {
    return this.updateLoyaltyPoints(customerId, {
      points,
      action: 'subtract',
      reason
    });
  }

  // ===== CUSTOMER SEGMENTATION =====

  /**
   * Update customer segment
   */
  async updateCustomerSegment(customerId: number, segmentData: SegmentUpdateRequest) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/${customerId}/segment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(segmentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    }, 'Failed to update customer segment');
  }

  /**
   * Recalculate segments for all customers
   */
  async recalculateAllSegments() {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/recalculate-segments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    }, 'Failed to recalculate segments');
  }

  /**
   * Update segment for specific customer
   */
  async updateCustomerSegmentAuto(customerId: number) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/update-segment/${customerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    }, 'Failed to update customer segment automatically');
  }

  // ===== REPORTS & ANALYTICS =====

  /**
   * Get customer statistics
   */
  async getCustomerStats() {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/reports/stats`, {
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
    }, 'Failed to fetch customer statistics');
  }

  /**
   * Get top customers by spending
   */
  async getTopCustomers(params?: {
    limit?: number;
    period?: 'all' | 'today' | 'week' | 'month';
  }) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/reports/top-customers?${new URLSearchParams(params as any)}`, {
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
    }, 'Failed to fetch top customers');
  }

  // ===== SEARCH FUNCTIONALITY =====

  /**
   * Search customers by name, phone, or email
   */
  async searchCustomers(query: string) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/search/${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const results = await response.json();
      return results;
    }, 'Failed to search customers');
  }

  // ===== UTILITY METHODS =====

  /**
   * Validate customer data before submission
   */
  validateCustomer(data: CreateCustomerRequest | UpdateCustomerRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if ('name' in data && (!data.name || data.name.trim() === '')) {
      errors.push('Customer name is required');
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Phone number format is invalid');
    }

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Email format is invalid');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate phone number format
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Calculate customer lifetime value metrics
   */
  calculateCustomerMetrics(customer: Customer) {
    return {
      lifetimeValue: customer.total_spent,
      averageOrderValue: customer.average_order_value,
      orderFrequency: customer.total_orders,
      loyaltyTier: this.getLoyaltyTier(customer.loyalty_points),
      customerHealth: this.getCustomerHealthScore(customer),
      segment: customer.segment
    };
  }

  /**
   * Determine loyalty tier based on points
   */
  private getLoyaltyTier(points: number): string {
    if (points >= 1000) return 'Platinum';
    if (points >= 500) return 'Gold';
    if (points >= 100) return 'Silver';
    return 'Bronze';
  }

  /**
   * Calculate customer health score
   */
  private getCustomerHealthScore(customer: Customer): number {
    let score = 0;
    
    // Points for total orders
    if (customer.total_orders >= 10) score += 40;
    else if (customer.total_orders >= 5) score += 25;
    else if (customer.total_orders >= 1) score += 10;
    
    // Points for recency (last order within 30 days)
    if (customer.last_order_date) {
      const lastOrder = new Date(customer.last_order_date);
      const daysSinceLastOrder = (Date.now() - lastOrder.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastOrder <= 30) score += 30;
      else if (daysSinceLastOrder <= 90) score += 15;
    }
    
    // Points for loyalty points
    if (customer.loyalty_points >= 500) score += 30;
    else if (customer.loyalty_points >= 100) score += 20;
    else if (customer.loyalty_points >= 10) score += 10;
    
    return Math.min(100, score);
  }

  /**
   * Generate customer profile summary
   */
  generateCustomerProfile(customer: Customer): string {
    const metrics = this.calculateCustomerMetrics(customer);
    
    return `
CUSTOMER PROFILE
Name: ${customer.name}
${customer.phone ? `Phone: ${customer.phone}` : ''}
${customer.email ? `Email: ${customer.email}` : ''}
Segment: ${customer.segment.toUpperCase()}

STATISTICS
Total Orders: ${customer.total_orders}
Total Spent: ${customer.total_spent.toFixed(2)}
Average Order: ${customer.average_order_value.toFixed(2)}
Loyalty Points: ${customer.loyalty_points}
Loyalty Tier: ${metrics.loyaltyTier}
Health Score: ${metrics.customerHealth}/100

${customer.last_order_date ? `Last Order: ${new Date(customer.last_order_date).toLocaleDateString()}` : 'No orders yet'}
Joined: ${new Date(customer.created_at).toLocaleDateString()}
    `.trim();
  }

  /**
   * Export customer data for reporting
   */
  exportCustomersData(customers: Customer[]): string {
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Segment', 'Total Orders', 'Total Spent', 'Loyalty Points', 'Last Order', 'Join Date'];
    
    const rows = customers.map(customer => [
      customer.id.toString(),
      customer.name,
      customer.phone || '',
      customer.email || '',
      customer.segment,
      customer.total_orders.toString(),
      customer.total_spent.toFixed(2),
      customer.loyalty_points.toString(),
      customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString() : '',
      new Date(customer.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Get segment display information
   */
  getSegmentInfo(segment: string): { label: string; color: string; description: string } {
    const segments: { [key: string]: { label: string; color: string; description: string } } = {
      'vip': {
        label: 'VIP',
        color: '#ec4899',
        description: 'High-value customers with significant spending or loyalty'
      },
      'loyal': {
        label: 'Loyal',
        color: '#10b981',
        description: 'Regular customers with good loyalty and recent activity'
      },
      'regular': {
        label: 'Regular',
        color: '#f59e0b',
        description: 'Active customers with consistent purchases'
      },
      'new': {
        label: 'New',
        color: '#3b82f6',
        description: 'New customers or those with limited activity'
      },
      'inactive': {
        label: 'Inactive',
        color: '#6b7280',
        description: 'Customers with no recent purchases'
      }
    };

    return segments[segment] || {
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      color: '#6b7280',
      description: 'Customer segment'
    };
  }
}

// Create and export singleton instance
export const customersService = new CustomersService();
export default customersService;