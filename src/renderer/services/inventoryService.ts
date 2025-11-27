// src/renderer/src/services/inventoryService.ts
import { withErrorHandling } from './api';

// Interfaces matching the database schema and new features
export interface Product {
  id: number;
  name: string;
  barcode: string;
  price: number;
  cost_price: number;
  category: string;
  quantity: number;
  min_stock: number;
  stock: number;
  expiration_date: string;
  img: string;
  description: string;
  prescription_required: number;
  is_controlled_substance: number;
  side_effects: string;
  supplier: string;
  last_restocked: string;
  manufacturer: string;
  storage_conditions: string;
  created_at: string;
  updated_at: string;
  supplier_id: number;
  sales_count: number;
  reorder_level: number;
}

export interface LowStockAlert {
  product_id: number;
  product_name: string;
  current_quantity: number;
  min_stock: number;
  reorder_level: number;
  last_sold_date: string | null;
  days_since_last_sale: number | null;
  category: string;
  supplier_name: string;
  supplier_id: number;
  urgency: 'critical' | 'high' | 'medium';
}

export interface ExpiringProduct {
  product_id: number;
  product_name: string;
  expiration_date: string;
  days_until_expiry: number;
  current_quantity: number;
  category: string;
  cost_price: number;
  price: number;
  urgency: 'critical' | 'high' | 'medium';
}

export interface StockMovement {
  product_id: number;
  product_name: string;
  category: string;
  sales_count: number;
  total_quantity_sold: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  profit_margin_percent: number;
  last_sold_date: string | null;
  movement_type: 'fast' | 'medium' | 'slow' | 'dead';
}

export interface ProfitableCategory {
  category: string;
  product_count: number;
  total_quantity_sold: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  profit_margin_percent: number;
  transaction_count: number;
}

export interface RestockSuggestion {
  product_id: number;
  product_name: string;
  current_quantity: number;
  min_stock: number;
  reorder_level: number;
  category: string;
  supplier_id: number;
  current_supplier_name: string;
  sold_last_30_days: number;
  last_sold_date: string | null;
  days_since_last_sale: number;
  last_supplier_name: string;
  last_supplier_id: number;
  last_cost_price: number;
  last_restock_date: string;
  suggested_quantity: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  suggested_supplier: string;
  suggested_supplier_id: number;
  suggested_cost_price: number;
}

export interface SupplierPerformance {
  supplier_id: number;
  supplier_name: string;
  unique_products_supplied: number;
  total_restocks: number;
  total_units_supplied: number;
  average_cost_price: number;
  min_cost_price: number;
  max_cost_price: number;
  last_restock_date: string;
  current_products: number;
  current_inventory_value: number;
  current_avg_cost: number;
}

export interface PriceHistory {
  date: string;
  cost_price: number;
  supplier_name: string;
  quantity: number;
  selling_price_at_time: number;
  profit_margin_at_time: number;
  previous_cost_price: number;
  cost_change_percent: number;
}

export interface RestockRequest {
  productId: number;
  quantity: number;
  costPrice: number;
  supplierId: number;
  batchNumber?: string;
}

export interface CreateProductRequest {
  name: string;
  barcode?: string;
  price: number;
  cost_price: number;
  category: string;
  quantity: number;
  min_stock?: number;
  expiration_date?: string;
  description?: string;
  supplier?: string;
  supplier_id?: number;
  manufacturer?: string;
  prescription_required?: boolean;
  is_controlled_substance?: boolean;
  storage_conditions?: string;
  reorder_level?: number;
}

export interface UpdateProductRequest {
  id: number;
  name?: string;
  barcode?: string;
  price?: number;
  cost_price?: number;
  category?: string;
  quantity?: number;
  min_stock?: number;
  expiration_date?: string;
  description?: string;
  supplier?: string;
  supplier_id?: number;
  manufacturer?: string;
  prescription_required?: boolean;
  is_controlled_substance?: boolean;
  storage_conditions?: string;
  reorder_level?: number;
}

class InventoryService {
  private baseURL: string;

  constructor() {
    this.baseURL = 'http://192.168.1.3:3001/api';
    console.log('🚀 InventoryService using:', this.baseURL);
  }

  // ===== CORE PRODUCT OPERATIONS =====

