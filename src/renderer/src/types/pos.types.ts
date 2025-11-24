// src/renderer/src/components/pos/types/pos.types.ts

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;  
  barcode: number;
  expirationDate: string;
  price: string;
  category: string;
  quantity: number;
  name: string;
  stock: number;
  minStock: string;
  img: string;
  description?: string;
  costPrice?: string;
  taxRate?: string;
  supplier?: string;
  lastRestocked?: string;
  reorderLevel?: number;
  profitMargin?: string;
  
  salesCount?: number;
  manufacturer?: string;
  batchNumber?: string;
  drugClass?: string;
  dosageForm?: string;
  strength?: string;
  activeIngredients?: string;
  storageConditions?: string;
  sideEffects?: string;
  prescriptionRequired?: boolean;
  isControlledSubstance?: boolean;
  requiresRefrigeration?: boolean;
  wholesalePrice?: string;
  lastPriceUpdate?: string;
  profitAmount?: string;
  packageSize?: string;
  primarySupplierId?: number;

  suppliers?: Array<{
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
  }>;
}

export interface CartItem {
  id: number;
  product_name: string;
  price: number; // CHANGED: from string to number
  quantity: number;
  barcode: number;
  quantityInStock: number; // FIXED: spelling
  category: string;
  img?: string;
  description?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string; // CHANGED: made optional
  email?: string; // CHANGED: made optional
  address?: string; // CHANGED: made optional
  store?: string; // CHANGED: made optional
  loyaltyPoints?: number;
  loyalty_points?: number;
}

// ENHANCED: Updated PaymentData with data refresh support
export interface PaymentData {
  success: boolean;
  method: 'cash' | 'card' | 'mobile' | 'credit';
  amount: number;
  change?: number;
  reference?: string;
  transactionId: string | number;
  orderNumber?: string;
  clearCart?: boolean;
  dataRefreshed?: boolean;
  message?: string;
}

// ENHANCED: Updated PosCartProps with print support
export interface PosCartProps {
  cart: CartItem[];
  customers: Customer[];
  selectedCustomer: string;
  discount: number;
  isDiscountPercentage: boolean;
  taxRate: number;
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  tax: number;
  grossPrice: number;
  selectedCust?: Customer;
  products: Product[];
  user?: {
    fullname: string;
    username?: string;
    role?: string;
  };
  onCustomerChange: (customerId: string) => void;
  onOpenNewCustomer: () => void;
  onRemoveItem: (id: number) => void;
  onQuantityChange: (id: number, quantity: number) => void;
  onDiscountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleDiscountType: () => void;
  onCancel: () => void;
  onHoldOrder: () => void; // CHANGED: simple callback
  onOpenPayment: () => void;
  onPrint?: () => void;
  onPaymentComplete?: (paymentData: PaymentData) => void;
}

export interface CartItemRowProps {
  item: CartItem;
  index: number;
  onRemove: (id: number) => void;
  onQuantityChange: (id: number, quantity: number) => void;
}

export interface CartTotalsProps {
  totalItems: number;
  subtotal: number;
  discount: number;
  discountAmount: number;
  isDiscountPercentage: boolean;
  tax: number;
  grossPrice: number;
  selectedCust?: Customer;
  taxRate: number;
  onDiscountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleDiscountType: () => void;
}

export interface CartActionsProps {
  cartLength: number;
  grossPrice: number;
  products: Product[];
  onCancel: () => void;
  onHoldOrder: () => void; // CHANGED: simple callback
  onOpenHoldOrders: () => void;
  onOpenPayment: () => void;
  onPrint?: () => void;
  onPaymentComplete?: (paymentData: PaymentData) => void;
  selectedCustomer?: Customer; // ADDED: for hold order validation
  currentCart?: any; // ADDED: for hold order data
}

export interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded: (customer: Customer) => void;
}

export interface ProductFiltersState {
  category: string;
  stockStatus: string;
  priceRange: string;
  sortBy: string;
  lowStockOnly: boolean;
  expiredOnly: boolean;
}

export interface ProductFiltersProps {
  filters: ProductFiltersState;
  onFiltersChange: (filters: ProductFiltersState) => void;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
}

export interface ProductDetailsOverlayProps {
  product: Product | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
}

export interface PosSearchProps {
  searchQuery: string;
  barcodeInput: string;
  selectedCategory: string;
  viewMode: 'grid' | 'list';
  categories: Category[];
  scanning: boolean;
  onSearchChange: (query: string) => void;
  onBarcodeChange: (barcode: string) => void;
  onCategoryChange: (category: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onBarcodeSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
}

export interface PosProductsProps {
  products: Product[];
  loading: boolean;
  viewMode: 'grid' | 'list';
  categories: Category[];
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  isLowStock: (product: Product) => boolean;
}

export interface ReceiptData {
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
  timestamp?: string;
  orderNumber?: string;
}

export interface HoldOrder {
  id: string;
  orderId: string;
  items: CartItem[];
  customer?: Customer;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  createdAt: string;
  createdBy: string;
  note?: string;
}

export interface HoldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreOrder: (order: HoldOrder) => void;
  onDeleteOrder: (orderId: string) => void;
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  cart: CartItem[];
  customer?: Customer;
  discount: number;
  tax: number;
  subtotal: number;
  onPaymentComplete: (paymentData: PaymentData) => void;
}

export interface HoldOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentCart: {
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    discount: number;
    customer?: Customer;
  };
  onHoldOrder: (refNumber: string, cartData: any) => Promise<boolean>;
}

