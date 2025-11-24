// src/renderer/src/services/suppliersService.ts
import { withErrorHandling } from './api';

// Updated interfaces matching the fixed API
export interface Supplier {
  id: number;
  name: string;
  created_at: string;
  total_products?: number;
  unique_products_restocked?: number;
  last_restock_date?: string;
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
  supplier_comparison: Array<{
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
  }>;
  current_supplier_performance: any;
  summary: {
    total_suppliers: number;
    price_range: number;
    best_supplier: any;
    most_reliable_supplier: any;
  };
}

export interface RecentRestock {
  product_id: number;
  product_name: string;
  supplier_id: number;
  supplier_name: string;
  cost_price: number;
  quantity: number;
  restock_date: string;
  current_cost_price: number;
  current_supplier_id: number;
  current_supplier_name: string;
  total_cost: number;
  price_difference: number;
  batch_number?: string;
}

export interface SupplierProductPortfolio {
  supplier: Supplier;
  products: Array<{
    id: number;
    name: string;
    barcode: string;
    category: string;
    quantity: number;
    current_cost: number;
    selling_price: number;
    profit_margin: number;
    last_restocked: string;
    times_supplied: number;
    average_historical_cost: number;
    best_price_from_supplier: number;
    worst_price_from_supplier: number;
    supplier_relationship: 'current' | 'historical';
    current_supplier_id: number;
    current_supplier_name: string;
  }>;
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

export interface BulkRestockItem {
  productId: number;
  quantity: number;
  costPrice: number;
  batchNumber?: string;
}

export interface BulkRestockResult {
  success: boolean;
  results: Array<{
    productId: number;
    success: boolean;
    error?: string;
  }>;
  message: string;
}

class SuppliersService {
  private baseURL: string;

  constructor() {
    this.baseURL = 'http://192.168.1.3:3000/api/suppliers';
    console.log('🚀 SuppliersService using:', this.baseURL);
  }

  // ===== DASHBOARD FEATURES =====

  /**
   * Get recently restocked products (Dashboard default view)
   */
  async getRecentRestocks(limit: number = 5): Promise<RecentRestock[]> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/recent-restocks?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    }, 'Failed to fetch recent restocks');
  }

  // ===== PRODUCT SEARCH & COMPARISON =====

  /**
   * Search products with supplier history
   */
  async searchProducts(query: string, limit: number = 10): Promise<any[]> {
    return withErrorHandling(async () => {
      const response = await fetch(
        `${this.baseURL}/products/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    }, 'Failed to search products');
  }

  /**
   * Get product supplier comparison
   */
  async getProductSupplierComparison(productId: number): Promise<ProductSupplierComparison> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/products/${productId}/suppliers`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    }, 'Failed to fetch product supplier comparison');
  }

  // ===== SUPPLIER SEARCH & ANALYSIS =====

  /**
   * Search suppliers
   */
  async searchSuppliers(query: string, limit: number = 10): Promise<Supplier[]> {
    return withErrorHandling(async () => {
      const response = await fetch(
        `${this.baseURL}/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    }, 'Failed to search suppliers');
  }

  /**
   * Get supplier product portfolio
   */
  async getSupplierPortfolio(supplierId: number): Promise<SupplierProductPortfolio> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/${supplierId}/products`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    }, 'Failed to fetch supplier portfolio');
  }

  // ===== BASIC SUPPLIER OPERATIONS =====

  /**
   * Get all suppliers
   */
  async getSuppliers(search?: string): Promise<Supplier[]> {
    return withErrorHandling(async () => {
      const url = search 
        ? `${this.baseURL}?search=${encodeURIComponent(search)}`
        : this.baseURL;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    }, 'Failed to fetch suppliers');
  }

  /**
   * Create a new supplier
   */
  async createSupplier(name: string): Promise<{ success: boolean; supplierId: number; message: string }> {
    return withErrorHandling(async () => {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    }, 'Failed to create supplier');
  }

  // ===== RESTOCK OPERATIONS =====

  /**
   * Process bulk restock from supplier
   */
  async bulkRestock(supplierId: number, restockItems: BulkRestockItem[]): Promise<BulkRestockResult> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/${supplierId}/bulk-restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restockItems }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    }, 'Failed to process bulk restock');
  }

  // ===== UTILITY METHODS =====

  /**
   * Get best supplier for a product based on historical data
   */
  getBestSupplier(comparison: ProductSupplierComparison): any {
    return comparison.summary.best_supplier;
  }

  /**
   * Get most reliable supplier for a product
   */
  getMostReliableSupplier(comparison: ProductSupplierComparison): any {
    return comparison.summary.most_reliable_supplier;
  }

  /**
   * Calculate potential savings from switching suppliers
   */
  calculatePotentialSavings(comparison: ProductSupplierComparison, monthlyUsage: number = 1): number {
    const currentSupplier = comparison.current_supplier_performance;
    const bestSupplier = comparison.summary.best_supplier;

    if (!currentSupplier || !bestSupplier) return 0;

    const currentMonthlyCost = currentSupplier.average_cost_price * monthlyUsage;
    const bestMonthlyCost = bestSupplier.average_cost_price * monthlyUsage;
    
    return currentMonthlyCost - bestMonthlyCost;
  }

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX'
    }).format(price);
  }

  /**
   * Get supplier performance rating
   */
  getSupplierPerformanceRating(portfolio: SupplierProductPortfolio): number {
    const performance = portfolio.performance;
    
    let rating = 5; // Start with perfect score
    
    // Deduct points for high price variability
    if (performance.price_variability > performance.average_cost_across_products * 0.2) {
      rating -= 1;
    }
    
    // Deduct points for low restock frequency
    if (performance.total_restock_events === 0) {
      rating -= 2;
    } else if (performance.total_restock_events < 3) {
      rating -= 1;
    }
    
    // Deduct points if last restock was more than 30 days ago
    if (performance.last_restock_date) {
      const lastRestock = new Date(performance.last_restock_date);
      const daysSinceLastRestock = (Date.now() - lastRestock.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastRestock > 30) {
        rating -= 1;
      }
    }
    
    return Math.max(1, rating); // Minimum 1 star
  }

  /**
   * Generate quick supplier comparison summary
   */
  generateComparisonSummary(comparison: ProductSupplierComparison): string {
    const { total_suppliers, price_range, best_supplier } = comparison.summary;
    
    const currentCost = comparison.product.current_cost_price;
    const bestCost = best_supplier?.average_cost_price || currentCost;
    const savings = currentCost - bestCost;
    const savingsPercent = ((savings / currentCost) * 100);

    return `
      Product: ${comparison.product.name}
      Suppliers Used: ${total_suppliers}
      Price Range: ${this.formatPrice(price_range)}
      Current Cost: ${this.formatPrice(currentCost)}
      Best Available: ${this.formatPrice(bestCost)}
      ${savings > 0 ? `Potential Savings: ${this.formatPrice(savings)} (${savingsPercent.toFixed(1)}%)` : 'No better prices available'}
    `.trim();
  }

  /**
   * Get supplier relationship type for display
   */
  getSupplierRelationshipDisplay(relationship: 'current' | 'historical'): { label: string; color: string; icon: string } {
    switch (relationship) {
      case 'current':
        return { label: 'Current Supplier', color: 'success', icon: 'check-circle' };
      case 'historical':
        return { label: 'Historical Supplier', color: 'blue', icon: 'clock' };
      default:
        return { label: 'Unknown', color: 'gray', icon: 'help-circle' };
    }
  }
}

// Create and export singleton instance
export const suppliersService = new SuppliersService();
export default suppliersService;