  /**
   * Get all products
   */
  async getProducts() {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/inventory/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ InventoryService - Found ${data.length} products`);
      return data;
    }, 'Failed to fetch products');
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: number) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/inventory/product/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    }, 'Failed to fetch product');
  }

  /**
   * Create a new product
   */
  async createProduct(productData: CreateProductRequest) {
    return withErrorHandling(async () => {
      // Validate required fields
      if (!productData.name || !productData.price || !productData.cost_price || !productData.category) {
        throw new Error('Missing required product fields: name, price, cost_price, category');
      }

      console.log(`🔄 Creating new product: ${productData.name}`);

      const response = await fetch(`${this.baseURL}/inventory/product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...productData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Product created successfully:', result);
      return result;
    }, 'Failed to create product');
  }

  /**
   * Update an existing product
   */
  async updateProduct(productData: UpdateProductRequest) {
    return withErrorHandling(async () => {
      if (!productData.id) {
        throw new Error('Product ID is required for update');
      }

      console.log(`🔄 Updating product ID: ${productData.id}`);

      const response = await fetch(`${this.baseURL}/inventory/product`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Product updated successfully:', result);
      return result;
    }, 'Failed to update product');
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId: number) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/inventory/product/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Product deleted successfully');
      return { success: true, message: 'Product deleted successfully' };
    }, 'Failed to delete product');
  }

  /**
   * Restock a product
   */
  async restockProduct(restockData: RestockRequest) {
    return withErrorHandling(async () => {
      if (!restockData.productId || !restockData.quantity || !restockData.costPrice || !restockData.supplierId) {
        throw new Error('Missing required restock fields: productId, quantity, costPrice, supplierId');
      }

      console.log(`🔄 Restocking product ID: ${restockData.productId}`);

      const response = await fetch(`${this.baseURL}/inventory/product/restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restockData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Product restocked successfully:', result);
      return result;
    }, 'Failed to restock product');
  }

  // ===== NEW FEATURE: INVENTORY ALERTS =====

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(params?: { threshold_days?: number }): Promise<LowStockAlert[]> {
    return withErrorHandling(async () => {
      const queryParams = new URLSearchParams();
      if (params?.threshold_days) {
        queryParams.append('threshold_days', params.threshold_days.toString());
      }

      const response = await fetch(`${this.baseURL}/inventory/alerts/low-stock?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Found ${data.length} low stock alerts`);
      return data;
    }, 'Failed to fetch low stock alerts');
  }

  /**
   * Get expiring products alerts
   */
  async getExpiringProducts(params?: { days?: number }): Promise<ExpiringProduct[]> {
    return withErrorHandling(async () => {
      const queryParams = new URLSearchParams();
      if (params?.days) {
        queryParams.append('days', params.days.toString());
      }

      const response = await fetch(`${this.baseURL}/inventory/alerts/expiring?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Found ${data.length} expiring products`);
      return data;
    }, 'Failed to fetch expiring products');
  }

  // ===== NEW FEATURE: STOCK ANALYTICS =====

  /**
   * Get stock movement analysis
   */
  async getStockMovementAnalysis(params?: { period_days?: number }): Promise<StockMovement[]> {
    return withErrorHandling(async () => {
      const queryParams = new URLSearchParams();
      if (params?.period_days) {
        queryParams.append('period_days', params.period_days.toString());
      }

      const response = await fetch(`${this.baseURL}/inventory/analytics/movement?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Stock movement analysis for ${data.length} products`);
      return data;
    }, 'Failed to fetch stock movement analysis');
  }

  /**
   * Get profitable categories
   */
  async getProfitableCategories(params?: { period_days?: number }): Promise<ProfitableCategory[]> {
    return withErrorHandling(async () => {
      const queryParams = new URLSearchParams();
      if (params?.period_days) {
        queryParams.append('period_days', params.period_days.toString());
      }

      const response = await fetch(`${this.baseURL}/inventory/analytics/profitable-categories?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Profitability data for ${data.length} categories`);
      return data;
    }, 'Failed to fetch profitable categories');
  }

  /**
   * Get supplier performance
   */
  async getSupplierPerformance(): Promise<SupplierPerformance[]> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/inventory/analytics/supplier-performance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Performance data for ${data.length} suppliers`);
      return data;
    }, 'Failed to fetch supplier performance');
  }

  // ===== NEW FEATURE: RESTOCK SUGGESTIONS =====

  /**
   * Get smart restock suggestions
   */
  async getRestockSuggestions(params?: { include_dead_stock?: boolean }): Promise<RestockSuggestion[]> {
    return withErrorHandling(async () => {
      const queryParams = new URLSearchParams();
      if (params?.include_dead_stock !== undefined) {
        queryParams.append('include_dead_stock', params.include_dead_stock.toString());
      }

      const response = await fetch(`${this.baseURL}/inventory/restock-suggestions?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ ${data.length} restock suggestions generated`);
      return data;
    }, 'Failed to fetch restock suggestions');
  }

  // ===== NEW FEATURE: ENHANCED SEARCH =====

  /**
   * Enhanced product search with supplier history
   */
  async searchProductsEnhanced(query: string, includeSuppliers: boolean = true): Promise<any[]> {
    return withErrorHandling(async () => {
      if (!query || typeof query !== 'string') {
        throw new Error('Search query is required');
      }

      const queryParams = new URLSearchParams({
        query: query,
        include_suppliers: includeSuppliers.toString()
      });

      const response = await fetch(`${this.baseURL}/inventory/products/search-enhanced?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Enhanced search found ${data.length} products for "${query}"`);
      return data;
    }, 'Failed to search products');
  }

  /**
   * Get price history for a product
   */
  async getProductPriceHistory(productId: number): Promise<PriceHistory[]> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/inventory/products/${productId}/price-history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Price history for product ${productId} with ${data.length} entries`);
      return data;
    }, 'Failed to fetch price history');
  }

  // ===== UTILITY METHODS =====

  /**
   * Search products (basic search)
   */
  async searchProducts(query: string) {
    return withErrorHandling(async () => {
      if (!query || typeof query !== 'string') {
        throw new Error('Search query is required');
      }

      const response = await fetch(`${this.baseURL}/inventory/products/search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Basic search found ${data.length} products for "${query}"`);
      return data;
    }, 'Failed to search products');
  }

  /**
   * SKU lookup by barcode
   */
  async lookupBySKU(skuCode: string) {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/inventory/product/sku`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skuCode }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    }, 'Failed to lookup product by SKU');
  }

  /**
   * Calculate product statistics
   */
  calculateProductStats(products: Product[]) {
    const stats = {
      totalProducts: products.length,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      categoryBreakdown: {} as Record<string, number>,
      averagePrice: 0,
      averageCost: 0
    };

    products.forEach((product) => {
      stats.totalValue += product.quantity * product.cost_price;
      
      if (product.quantity <= 0) {
        stats.outOfStockCount++;
      } else if (product.quantity <= product.min_stock) {
        stats.lowStockCount++;
      }

      stats.categoryBreakdown[product.category] = (stats.categoryBreakdown[product.category] || 0) + 1;
    });

    stats.averagePrice = products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0;
    stats.averageCost = products.length > 0 ? products.reduce((sum, p) => sum + p.cost_price, 0) / products.length : 0;

    return stats;
  }

  /**
   * Validate product data before submission
   */
  validateProduct(data: CreateProductRequest | UpdateProductRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Product name is required');
    }

    if (!data.price || data.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (!data.cost_price || data.cost_price <= 0) {
      errors.push('Cost price must be greater than 0');
    }

    if (!data.category || data.category.trim().length === 0) {
      errors.push('Category is required');
    }

    if (data.quantity !== undefined && data.quantity < 0) {
      errors.push('Quantity cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate urgency level for stock alerts
   */
  getStockUrgency(currentQuantity: number, minStock: number, reorderLevel: number): 'critical' | 'high' | 'medium' | 'low' {
    if (currentQuantity <= 0) return 'critical';
    if (currentQuantity <= minStock) return 'high';
    if (currentQuantity <= reorderLevel) return 'medium';
    return 'low';
  }

  /**
   * Generate expiry urgency
   */
  getExpiryUrgency(daysUntilExpiry: number): 'critical' | 'high' | 'medium' | 'safe' {
    if (daysUntilExpiry <= 30) return 'critical';
    if (daysUntilExpiry <= 60) return 'high';
    if (daysUntilExpiry <= 90) return 'medium';
    return 'safe';
  }
}

// Create and export singleton instance
export const inventoryService = new InventoryService();
export default inventoryService;