export interface RefreshIndicatorProps {
  lastUpdated?: number;
  onRefresh?: () => void;
}

export interface VirtualizedProductsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  isLowStock: (product: Product) => boolean;
  loading?: boolean;
}

export interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  isLowStock: boolean;
  getCategoryName: (categoryId: string) => string;
  index: number;
}

export interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => Promise<void>;
  onRestock: (restockData: {
    productId: number;
    quantity: number;
    costPrice: string;
    supplierId: number;
    batchNumber?: string;
  }) => Promise<void>;
  mode: 'view' | 'edit';
  loading: boolean;
}

// ENHANCED: GlobalPosState with refresh methods
export interface GlobalPosState {
  // Data
  products: Product[];
  customers: Customer[];
  categories: Category[];
  
  // Loading states
  loading: {
    products: boolean;
    customers: boolean;
    categories: boolean;
  };
  
  // Error states
  errors: {
    products: string | null;
    customers: string | null;
    categories: string | null;
  };
  
  // Last fetch timestamps
  lastFetched: {
    products: number | null;
    customers: number | null;
    categories: number | null;
  };

  // Customer synchronization
  lastCustomerUpdate: number | null;
  
  // Actions
  setProducts: (products: Product[]) => void;
  setCustomers: (customers: Customer[]) => void;
  setCategories: (categories: Category[]) => void;
  setLoading: (key: keyof GlobalPosState['loading'], loading: boolean) => void;
  setError: (key: keyof GlobalPosState['errors'], error: string | null) => void;
  updateLastFetched: (key: keyof GlobalPosState['lastFetched']) => void;
  clearData: () => void;
  
  // Customer synchronization actions
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  removeCustomer: (customerId: number) => void;
  refreshCustomers: () => Promise<void>;
  syncCustomers: () => Promise<void>;
  getCustomerById: (customerId: number) => Customer | undefined;
  
  // NEW: Data refresh actions
  refreshProducts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  
  // Helper function to get consistent product ID
  getProductId: (product: Product) => number;
}

export interface PosStoreState {
  // State
  cart: CartItem[];
  discount: number;
  isDiscountPercentage: boolean;
  searchQuery: string;
  barcodeInput: string;
  selectedCategory: string;
  selectedCustomer: string;
  customers: Customer[];
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string | null;
  scanning: boolean;
  taxRate: number;

  // Basic setters
  setSearchQuery: (query: string) => void;
  setBarcodeInput: (input: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedCustomer: (customerId: string) => void;
  setDiscount: (discount: number) => void;
  setIsDiscountPercentage: (isPercentage: boolean) => void;
  setCart: (cart: CartItem[]) => void;
  setScanning: (scanning: boolean) => void;
  setError: (error: string | null) => void;
  setCustomers: (customers: Customer[]) => void;
  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;

  // Cart Operations
  handleAddToCart: (product: Product) => Promise<void>;
  handleRemoveItem: (id: number) => void;
  handleQuantityChange: (id: number, quantity: number) => void;
  clearCart: () => void;
  handlePaymentComplete: () => void;

  // UI Operations
  handleBarcodeSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleDiscountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleDiscountType: () => void;
  handleCancel: () => void;
  handlePrint: () => void;
  isLowStock: (product: Product) => boolean;

  // API Operations
  fetchProducts: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchCategories: () => Promise<void>;

  // NEW: Data refresh operations
  refreshProductsData: () => Promise<void>;
  refreshAllData: () => Promise<void>;

  // Customer Operations
  createNewCustomer: (customerData: any) => Promise<Customer>;
  searchCustomersByQuery: (query: string) => Promise<Customer[]>;
  updateCustomerLoyalty: (customerId: number, points: number) => Promise<void>;

  // Helper
  getProductId: (product: Product) => number;
}

export interface TransactionData {
  customer_id: string | number;
  customer_name: string;
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  change_amount: number;
  payment_type: string;
  payment_info: string;
  till: number;
  user_id: string | number;
  user_name: string;
  items: Array<{
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    category: string;
  }>;
}

export interface TransactionResponse {
  success: boolean;
  id: number;
  order_number?: string;
  message?: string;
  error?: string;
}

export interface ReceiptProps {
  transactionId: string | number;
  orderNumber?: string;
  items: Array<{
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    category: string;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: string;
  customer?: {
    name: string;
    phone?: string;
    email?: string;
  };
  user: {
    name: string;
  };
  timestamp: string;
  onClose: () => void;
  showActions?: boolean;
}

export interface ReceiptRef {
  handlePrint: () => void;
}

export interface PaymentProcessingState {
  isProcessing: boolean;
  paymentSuccess: boolean;
  transactionId: number | null;
  showReceipt: boolean;
  receiptData: ReceiptData | null;
}

export interface CustomerSearchState {
  searchQuery: string;
  searchResults: Customer[];
  isSearching: boolean;
  showSearchResults: boolean;
}

export interface ModalStates {
  isNewCustomerOpen: boolean;
  isHoldOrdersModalOpen: boolean;
  isHoldFormOpen: boolean;
  isPaymentModalOpen: boolean;
}

export interface NetworkSettings {
  mode: 'standalone' | 'terminal' | 'server';
  serverIp: string;
  tillNumber: string;
  terminalId: string;
  port: number;
}

export type ViewMode = 'grid' | 'list';
export type StockStatus = 'all' | 'in-stock' | 'out-of-stock' | 'low-stock';
export type SortBy = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc' | 'expiry-asc' | 'expiry-desc' | 'barcode-asc';
export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'credit';