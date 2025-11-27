// src/renderer/src/services/supplierService.ts
import { withErrorHandling } from './api';

// Interfaces matching the database schema and new features
export interface Supplier {
  id: number;
  name: string;
  created_at: string;
  phone_number?: string;
  email?: string;
  address?: string;
  contact_person?: string;
  total_products?: number;
  unique_products_restocked?: number;
  last_restock_date?: string;
  reliability_score?: number;
}

export interface SupplierDashboard {
  top_suppliers: TopSupplier[];
  supplier_activity: SupplierActivity[];
  recent_restocks: RecentRestock[];
}

export interface TopSupplier {
  id: number;
  name: string;
  unique_products_supplied: number;
  total_restocks: number;
  total_units_supplied: number;
  total_value_supplied: number;
  average_cost_price: number;
  last_restock_date: string;
  current_products: number;
  current_inventory_value: number;
}

export interface SupplierActivity {
  month: string;
  active_suppliers: number;
  total_restocks: number;
  total_units: number;
  total_value: number;
}

export interface RecentRestock {
  supplier_name: string;
  product_name: string;
  quantity: number;
  cost_price: number;
  restock_date: string;
  total_cost: number;
}

export interface SupplierContactInfo {
  supplier_id: number;
  supplier_name: string;
  extracted_phones: string[];
  suggested_actions: {
    call: string | null;
    whatsapp: string | null;
    email: string | null;
  };
  recent_products: Array<{
    product_name: string;
    restock_date: string;
    last_cost: number;
  }>;
}

export interface PriceTrend {
  product_id: number;
  product_name: string;
  price_history: Array<{
    date: string;
    cost_price: number;
    price_change_percent: number;
  }>;
  current_price: number;
  current_profit_margin: number;
  average_price: number;
  price_volatility: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface SupplierReliability {
  supplier_id: number;
  supplier_name: string;
  reliability_score: number;
  score_breakdown: {
    recency: number;
    volume: number;
    variety: number;
    price_consistency: number;
  };
  key_metrics: {
    total_restocks: number;
    unique_products: number;
    total_units: number;
    days_since_last_order: number;
    current_products: number;
  };
  recommendation: string;
}

export interface ProductSupplierComparison {
  product: {
    id: number;
    name: string;
    barcode: string;
    category: string;
    current_stock: number;
    current_cost_price: number;
    current_supplier: string;
    current_supplier_id: number;
  };
  supplier_comparison: SupplierComparison[];
  current_supplier_performance: SupplierComparison | null;
  summary: {
    total_suppliers: number;
    price_range: number;
    best_supplier: SupplierComparison | null;
    most_reliable_supplier: SupplierComparison | null;
  };
}

export interface SupplierComparison {
  supplier_id: number;
  supplier_name: string;
  cost_price: number;
  quantity: number;
  restock_date: string;
  batch_number: string;
  total_cost: number;
  total_restocks: number;
  average_cost_price: number;
  total_quantity_supplied: number;
  best_price: number;
  worst_price: number;
  last_supply_date: string;
}

export interface SupplierProductPortfolio {
  supplier: Supplier;
  products: SupplierProduct[];
  performance: {
    unique_products_supplied: number;
    total_units_supplied: number;
    average_cost_across_products: number;
    lowest_cost_provided: number;
    highest_cost_provided: number;
    total_restock_events: number;
    last_restock_date: string;
    price_variability: number;
  };
}

export interface SupplierProduct {
  id: number;
  name: string;
  barcode: string;
  category: string;
  quantity: number;
  current_cost: number;
  selling_price: number;
  profit_margin: number;
  last_restocked: string;
  current_supplier_id: number;
  current_supplier_name: string;
  times_supplied: number;
  average_historical_cost: number;
  best_price_from_supplier: number;
  worst_price_from_supplier: number;
  supplier_relationship: 'current' | 'historical';
}

export interface BulkRestockItem {
  productId: number;
  quantity: number;
  costPrice: number;
  batchNumber?: string;
}

export interface CreateSupplierRequest {
  name: string;
  phone_number?: string;
  email?: string;
  address?: string;
  contact_person?: string;
}

class SupplierService {
  private baseURL: string;

  constructor() {
    this.baseURL = 'http://192.168.1.3:3001/api';
    console.log('🚀 SupplierService using:', this.baseURL);
  }

