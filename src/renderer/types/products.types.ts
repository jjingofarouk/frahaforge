// src/renderer/src/types/products.types.ts
export interface Category {
  id: number;
  name: string;
  created_at?: string;
}

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

  // === CRITICAL: camelCase for frontend ===
  costPrice?: string | number;  // <-- Now matches DB alias
  taxRate?: string;
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

  // Multi-supplier
  primarySupplierId?: number;
  suppliers?: ProductSupplier[];

  // Backward compat
  supplier?: string;
}

export interface PosProduct extends Product {}
export interface ProductWithAvailability extends Product {
  available: number;
}

export interface ProductFilters {
  category: string;
  stockStatus: string;
  priceRange: string;
  sortBy: string;
  lowStockOnly: boolean;
  expiredOnly: boolean;
  prescriptionOnly: boolean;
  controlledSubstances: boolean;
  requiresRefrigeration: boolean;
  searchTerm: string;
}

export interface ProductStats {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  totalInventoryValue: number;
  totalCostValue: number;
  totalPotentialProfit: number;
  prescriptionProducts: number;
  controlledSubstances: number;
  productsWithCostPrice: number;
}

export interface ProductSupplier {
  supplierId: number;
  supplierName: string;
  costPrice: string;
  isCurrent: boolean;
  lastUpdated: string;
  notes?: string;
  minimumOrderQuantity?: number;
  deliveryLeadTime?: number;
  reliabilityScore?: number;
  batchNumber?: string;
  lastDeliveryDate?: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  paymentTerms?: string;
  rating?: number;
  productsSupplied: number[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  totalProducts?: number;
  averagePriceCompetitiveness?: number;
  onTimeDeliveryRate?: number;
  lastOrderDate?: string;
  licenseNumber?: string;
  specialization?: string[];
  deliveryAreas?: string[];
  creditLimit?: number;
  currentBalance?: number;
}