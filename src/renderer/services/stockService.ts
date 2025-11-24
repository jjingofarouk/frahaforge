// src/renderer/src/services/stockService.ts
import { withErrorHandling } from './api';
import { inventoryService, Product } from './inventoryService';
import electronStoreService from './electronStoreService';

// Interfaces matching your backend exactly
export interface StockProduct {
  id: number;
  barcode: number | null;
  expiration_date: string | null;
  price: string | null;
  category: string;
  category_id: number;
  quantity: number;
  name: string;
  stock: number;
  min_stock: string | null;
  img: string | null;
  description?: string;
  cost_price?: string;
  supplier?: string;
  last_restocked?: string;
  reorder_level?: number;
  profit_margin?: string;
  batch_number?: string;
  manufacturer?: string;
  drug_class?: string;
  prescription_required?: boolean;
  side_effects?: string;
  storage_conditions?: string;
  active_ingredients?: string;
  dosage_form?: string;
  strength?: string;
  package_size?: string;
  is_controlled_substance?: boolean;
  requires_refrigeration?: boolean;
  wholesale_price?: string;
  last_price_update?: string;
  sales_count?: number;
  profit_amount?: string;
  supplier_id?: number;
  primary_supplier_id?: number;
}

export interface RestockRequest {
  productId: number;
  quantity: number;
  costPrice: string;
  supplierId: number;
  batchNumber?: string;
}

export interface RestockHistory {
  id: number;
  product_id: number;
  product_name: string;
  supplier_id: number;
  supplier_name: string;
  cost_price: string;
  quantity: number;
  restock_date: string;
  batch_number?: string;
  previous_quantity: number;
  new_quantity: number;
}

export interface StockLevel {
  productId: number;
  productName: string;
  currentStock: number;
  minStock: number;
  status: 'out' | 'low' | 'adequate';
  lastUpdated: string;
}

// In your stockService.ts - update the StockAlert interface
export interface StockAlert {
  productId: number;
  productName: string;
  currentStock: number;
  minStock: number;
  alertType: 'out_of_stock' | 'low_stock' | 'expiring_soon';
  urgency: 'high' | 'medium' | 'low';
  message?: string; // Add these to match component expectations
  suggestion?: string;
  type?: 'critical' | 'warning' | 'info' | 'success'; // For compatibility
}

export interface StockMovement {
  productId: number;
  productName: string;
  change: number;
  type: 'sale' | 'restock' | 'adjustment';
  date: string;
  reference: string;
}

export interface StockStats {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  averageStockLevel: number;
  categoryBreakdown: { category: string; count: number; value: number }[];
}

export interface ProductSearchResult {
  products: StockProduct[];
  total: number;
  hasMore: boolean;
}