  // ===== CORE SUPPLIER OPERATIONS =====

  /**
   * Get all suppliers
   */
  async getSuppliers(params?: { search?: string }): Promise<Supplier[]> {
    return withErrorHandling(async () => {
      const queryParams = new URLSearchParams();
      if (params?.search) {
        queryParams.append('search', params.search);
      }

      const response = await fetch(`${this.baseURL}/suppliers?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ SupplierService - Found ${data.length} suppliers`);
      return data;
    }, 'Failed to fetch suppliers');
  }

  /**
   * Create a new supplier
   */
  async createSupplier(supplierData: CreateSupplierRequest) {
    return withErrorHandling(async () => {
      if (!supplierData.name || supplierData.name.trim().length === 0) {
        throw new Error('Supplier name is required');
      }

      console.log(`🔄 Creating new supplier: ${supplierData.name}`);

      const response = await fetch(`${this.baseURL}/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Supplier created successfully:', result);
      return result;
    }, 'Failed to create supplier');
  }

  /**
   * Update an existing supplier
   */
  async updateSupplier(supplierId: number, supplierData: CreateSupplierRequest) {
    return withErrorHandling(async () => {
      if (!supplierData.name || supplierData.name.trim().length === 0) {
        throw new Error('Supplier name is required');
      }

      console.log(`🔄 Updating supplier ${supplierId}: ${supplierData.name}`);

      const response = await fetch(`${this.baseURL}/suppliers/${supplierId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Supplier updated successfully:', result);
      return result;
    }, 'Failed to update supplier');
  }

  // ===== NEW FEATURE: SUPPLIER DASHBOARD =====

  /**
   * Get supplier dashboard data
   */
  async getSupplierDashboard(): Promise<SupplierDashboard> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/suppliers/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Supplier dashboard data loaded');
      return data;
    }, 'Failed to fetch supplier dashboard');
  }

  // ===== NEW FEATURE: SUPPLIER CONTACT INTEGRATION =====

