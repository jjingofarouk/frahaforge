// src/renderer/src/components/pos/stores/posStore.ts
import { create } from 'zustand';
import { Product, Category, CartItem, Customer, PosStoreState } from '../types/pos.types';
import { customersService } from '../../services/customerService';
import { globalDataRefresh } from '../../components/pos/GlobalPosDataManager';

export const usePosStore = create<PosStoreState>((set, get) => ({
  // Initial state
  cart: [],
  discount: 0,
  isDiscountPercentage: false,
  searchQuery: '',
  barcodeInput: '',
  selectedCategory: 'all',
  selectedCustomer: '',
  customers: [],
  categories: [],
  products: [],
  loading: true,
  error: null,
  scanning: false,
  taxRate: 0,

  // Basic setters
  setSearchQuery: (query) => set({ searchQuery: query }),
  setBarcodeInput: (input) => set({ barcodeInput: input }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedCustomer: (customerId) => set({ selectedCustomer: customerId }),
  setDiscount: (discount) => set({ discount }),
  setIsDiscountPercentage: (isPercentage) => set({ isDiscountPercentage: isPercentage }),
  setCart: (cart) => set({ cart }),
  setScanning: (scanning) => set({ scanning }),
  setError: (error) => set({ error }),
  setCustomers: (customers) => set({ customers }),
  setProducts: (products) => set({ products }),
  setCategories: (categories) => set({ categories }),

  // Enhanced cart clearing with comprehensive reset
  clearCart: () => {
    console.log('🛒 POS Store: Clearing cart completely');
    set({
      cart: [],
      discount: 0,
      isDiscountPercentage: false,
      selectedCustomer: '',
      searchQuery: '',
      barcodeInput: '',
      error: null,
    });
  },

  // ENHANCED: Payment completion handler - clears cart and can trigger data refresh
  handlePaymentComplete: () => {
    console.log('✅ Payment completed, clearing cart...');
    const { clearCart } = get();
    clearCart();
    
    // Additional cleanup if needed
    setTimeout(() => {
      console.log('🔄 Cart state after payment:', get().cart);
    }, 100);
  },

  // NEW: Refresh products data from global store
  refreshProductsData: async () => {
    console.log('🔄 POS Store: Refreshing products data...');
    try {
      set({ loading: true, error: null });
      await globalDataRefresh.refreshProductsImmediately();
      console.log('✅ POS Store: Products data refreshed successfully');
    } catch (error: any) {
      console.error('❌ POS Store: Failed to refresh products data:', error);
      set({ error: 'Failed to refresh products data' });
    } finally {
      set({ loading: false });
    }
  },

  // NEW: Refresh all data from global store
  refreshAllData: async () => {
    console.log('🔄 POS Store: Refreshing all data...');
    try {
      set({ loading: true, error: null });
      await globalDataRefresh.refreshImmediately();
      console.log('✅ POS Store: All data refreshed successfully');
    } catch (error: any) {
      console.error('❌ POS Store: Failed to refresh data:', error);
      set({ error: 'Failed to refresh data' });
    } finally {
      set({ loading: false });
    }
  },

  getProductId: (product: Product): number => {
    const id = product.id;
    if (id === undefined || id === null) {
      console.error('Product missing ID:', product);
      throw new Error('Product missing ID');
    }
    return id;
  },

  handleAddToCart: async (product: Product) => {
    const { cart, getProductId } = get();

    if (!product || product.quantity <= 0) {
      set({ error: product?.name ? `${product.name} is out of stock` : 'Invalid product' });
      setTimeout(() => set({ error: null }), 3000);
      return;
    }

    let productId: number;
    try {
      productId = getProductId(product);
    } catch {
      set({ error: 'Invalid product ID' });
      setTimeout(() => set({ error: null }), 3000);
      return;
    }

    const existing = cart.find((i) => i.id === productId);

    if (existing) {
      if (existing.quantity + 1 > product.quantity) {
        set({ error: `Only ${product.quantity} units available` });
        setTimeout(() => set({ error: null }), 3000);
        return;
      }

      set({
        cart: cart.map((i) =>
          i.id === productId ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      const newItem: CartItem = {
        id: productId,
        product_name: product.name,
        price: product.price,
        quantity: 1,
        barcode: product.barcode || 0,
        quantityInStock: product.quantity,
        category: product.category || 'Uncategorized',
        img: product.img,
        description: product.description,
      };

      set({ cart: [...cart, newItem] });
    }
  },

  handleRemoveItem: (id: number) => {
    set((state) => ({ cart: state.cart.filter((item) => item.id !== id) }));
  },

  handleQuantityChange: (id: number, quantity: number) => {
    if (quantity < 1) {
      get().handleRemoveItem(id);
      return;
    }

    const { products, getProductId } = get();
    const product = products.find((p) => {
      try {
        return getProductId(p) === id;
      } catch {
        return false;
      }
    });

    if (product && quantity > product.quantity) {
      set({ error: `Only ${product.quantity} units available` });
      setTimeout(() => set({ error: null }), 3000);
      return;
    }

    set((state) => ({
      cart: state.cart.map((i) => (i.id === id ? { ...i, quantity } : i)),
    }));
  },

  handleDiscountChange: (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    set({ discount: value >= 0 ? value : 0 });
  },

  toggleDiscountType: () => {
    set((state) => ({ isDiscountPercentage: !state.isDiscountPercentage, discount: 0 }));
  },

  handleCancel: () => {
    get().clearCart();
  },

  handlePrint: () => {
    console.log('Print receipt triggered from store');
  },

  handleBarcodeSubmit: async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { barcodeInput, products } = get();
    if (!barcodeInput.trim()) return;

    set({ scanning: true });

    const found = products.find(
      (p) =>
        p.barcode?.toString() === barcodeInput.trim() ||
        p.name.toLowerCase().includes(barcodeInput.toLowerCase())
    );

    if (found) {
      await get().handleAddToCart(found);
      set({ barcodeInput: '' });
    } else {
      set({ error: `Product not found: ${barcodeInput}` });
      setTimeout(() => set({ error: null }), 3000);
    }

    set({ scanning: false });
  },

  isLowStock: (product: Product) => {
    const min = parseInt(product.minStock || '1', 10);
    return product.quantity <= min;
  },

  // API Operations
  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('http://192.168.1.3:3000/api/inventory/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      set({ products: data });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load products' });
    } finally {
      set({ loading: false });
    }
  },

  fetchCustomers: async () => {
    try {
      const response = await customersService.getCustomers({ limit: 1000 });
      const list = response.customers || response.data || [];
      set({ customers: list });
    } catch (err: any) {
      console.error('Failed to load customers:', err);
      set({ error: 'Failed to load customers' });
    }
  },

  fetchCategories: async () => {
    try {
      const res = await fetch('http://192.168.1.3:3000/api/categories/all');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      set({ categories: data });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  createNewCustomer: async (customerData: any) => {
    try {
      const result = await customersService.createCustomer(customerData);
      const newCustomer = result.customer || result.data || result;
      set((state) => ({ customers: [...state.customers, newCustomer] }));
      return newCustomer;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create customer' });
      throw err;
    }
  },

  searchCustomersByQuery: async (query: string) => {
    try {
      return await customersService.searchCustomers(query);
    } catch (err: any) {
      set({ error: 'Customer search failed' });
      return [];
    }
  },

  updateCustomerLoyalty: async (customerId: number, points: number) => {
    try {
      await customersService.addLoyaltyPoints(customerId, points, 'Purchase reward');
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === customerId ? { ...c, loyalty_points: points } : c
        ),
      }));
    } catch (err: any) {
      console.error('Loyalty update failed:', err);
    }
  },
}));