// Cache configuration
const CACHE_KEYS = {
  STOCK_DATA: 'stock_data_cache',
  STOCK_STATS: 'stock_stats_cache',
  STOCK_ALERTS: 'stock_alerts_cache',
  LAST_UPDATED: 'stock_last_updated'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTO_REFRESH_INTERVAL = 30 * 1000; // 30 seconds

class StockService {
  private baseURL: string;
  private stockCache: {
    products: StockProduct[] | null;
    stats: StockStats | null;
    alerts: StockAlert[] | null;
    lastUpdated: number | null;
  } = {
    products: null,
    stats: null,
    alerts: null,
    lastUpdated: null
  };

  constructor() {
    this.baseURL = 'http://192.168.1.3:3000/api/inventory';
    console.log('🚀 StockService initialized with:', this.baseURL);
  }

  // ===== CORE STOCK OPERATIONS =====

  /**
   * Get all stock products with caching
   */
  async getStockProducts(forceRefresh = false): Promise<StockProduct[]> {
    return withErrorHandling(async () => {
      // Return cached data if available and not expired
      if (!forceRefresh && this.stockCache.products && this.stockCache.lastUpdated && 
          Date.now() - this.stockCache.lastUpdated < CACHE_DURATION) {
        console.log('📦 Returning cached stock products');
        return this.stockCache.products;
      }

      console.log('🔄 Fetching stock products from API...');
      const response = await fetch(`${this.baseURL}/products`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const products = await response.json();
      
      // Update cache
      this.stockCache.products = products;
      this.stockCache.lastUpdated = Date.now();
      
      console.log(`✅ Loaded ${products.length} stock products from API`);
      return products;
    }, 'Failed to fetch stock products');
  }

  /**
   * Force refresh stock data
   */
  async forceRefresh(): Promise<StockProduct[]> {
    return this.getStockProducts(true);
  }

  /**
   * Get critical stock data for immediate display
   */
  async getCriticalStockData(): Promise<{
    basicProducts: StockProduct[];
    lowStockCount: number;
    outOfStockCount: number;
    totalProducts: number;
  }> {
    return withErrorHandling(async () => {
      console.log('🚀 Loading critical stock data for immediate display...');
      
      try {
        const products = await this.getStockProducts();
        
        const lowStockCount = products.filter(p => {
          const minStockValue = p.min_stock ? this.safeParseNumber(p.min_stock) : 5;
          return p.quantity <= minStockValue && p.quantity > 0;
        }).length;
        
        const outOfStockCount = products.filter(p => p.quantity === 0).length;

        console.log(`✅ Critical stock data loaded: ${products.length} products`);
        
        return {
          basicProducts: products,
          lowStockCount,
          outOfStockCount,
          totalProducts: products.length
        };
      } catch (error) {
        console.error('Failed to load critical stock data:', error);
        throw error;
      }
    }, 'Failed to fetch critical stock data');
  }

  /**
   * Get single product by ID
   */
  async getStockProduct(productId: number): Promise<StockProduct> {
    return withErrorHandling(async () => {
      // Try cache first
      if (this.stockCache.products) {
        const cachedProduct = this.stockCache.products.find(p => p.id === productId);
        if (cachedProduct) {
          return cachedProduct;
        }
      }

      const response = await fetch(`${this.baseURL}/product/${productId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    }, 'Failed to fetch stock product');
  }

  // ===== STOCK ANALYTICS & STATISTICS =====

  /**
   * Get comprehensive stock statistics
   */
  async getStockStats(forceRefresh = false): Promise<StockStats> {
    return withErrorHandling(async () => {
      // Return cached stats if available
      if (!forceRefresh && this.stockCache.stats && this.stockCache.lastUpdated && 
          Date.now() - this.stockCache.lastUpdated < CACHE_DURATION) {
        return this.stockCache.stats;
      }

      const products = await this.getStockProducts(forceRefresh);
      
      const lowStockCount = products.filter(p => {
        const minStockValue = p.min_stock ? this.safeParseNumber(p.min_stock) : 5;
        return p.quantity <= minStockValue && p.quantity > 0;
      }).length;
      
      const outOfStockCount = products.filter(p => p.quantity === 0).length;
      
      const totalInventoryValue = products.reduce((total, product) => {
        const cost = product.cost_price ? this.safeParseNumber(product.cost_price) : 0;
        return total + (cost * product.quantity);
      }, 0);

      const averageStockLevel = products.length > 0 
        ? products.reduce((sum, p) => sum + p.quantity, 0) / products.length 
        : 0;

      // Category breakdown
      const categoryMap = new Map<string, { count: number; value: number }>();
      products.forEach(product => {
        const category = product.category || 'Uncategorized';
        const current = categoryMap.get(category) || { count: 0, value: 0 };
        const cost = product.cost_price ? this.safeParseNumber(product.cost_price) : 0;
        
        categoryMap.set(category, {
          count: current.count + 1,
          value: current.value + (cost * product.quantity)
        });
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        value: data.value
      }));

      const stats: StockStats = {
        totalProducts: products.length,
        lowStockCount,
        outOfStockCount,
        totalInventoryValue,
        averageStockLevel,
        categoryBreakdown
      };

      // Update cache
      this.stockCache.stats = stats;
      
      return stats;
    }, 'Failed to calculate stock statistics');
  }

  /**
   * Get stock alerts (low stock, out of stock, expiring soon)
   */
  async getStockAlerts(forceRefresh = false): Promise<StockAlert[]> {
    return withErrorHandling(async () => {
      // Return cached alerts if available
      if (!forceRefresh && this.stockCache.alerts && this.stockCache.lastUpdated && 
          Date.now() - this.stockCache.lastUpdated < CACHE_DURATION) {
        return this.stockCache.alerts;
      }

      const products = await this.getStockProducts(forceRefresh);
      const alerts: StockAlert[] = [];

      products.forEach(product => {
        const minStock = parseInt(product.min_stock || '0') || 5;
        
        // Out of stock alerts
        if (product.quantity === 0) {
          alerts.push({
            productId: product.id,
            productName: product.name,
            currentStock: product.quantity,
            minStock,
            alertType: 'out_of_stock',
            urgency: 'high'
          });
        } 
        // Low stock alerts
        else if (product.quantity <= minStock) {
          alerts.push({
            productId: product.id,
            productName: product.name,
            currentStock: product.quantity,
            minStock,
            alertType: 'low_stock',
            urgency: product.quantity === 1 ? 'high' : 'medium'
          });
        }

        // Expiry alerts
        if (product.expiration_date) {
          const daysUntilExpiry = this.getDaysUntilExpiry(product.expiration_date);
          if (daysUntilExpiry <= 30) {
            alerts.push({
              productId: product.id,
              productName: product.name,
              currentStock: product.quantity,
              minStock,
              alertType: 'expiring_soon',
              urgency: daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 14 ? 'medium' : 'low'
            });
          }
        }
      });

      // Sort by urgency (high first)
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      alerts.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

      // Update cache
      this.stockCache.alerts = alerts;
      
      return alerts;
    }, 'Failed to generate stock alerts');
  }

  /**
   * Get stock levels for all products
   */
  async getStockLevels(): Promise<StockLevel[]> {
    return withErrorHandling(async () => {
      const products = await this.getStockProducts();
      
      return products.map(product => ({
        productId: product.id,
        productName: product.name,
        currentStock: product.quantity,
        minStock: parseInt(product.min_stock || '0') || 5,
        status: this.getStockStatus(product.quantity, parseInt(product.min_stock || '0')),
        lastUpdated: new Date().toISOString()
      }));
    }, 'Failed to fetch stock levels');
  }

  // ===== STOCK MANAGEMENT OPERATIONS =====

  /**
   * Restock product - matches your backend API exactly
   */
  async restockProduct(restockData: RestockRequest): Promise<any> {
    return withErrorHandling(async () => {
      console.log('🔄 Restocking product via stock service:', restockData);

      const response = await fetch(`${this.baseURL}/product/restock`, {
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
      
      // Clear cache to force refresh
      this.clearCache();
      
      console.log('✅ Product restocked successfully via stock service');
      return result;
    }, 'Failed to restock product');
  }

  /**
   * Update product stock - matches your backend API
   */
  async updateProductStock(productData: any): Promise<{ success: boolean; productId: number }> {
    return withErrorHandling(async () => {
      console.log('🔄 Updating product stock via stock service:', { 
        id: productData.id, 
        name: productData.name,
        quantity: productData.quantity 
      });

      const response = await fetch(`${this.baseURL}/product`, {
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
      
      // Update cache if exists
      if (this.stockCache.products) {
        this.stockCache.products = this.stockCache.products.map(p => 
          p.id === productData.id ? { ...p, ...productData } : p
        );
      }
      
      console.log('✅ Product stock updated successfully via service');
      return result;
    }, 'Failed to update product stock');
  }

  /**
   * Create new product - matches your backend API
   */
  async createProduct(productData: Partial<StockProduct>): Promise<{ success: boolean; productId: number }> {
    return withErrorHandling(async () => {
      console.log('🔄 Creating new product via stock service:', productData);

      const response = await fetch(`${this.baseURL}/product`, {
        method: 'POST',
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
      
      // Clear cache to force refresh
      this.clearCache();
      
      return result;
    }, 'Failed to create product');
  }

  /**
   * Delete product
   */
  async deleteProduct(productId: number): Promise<{ success: boolean }> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/product/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Remove from cache
      if (this.stockCache.products) {
        this.stockCache.products = this.stockCache.products.filter(p => p.id !== productId);
      }
      
      return { success: true };
    }, 'Failed to delete product');
  }

  // ===== SEARCH & FILTER OPERATIONS =====

  /**
   * Search products - matches your backend search API
   */
  async searchProducts(query: string): Promise<ProductSearchResult> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/products/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const products = await response.json();
      
      return {
        products,
        total: products.length,
        hasMore: false
      };
    }, 'Failed to search products');
  }

  /**
   * SKU/barcode lookup - matches your backend API
   */
  async lookupBySKU(skuCode: string): Promise<StockProduct | null> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/product/sku`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skuCode }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    }, 'Failed to lookup product by SKU');
  }

  // ===== INVENTORY CONTROL OPERATIONS =====

  /**
   * Decrement inventory for sales - matches your backend pattern
   */
  async decrementInventory(products: { id: string; quantity: string }[]): Promise<void> {
    return withErrorHandling(async () => {
      // This matches your router.decrementInventory pattern
      for (const p of products) {
        try {
          const product = await this.getStockProduct(parseInt(p.id));
          if (!product || !product.quantity) continue;
          
          const newQty = parseInt(String(product.quantity)) - parseInt(p.quantity);
          await this.updateProductStock({
            id: parseInt(p.id),
            quantity: newQty
          });
        } catch (err) {
          console.error('Decrement error for product:', p.id, err);
        }
      }
      
      // Clear cache to force refresh
      this.clearCache();
    }, 'Failed to decrement inventory');
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold?: number): Promise<StockProduct[]> {
    const allProducts = await this.getStockProducts();
    const minStockThreshold = threshold || 5;
    
    return allProducts.filter(product => {
      const minStockValue = product.min_stock ? this.safeParseNumber(product.min_stock) : minStockThreshold;
      return product.quantity <= minStockValue && product.quantity > 0;
    });
  }

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts(): Promise<StockProduct[]> {
    const allProducts = await this.getStockProducts();
    return allProducts.filter(product => product.quantity === 0);
  }

  /**
   * Get expiring soon products
   */
  async getExpiringSoonProducts(days = 30): Promise<StockProduct[]> {
    const allProducts = await this.getStockProducts();
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + days);
    
    return allProducts.filter(product => {
      if (!product.expiration_date) return false;
      const expDate = new Date(product.expiration_date);
      return expDate > today && expDate <= thresholdDate;
    });
  }

  /**
   * Get expired products
   */
  async getExpiredProducts(): Promise<StockProduct[]> {
    const allProducts = await this.getStockProducts();
    const today = new Date();
    
    return allProducts.filter(product => {
      if (!product.expiration_date) return false;
      const expDate = new Date(product.expiration_date);
      return expDate < today;
    });
  }

  // ===== HELPER METHODS =====

  /**
   * Get stock status
   */
  private getStockStatus(currentStock: number, minStock: number): 'out' | 'low' | 'adequate' {
    if (currentStock === 0) return 'out';
    if (currentStock <= minStock) return 'low';
    return 'adequate';
  }

  /**
   * Calculate days until expiry
   */
  private getDaysUntilExpiry(expirationDate: string): number {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Safe number parsing
   */
  private safeParseNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    
    const num = parseFloat(value.toString().replace(/,/g, '').trim());
    return isNaN(num) ? 0 : num;
  }

  /**
   * Transform frontend product to backend format
   */
  transformToBackendFormat(productData: any): any {
    return {
      id: productData.id,
      name: productData.name,
      barcode: productData.barcode,
      price: productData.price,
      quantity: productData.quantity,
      category: productData.category,
      expiration_date: productData.expirationDate || productData.expiration_date,
      min_stock: productData.minStock || productData.min_stock,
      description: productData.description,
      img: productData.img,
      cost_price: productData.costPrice || productData.cost_price,
      supplier: productData.supplier,
      supplier_id: productData.supplierId || productData.supplier_id,
      primary_supplier_id: productData.primarySupplierId || productData.primary_supplier_id,
      manufacturer: productData.manufacturer,
      batch_number: productData.batchNumber || productData.batch_number,
      drug_class: productData.drugClass || productData.drug_class,
      dosage_form: productData.dosageForm || productData.dosage_form,
      strength: productData.strength,
      active_ingredients: productData.activeIngredients || productData.active_ingredients,
      side_effects: productData.sideEffects || productData.side_effects,
      storage_conditions: productData.storageConditions || productData.storage_conditions,
      reorder_level: productData.reorderLevel || productData.reorder_level,
      sales_count: productData.salesCount || productData.sales_count,
      prescription_required: productData.prescriptionRequired,
      is_controlled_substance: productData.isControlledSubstance,
      requires_refrigeration: productData.requiresRefrigeration,
      wholesale_price: productData.wholesalePrice || productData.wholesale_price,
      last_price_update: productData.lastPriceUpdate || productData.last_price_update,
      profit_amount: productData.profitAmount || productData.profit_amount,
      profit_margin: productData.profitMargin || productData.profit_margin,
      last_restocked: productData.lastRestocked || productData.last_restocked
    };
  }

  /**
   * Transform backend product to frontend format
   */
  transformToFrontendFormat(backendProduct: any): StockProduct {
    return {
      id: backendProduct.id,
      barcode: backendProduct.barcode,
      expiration_date: backendProduct.expiration_date,
      price: backendProduct.price,
      category: backendProduct.category,
      category_id: backendProduct.category_id,
      quantity: backendProduct.quantity,
      name: backendProduct.name,
      stock: backendProduct.stock,
      min_stock: backendProduct.min_stock,
      img: backendProduct.img,
      description: backendProduct.description,
      cost_price: backendProduct.cost_price,
      supplier: backendProduct.supplier,
      last_restocked: backendProduct.last_restocked,
      reorder_level: backendProduct.reorder_level,
      profit_margin: backendProduct.profit_margin,
      batch_number: backendProduct.batch_number,
      manufacturer: backendProduct.manufacturer,
      drug_class: backendProduct.drug_class,
      prescription_required: backendProduct.prescription_required,
      side_effects: backendProduct.side_effects,
      storage_conditions: backendProduct.storage_conditions,
      active_ingredients: backendProduct.active_ingredients,
      dosage_form: backendProduct.dosage_form,
      strength: backendProduct.strength,
      package_size: backendProduct.package_size,
      is_controlled_substance: backendProduct.is_controlled_substance,
      requires_refrigeration: backendProduct.requires_refrigeration,
      wholesale_price: backendProduct.wholesale_price,
      last_price_update: backendProduct.last_price_update,
      sales_count: backendProduct.sales_count,
      profit_amount: backendProduct.profit_amount,
      supplier_id: backendProduct.supplier_id,
      primary_supplier_id: backendProduct.primary_supplier_id
    };
  }

  // ===== CACHE MANAGEMENT =====

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.stockCache = {
      products: null,
      stats: null,
      alerts: null,
      lastUpdated: null
    };
    console.log('🗑️ Stock cache cleared');
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { 
    hasProducts: boolean; 
    hasStats: boolean; 
    hasAlerts: boolean; 
    age: number | null 
  } {
    return {
      hasProducts: this.stockCache.products !== null,
      hasStats: this.stockCache.stats !== null,
      hasAlerts: this.stockCache.alerts !== null,
      age: this.stockCache.lastUpdated ? Date.now() - this.stockCache.lastUpdated : null
    };
  }

  /**
   * Preload cache in background
   */
  async preloadCache(): Promise<void> {
    try {
      console.log('🚀 Preloading stock cache...');
      await Promise.allSettled([
        this.getStockProducts(),
        this.getStockStats(),
        this.getStockAlerts()
      ]);
      console.log('✅ Stock cache preloaded');
    } catch (error) {
      console.error('Failed to preload stock cache:', error);
    }
  }
}

// Create and export singleton instance
export const stockService = new StockService();
export default stockService;