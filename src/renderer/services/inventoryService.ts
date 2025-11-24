// src/renderer/src/services/inventoryService.ts
import { withErrorHandling } from './api';

// Interfaces matching the database schema from inventory.ts
export interface Product {
  id: number;
  barcode: number | null;
  expirationDate: string | null;
  price: string | number | null;
  category: string;
  category_id?: number;
  quantity: number;
  name: string;
  stock: number;
  minStock: string | null;
  img: string | null;
  description?: string;
  costPrice?: string | number;
  supplier?: string;
  lastRestocked?: string;
  reorderLevel?: number;
  profitMargin?: string;
  batchNumber?: string;
  manufacturer?: string;
  drugClass?: string;
  prescriptionRequired?: boolean;
  sideEffects?: string;
  storageConditions?: string;
  activeIngredients?: string;
  dosageForm?: string;
  strength?: string;
  packageSize?: string;
  isControlledSubstance?: boolean;
  requiresRefrigeration?: boolean;
  wholesalePrice?: string;
  lastPriceUpdate?: string;
  salesCount?: number;
  profitAmount?: string;
  primarySupplierId?: number;
  suppliers?: any[];
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

export interface TransactionProduct {
  id: string;
  quantity: string;
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  hasMore: boolean;
}

export interface StockChange {
  changed: boolean;
  increased: boolean;
  decreased: boolean;
  difference: number;
  recorded: boolean;
  previousQuantity: number;
  newQuantity: number;
}

export interface CriticalProductData {
  basicProducts: Product[];
  lowStockCount: number;
  outOfStockCount: number;
  totalProducts: number;
}

class InventoryService {
  private baseURL: string;
  private productsCache: Product[] | null = null;
  private cacheTimestamp: number | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor() {
    this.baseURL = 'http://192.168.1.3:3000/api/inventory';
    console.log('🚀 InventoryService using:', this.baseURL);
  }

  // ===== CORE PRODUCT OPERATIONS =====

