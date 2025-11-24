// src/renderer/src/types/suppliers.types.ts
export interface SuppliesProduct {
  id: number;
  name: string;
  description?: string;
  category?: string;
  barcode?: number;
  // Current suppliers with their latest prices
  suppliers: {
    name: string;
    currentPrice: number;
    lastOrderDate: string;
    isActive: boolean;
  }[];
  // Complete price history for all suppliers
  priceHistory: SupplierPrice[];
  // Additional metadata
  createdAt: string;
  updatedAt: string;
  minQuantity?: number;
  preferredSupplier?: string;
}

// Price history record for tracking price changes over time
export interface SupplierPrice {
  supplierName: string;
  price: number;
  date: string; // ISO date string
  quantity: number; // Quantity supplied at this price
  batchNumber?: string;
}

export interface SupplierWithPrice {
  name: string;
  currentPrice: number;
  lastOrderDate: string;
  isActive: boolean;
}

export interface PriceHistoryResponse {
  productId: string;
  productName: string;
  priceHistory: SupplierPrice[];
  currentSuppliers: SupplierWithPrice[];
}

export interface SupplierComparison {
  productId: string;
  productName: string;
  comparison: Array<{
    supplierName: string;
    currentPrice: number;
    lastOrderDate: string;
    priceTrend: number;
    totalOrders: number;
    isActive: boolean;
  }>;
  bestPrice: {
    supplierName: string;
    currentPrice: number;
    lastOrderDate: string;
  };
}

export interface SuppliesAnalytics {
  totalProducts: number;
  totalSuppliers: number;
  avgSuppliersPerProduct: number;
  totalPriceRecords: number;
  priceChangesLast30Days: number;
  bestPricedProducts: Array<{
    productId: string;
    productName: string;
    bestPrice: number;
    supplierName: string;
  }>;
}

export interface SupplierPerformance {
  supplierName: string;
  totalProducts: number;
  totalOrders: number;
  averagePrice: number;
  priceCompetitiveness: number;
  lastActivity: string;
  performanceScore: number;
}

export interface CreateSuppliesProductData {
  name: string;
  description?: string;
  category?: string;
  barcode?: number;
  minQuantity?: number;
  preferredSupplier?: string;
}

export interface UpdateSuppliesProductData {
  name?: string;
  description?: string;
  category?: string;
  barcode?: number;
  minQuantity?: number;
  preferredSupplier?: string;
}

export interface AddSupplierPriceData {
  supplierName: string;
  price: number;
  quantity: number;
  batchNumber?: string;
}

// Keep your existing supplier types for backward compatibility
export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  productsSupplied: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ProductSearchResult {
  id: number;
  name: string;
  barcode: number;
  price: string;
  costPrice?: string;
  quantity: number;
  category: string;
}

export interface SupplierProduct {
  product: ProductSearchResult;
  supplierPrice: string;
  updateInventory: boolean;
}

export interface PriceTrend {
  productId: string;
  prices: Array<{
    costPrice: string;
    date: string;
    isCurrent: boolean;
  }>;
  changes: number;
  lastPrice: string;
  firstPrice: string;
  priceChange: number;
  percentChange: number;
}

export interface SupplierTrendsResponse {
  supplierId: string;
  periodDays: number;
  trends: PriceTrend[];
  summary: {
    totalProducts: number;
    totalPriceChanges: number;
    productsWithIncreases: number;
    productsWithDecreases: number;
  };
}

export interface BestPricesResponse {
  bestPrices: SupplierPrice[];
  totalProducts: number;
  averageBestPrice: string;
}

export interface CreateSupplierData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  productsSupplied: string[];
}

export interface UpdateSupplierData {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  productsSupplied?: string[];
  isActive?: boolean;
}