  /**
   * Get supplier contact information with phone extraction
   */
  async getSupplierContactInfo(supplierId: number): Promise<SupplierContactInfo> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/suppliers/${supplierId}/contact-info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Contact info for supplier ${supplierId} with ${data.extracted_phones.length} phone numbers`);
      return data;
    }, 'Failed to fetch supplier contact info');
  }

  // ===== NEW FEATURE: PRICE TREND ANALYSIS =====

  /**
   * Get supplier price trends
   */
  async getSupplierPriceTrends(supplierId: number): Promise<PriceTrend[]> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/suppliers/${supplierId}/price-trends`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Price trends for supplier ${supplierId} with ${data.length} products`);
      return data;
    }, 'Failed to fetch supplier price trends');
  }

  // ===== NEW FEATURE: SUPPLIER RELIABILITY SCORING =====

  /**
   * Get supplier reliability score
   */
  async getSupplierReliability(supplierId: number): Promise<SupplierReliability> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/suppliers/${supplierId}/reliability`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Reliability score for supplier ${supplierId}: ${data.reliability_score}`);
      return data;
    }, 'Failed to fetch supplier reliability');
  }

  // ===== PRODUCT-SUPPLIER RELATIONSHIP ANALYSIS =====

  /**
   * Get product supplier comparison
   */
  async getProductSupplierComparison(productId: number): Promise<ProductSupplierComparison> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/suppliers/products/${productId}/suppliers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Supplier comparison for product ${productId} with ${data.supplier_comparison.length} suppliers`);
      return data;
    }, 'Failed to fetch product supplier comparison');
  }

  /**
   * Get supplier product portfolio
   */
  async getSupplierProductPortfolio(supplierId: number): Promise<SupplierProductPortfolio> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/suppliers/${supplierId}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Product portfolio for supplier ${supplierId} with ${data.products.length} products`);
      return data;
    }, 'Failed to fetch supplier product portfolio');
  }

  // ===== BULK OPERATIONS =====

  /**
   * Bulk restock from supplier
   */
  async bulkRestockFromSupplier(supplierId: number, restockItems: BulkRestockItem[]) {
    return withErrorHandling(async () => {
      if (!Array.isArray(restockItems) || restockItems.length === 0) {
        throw new Error('Restock items are required');
      }

      console.log(`🔄 Bulk restocking ${restockItems.length} items from supplier ${supplierId}`);

      const response = await fetch(`${this.baseURL}/suppliers/${supplierId}/bulk-restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restockItems }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Bulk restock completed:', result);
      return result;
    }, 'Failed to process bulk restock');
  }

  /**
   * Switch product to a different supplier
   */
  async switchProductSupplier(productId: number, newSupplierId: number) {
    return withErrorHandling(async () => {
      console.log(`🔄 Switching product ${productId} to supplier ${newSupplierId}`);

      const response = await fetch(`${this.baseURL}/suppliers/switch-product-supplier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          newSupplierId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Product supplier switched successfully:', result);
      return result;
    }, 'Failed to switch product supplier');
  }

  // ===== SEARCH AND FILTERING =====

  /**
   * Search suppliers
   */
  async searchSuppliers(query: string, limit: number = 10): Promise<Supplier[]> {
    return withErrorHandling(async () => {
      if (!query || typeof query !== 'string') {
        throw new Error('Search query is required');
      }

      const response = await fetch(`${this.baseURL}/suppliers/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Supplier search found ${data.length} results for "${query}"`);
      return data;
    }, 'Failed to search suppliers');
  }

  /**
   * Search products with supplier context
   */
  async searchProductsWithSuppliers(query: string, limit: number = 10): Promise<any[]> {
    return withErrorHandling(async () => {
      if (!query || typeof query !== 'string') {
        throw new Error('Search query is required');
      }

      const response = await fetch(`${this.baseURL}/suppliers/products/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Product search with suppliers found ${data.length} results for "${query}"`);
      return data;
    }, 'Failed to search products with suppliers');
  }

  // ===== UTILITY METHODS =====

  /**
   * Get recently restocked products
   */
  async getRecentRestocks(limit: number = 5): Promise<any[]> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/suppliers/recent-restocks?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Retrieved ${data.length} recent restocks`);
      return data;
    }, 'Failed to fetch recent restocks');
  }

  /**
   * Validate supplier data
   */
  validateSupplier(data: CreateSupplierRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Supplier name is required');
    }

    if (data.name.trim().length < 2) {
      errors.push('Supplier name must be at least 2 characters long');
    }

    // Optional: Add validation for contact fields
    if (data.phone_number && !this.isValidPhoneNumber(data.phone_number)) {
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
   * Validate phone number (Ugandan format)
   */
  public isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^(\+?256|0)(7[0-9]|20)[0-9]{7}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Validate email format
   */
  public isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Extract phone numbers from supplier name (Ugandan format)
   */
  extractPhoneNumbers(supplierName: string): string[] {
    const phoneRegex = /(\+?256|0)(7[0-9]|20)[0-9]{7}/g;
    return supplierName.match(phoneRegex) || [];
  }

  /**
   * Generate WhatsApp link from phone number
   */
  generateWhatsAppLink(phoneNumber: string): string {
    const cleanNumber = phoneNumber.replace('+', '').replace('0', '256');
    return `https://wa.me/${cleanNumber}`;
  }

  /**
   * Generate call link from phone number
   */
  generateCallLink(phoneNumber: string): string {
    return `tel:${phoneNumber}`;
  }

  /**
   * Calculate supplier performance metrics
   */
  calculateSupplierPerformance(suppliers: any[]) {
    const stats = {
      totalSuppliers: suppliers.length,
      activeSuppliers: suppliers.filter(s => s.last_restock_date).length,
      totalProducts: suppliers.reduce((sum, s) => sum + (s.total_products || 0), 0),
      totalInventoryValue: suppliers.reduce((sum, s) => sum + (s.current_inventory_value || 0), 0),
      averageProductsPerSupplier: 0
    };

    stats.averageProductsPerSupplier = stats.totalSuppliers > 0 ? stats.totalProducts / stats.totalSuppliers : 0;

    return stats;
  }

  /**
   * Format supplier reliability recommendation
   */
  formatReliabilityRecommendation(score: number): string {
    if (score >= 80) return 'Highly Recommended';
    if (score >= 60) return 'Recommended';
    if (score >= 40) return 'Moderate';
    return 'Consider Alternatives';
  }

  /**
   * Get supplier performance color
   */
  getPerformanceColor(score: number): string {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  }
}

// Create and export singleton instance
export const supplierService = new SupplierService();
export default supplierService;