  /**
   * Get all products with caching
   */
  async getProducts(forceRefresh = false): Promise<Product[]> {
    return withErrorHandling(async () => {
      // Return cached data if available and not expired
      if (!forceRefresh && this.productsCache && this.cacheTimestamp && 
          Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
        console.log('📦 Returning cached products');
        return this.productsCache;
      }

      console.log('🔄 Fetching products from API...');
      const response = await fetch(`${this.baseURL}/products`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const backendProducts = await response.json();
      
      // Transform backend data to match frontend interface
      const products = backendProducts.map(this.transformBackendProduct);
      
      // Update cache
      this.productsCache = products;
      this.cacheTimestamp = Date.now();
      
      console.log(`✅ Loaded ${products.length} products from API`);
      return products;
    }, 'Failed to fetch products');
  }

  /**
   * Force refresh products (bypass cache)
   */
  async forceRefresh(): Promise<Product[]> {
    return this.getProducts(true);
  }

  /**
   * Get critical product data for immediate display
   */
  async getCriticalProductData(): Promise<CriticalProductData> {
    return withErrorHandling(async () => {
      console.log('🚀 Loading critical product data for immediate display...');
      
      try {
        // Try to get full products first (they might be cached)
        const products = await this.getProducts();
        
        // Calculate critical counts
        const lowStockCount = products.filter(p => {
          const minStockValue = p.minStock ? this.safeParseNumber(p.minStock) : 10;
          return p.quantity <= minStockValue && p.quantity > 0;
        }).length;
        
        const outOfStockCount = products.filter(p => p.quantity === 0).length;

        console.log(`✅ Critical data loaded: ${products.length} products`);
        
        return {
          basicProducts: products,
          lowStockCount,
          outOfStockCount,
          totalProducts: products.length
        };
      } catch (error) {
        console.error('Failed to load critical data:', error);
        throw error;
      }
    }, 'Failed to fetch critical product data');
  }

  /**
   * Get single product by ID - with cache fallback
   */
  async getProduct(productId: number): Promise<Product> {
    return withErrorHandling(async () => {
      // Try cache first
      if (this.productsCache) {
        const cachedProduct = this.productsCache.find(p => p.id === productId);
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

      const backendProduct = await response.json();
      return this.transformBackendProduct(backendProduct);
    }, 'Failed to fetch product');
  }

  /**
   * Create a new product
   */
  async createProduct(productData: Partial<Product>): Promise<{ success: boolean; productId: number }> {
    return withErrorHandling(async () => {
      // Transform frontend data to backend format
      const backendData = this.transformToBackendFormat(productData);
      
      const response = await fetch(`${this.baseURL}/product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Clear cache to force refresh on next load
      this.clearCache();
      
      return result;
    }, 'Failed to create product');
  }

  /**
   * Update product - replaces direct axios calls in ProductsPage
   */
  async updateProduct(productData: any): Promise<{ success: boolean; productId: number }> {
    return withErrorHandling(async () => {
      console.log('🔄 Updating product via inventory service:', { id: productData.id, name: productData.name });

      // Transform frontend data to backend format
      const backendData = this.transformToBackendFormat(productData);

      const response = await fetch(`${this.baseURL}/product`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update cache if exists
      if (this.productsCache) {
        const updatedProduct = this.transformBackendProduct(backendData);
        this.productsCache = this.productsCache.map(p => 
          p.id === productData.id ? { ...p, ...updatedProduct } : p
        );
      }
      
      console.log('✅ Product updated successfully via service');
      return result;
    }, 'Failed to update product');
  }

  /**
   * Update product with automatic restock history tracking for stock increases
   */
  async updateProductWithStockTracking(productData: any): Promise<{ 
    success: boolean; 
    productId: number;
    stockChange?: StockChange;
  }> {
    return withErrorHandling(async () => {
      console.log('🔄 Updating product with stock tracking:', { 
        id: productData.id, 
        name: productData.name,
        quantity: productData.quantity 
      });

      // Get current product data to compare quantities
      const currentProduct = await this.getProduct(productData.id);
      const previousQuantity = currentProduct.quantity || 0;
      const newQuantity = productData.quantity || previousQuantity;
      
      // Check if stock increased
      const quantityIncreased = newQuantity > previousQuantity;
      const quantityAdded = quantityIncreased ? newQuantity - previousQuantity : 0;

      // Transform and send update
      const backendData = this.transformToBackendFormat(productData);
      
      const response = await fetch(`${this.baseURL}/product`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      let recorded = false;
      
      // If stock increased, create a restock history record
      if (quantityIncreased && quantityAdded > 0) {
        try {
          await this.recordStockAdjustment({
            productId: productData.id,
            productName: productData.name,
            quantity: quantityAdded,
            costPrice: productData.costPrice?.toString() || currentProduct.costPrice?.toString() || '0',
            supplierId: productData.primarySupplierId || currentProduct.primarySupplierId || 0,
            batchNumber: productData.batchNumber || currentProduct.batchNumber || `STOCK-ADJUST-${Date.now()}`,
            reason: 'Manual stock adjustment'
          });
          recorded = true;
          console.log(`📦 Auto-recorded stock increase: +${quantityAdded} units for product ${productData.name}`);
        } catch (historyError) {
          console.error('Failed to record restock history for stock adjustment:', historyError);
          // Don't fail the main update if history recording fails
        }
      }

      // Update cache
      if (this.productsCache) {
        const updatedProduct = this.transformBackendProduct(backendData);
        this.productsCache = this.productsCache.map(p => 
          p.id === productData.id ? { ...p, ...updatedProduct } : p
        );
      }
      
      console.log('✅ Product updated successfully with stock tracking');
      
      return {
        ...result,
        stockChange: {
          changed: quantityAdded !== 0,
          increased: quantityIncreased,
          decreased: false,
          difference: quantityAdded,
          recorded,
          previousQuantity,
          newQuantity
        }
      };
    }, 'Failed to update product with stock tracking');
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
      if (this.productsCache) {
        this.productsCache = this.productsCache.filter(p => p.id !== productId);
      }
      
      return { success: true };
    }, 'Failed to delete product');
  }

  // ===== RESTOCK OPERATIONS =====

  /**
   * Restock product with supplier integration
   */
  async restockProduct(restockData: RestockRequest): Promise<any> {
    return withErrorHandling(async () => {
      console.log('🔄 Restocking product via inventory service:', restockData);

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
      
      console.log('✅ Product restocked successfully via service');
      return result;
    }, 'Failed to restock product');
  }

  /**
   * Record stock adjustment in restock history
   */
  private async recordStockAdjustment(adjustmentData: {
    productId: number;
    productName: string;
    quantity: number;
    costPrice: string;
    supplierId: number;
    batchNumber?: string;
    reason?: string;
  }): Promise<void> {
    return withErrorHandling(async () => {
      // Use the restock endpoint to record the adjustment
      const restockData = {
        productId: adjustmentData.productId,
        quantity: adjustmentData.quantity,
        costPrice: adjustmentData.costPrice,
        supplierId: adjustmentData.supplierId,
        batchNumber: adjustmentData.batchNumber || `ADJUST-${Date.now()}`
      };

      await this.restockProduct(restockData);
    }, 'Failed to record stock adjustment');
  }

  /**
   * Get restock history for a product
   */
  async getRestockHistory(productId?: number): Promise<RestockHistory[]> {
    return withErrorHandling(async () => {
      const url = productId 
        ? `${this.baseURL}/restock-history?productId=${productId}`
        : `${this.baseURL}/restock-history`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    }, 'Failed to fetch restock history');
  }

  /**
   * Get stock adjustment history
   */
  async getStockAdjustmentHistory(productId?: number): Promise<RestockHistory[]> {
    return withErrorHandling(async () => {
      const history = await this.getRestockHistory(productId);
      
      // Filter for stock adjustments (batch numbers starting with ADJUST- or STOCK-ADJUST-)
      return history.filter(record => 
        record.batch_number?.includes('ADJUST-') || 
        record.batch_number?.includes('STOCK-ADJUST-')
      );
    }, 'Failed to fetch stock adjustment history');
  }

  // ===== SEARCH OPERATIONS =====

  /**
   * Search products
   */
  async searchProducts(query: string): Promise<ProductSearchResult> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/products/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const backendProducts = await response.json();
      const products = backendProducts.map(this.transformBackendProduct);
      
      return {
        products,
        total: products.length,
        hasMore: false
      };
    }, 'Failed to search products');
  }

  /**
   * SKU/barcode lookup
   */
  async lookupBySKU(skuCode: string): Promise<Product | null> {
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

      const backendProduct = await response.json();
      return this.transformBackendProduct(backendProduct);
    }, 'Failed to lookup product by SKU');
  }

  // ===== INVENTORY MANAGEMENT =====

  /**
   * Decrement inventory (for sales/transactions)
   */
  async decrementInventory(products: TransactionProduct[]): Promise<void> {
    return withErrorHandling(async () => {
      const response = await fetch(`${this.baseURL}/decrement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Clear cache to force refresh
      this.clearCache();
    }, 'Failed to decrement inventory');
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    const allProducts = await this.getProducts();
    const minStockThreshold = threshold || 10;
    
    return allProducts.filter(product => {
      const minStockValue = product.minStock ? this.safeParseNumber(product.minStock) : minStockThreshold;
      return product.quantity <= minStockValue && product.quantity > 0;
    });
  }

  /**
   * Get expired products
   */
  async getExpiredProducts(): Promise<Product[]> {
    const allProducts = await this.getProducts();
    const today = new Date();
    
    return allProducts.filter(product => {
      if (!product.expirationDate) return false;
      const expDate = new Date(product.expirationDate);
      return expDate < today;
    });
  }

  /**
   * Get expiring soon products
   */
  async getExpiringSoonProducts(days = 30): Promise<Product[]> {
    const allProducts = await this.getProducts();
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + days);
    
    return allProducts.filter(product => {
      if (!product.expirationDate) return false;
      const expDate = new Date(product.expirationDate);
      return expDate > today && expDate <= thresholdDate;
    });
  }

  // ===== DATA TRANSFORMATION METHODS =====

  /**
   * Transform backend product data to frontend format
   */
  private transformBackendProduct(backendProduct: any): Product {
    return {
      id: backendProduct.id,
      barcode: backendProduct.barcode,
      expirationDate: backendProduct.expiration_date || backendProduct.expirationDate,
      price: backendProduct.price,
      category: backendProduct.category,
      category_id: backendProduct.category_id,
      quantity: backendProduct.quantity,
      name: backendProduct.name,
      stock: backendProduct.stock,
      minStock: backendProduct.min_stock || backendProduct.minStock,
      img: backendProduct.img,
      description: backendProduct.description,
      costPrice: backendProduct.cost_price || backendProduct.costPrice,
      supplier: backendProduct.supplier,
      lastRestocked: backendProduct.last_restocked || backendProduct.lastRestocked,
      reorderLevel: backendProduct.reorder_level || backendProduct.reorderLevel,
      profitMargin: backendProduct.profit_margin || backendProduct.profitMargin,
      batchNumber: backendProduct.batch_number || backendProduct.batchNumber,
      manufacturer: backendProduct.manufacturer,
      drugClass: backendProduct.drug_class || backendProduct.drugClass,
      prescriptionRequired: backendProduct.prescription_required || backendProduct.prescriptionRequired,
      sideEffects: backendProduct.side_effects || backendProduct.sideEffects,
      storageConditions: backendProduct.storage_conditions || backendProduct.storageConditions,
      activeIngredients: backendProduct.active_ingredients || backendProduct.activeIngredients,
      dosageForm: backendProduct.dosage_form || backendProduct.dosageForm,
      strength: backendProduct.strength,
      packageSize: backendProduct.package_size || backendProduct.packageSize,
      isControlledSubstance: backendProduct.is_controlled_substance || backendProduct.isControlledSubstance,
      requiresRefrigeration: backendProduct.requires_refrigeration || backendProduct.requiresRefrigeration,
      wholesalePrice: backendProduct.wholesale_price || backendProduct.wholesalePrice,
      lastPriceUpdate: backendProduct.last_price_update || backendProduct.lastPriceUpdate,
      salesCount: backendProduct.sales_count || backendProduct.salesCount,
      profitAmount: backendProduct.profit_amount || backendProduct.profitAmount,
      primarySupplierId: backendProduct.primarySupplierId || backendProduct.primary_supplier_id,
      suppliers: backendProduct.suppliers
    };
  }

  /**
   * Transform frontend product data to backend format
   */
  private transformToBackendFormat(productData: any): any {
    return {
      id: productData.id,
      name: productData.name,
      barcode: productData.barcode,
      price: productData.price,
      quantity: productData.quantity,
      category: productData.category,
      expiration_date: productData.expirationDate,
      min_stock: productData.minStock,
      description: productData.description,
      img: productData.img,
      cost_price: productData.costPrice,
      supplier: productData.supplier,
      supplier_id: productData.supplierId,
      primary_supplier_id: productData.primarySupplierId,
      manufacturer: productData.manufacturer,
      batch_number: productData.batchNumber,
      drug_class: productData.drugClass,
      dosage_form: productData.dosageForm,
      strength: productData.strength,
      active_ingredients: productData.activeIngredients,
      side_effects: productData.sideEffects,
      storage_conditions: productData.storageConditions,
      reorder_level: productData.reorderLevel,
      sales_count: productData.salesCount,
      prescription_required: productData.prescriptionRequired,
      is_controlled_substance: productData.isControlledSubstance,
      requires_refrigeration: productData.requiresRefrigeration,
      wholesale_price: productData.wholesalePrice,
      last_price_update: productData.lastPriceUpdate,
      profit_amount: productData.profitAmount,
      profit_margin: productData.profitMargin,
      last_restocked: productData.lastRestocked,
      primarySupplierId: productData.primarySupplierId,
      suppliers: productData.suppliers
    };
  }

  /**
   * Safe number parsing for string or number values
   */
  private safeParseNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    
    const num = parseFloat(value.toString().replace(/,/g, '').trim());
    return isNaN(num) ? 0 : num;
  }

  // ===== STATISTICS AND ANALYTICS =====

  /**
   * Get inventory statistics
   */
  async getInventoryStats(): Promise<{
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiredCount: number;
    expiringSoonCount: number;
    totalInventoryValue: number;
  }> {
    const products = await this.getProducts();
    
    const lowStockCount = products.filter(p => {
      const minStockValue = p.minStock ? this.safeParseNumber(p.minStock) : 10;
      return p.quantity <= minStockValue && p.quantity > 0;
    }).length;
    
    const outOfStockCount = products.filter(p => p.quantity === 0).length;
    const expiredCount = (await this.getExpiredProducts()).length;
    const expiringSoonCount = (await this.getExpiringSoonProducts()).length;
    
    const totalInventoryValue = products.reduce((total, product) => {
      const cost = product.costPrice ? this.safeParseNumber(product.costPrice) : 0;
      return total + (cost * product.quantity);
    }, 0);

    return {
      totalProducts: products.length,
      lowStockCount,
      outOfStockCount,
      expiredCount,
      expiringSoonCount,
      totalInventoryValue
    };
  }

  // ===== BULK OPERATIONS =====

  /**
   * Update multiple products at once
   */
  async updateProductsBulk(products: Product[]): Promise<{ success: boolean; updated: number }> {
    return withErrorHandling(async () => {
      const backendData = products.map(product => this.transformToBackendFormat(product));
      
      const response = await fetch(`${this.baseURL}/products/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products: backendData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Clear cache to force refresh
      this.clearCache();
      
      return result;
    }, 'Failed to update products in bulk');
  }

  // ===== UTILITY METHODS =====

  /**
   * Validate product data
   */
  validateProduct(product: Partial<Product>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!product.name || product.name.trim().length === 0) {
      errors.push('Product name is required');
    }

    if (product.quantity === undefined || product.quantity < 0) {
      errors.push('Quantity must be a non-negative number');
    }

    if (product.price && this.safeParseNumber(product.price) < 0) {
      errors.push('Price must be a non-negative number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate next product ID (timestamp-based to match your backend pattern)
   */
  generateProductId(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Clear the products cache
   */
  clearCache(): void {
    this.productsCache = null;
    this.cacheTimestamp = null;
    console.log('🗑️ Products cache cleared');
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { hasCache: boolean; age: number | null } {
    return {
      hasCache: this.productsCache !== null,
      age: this.cacheTimestamp ? Date.now() - this.cacheTimestamp : null
    };
  }
}

// Create and export singleton instance
export const inventoryService = new InventoryService();
export default inventoryService;