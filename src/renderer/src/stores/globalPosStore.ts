// src/renderer/src/stores/globalPosStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, Customer, Category, GlobalPosState } from '../types/pos.types';
import { customersService } from '../../services/customerService';
import { getInventoryProducts, getCategories } from '../../services/api';
import React from 'react'; 

export const useGlobalPosStore = create<GlobalPosState>()(
  persist(
    (set, get) => ({
      // Initial state with explicit typing
      products: [] as Product[],
      customers: [] as Customer[],
      categories: [] as Category[],
      
      loading: {
        products: false,
        customers: false,
        categories: false,
      },
      
      errors: {
        products: null as string | null,
        customers: null as string | null,
        categories: null as string | null,
      },
      
      lastFetched: {
        products: null as number | null,
        customers: null as number | null,
        categories: null as number | null,
      },

      // Track last customer update for synchronization
      lastCustomerUpdate: null as number | null,
      
      // Helper function to get consistent product ID
      getProductId: (product: Product): number => {
        const productId = product.id;
        if (productId === undefined || productId === null) {
          console.error('❌ Product missing both id and _id:', product);
          throw new Error('Product missing ID');
        }
        return productId;
      },
      
      // Basic Actions
      setProducts: (products: Product[]) => {
        console.log('📦 Setting products in global store:', products.length);
        set({ products });
      },
      
      setCustomers: (customers: Customer[]) => {
        console.log('👥 Setting customers in global store:', customers.length);
        set({ 
          customers,
          lastCustomerUpdate: Date.now()
        });
      },
      
      setCategories: (categories: Category[]) => set({ categories }),
      
      setLoading: (key: keyof GlobalPosState['loading'], loading: boolean) => 
        set((state: GlobalPosState) => ({ 
          loading: { ...state.loading, [key]: loading } 
        })),
      
      setError: (key: keyof GlobalPosState['errors'], error: string | null) => 
        set((state: GlobalPosState) => ({ 
          errors: { ...state.errors, [key]: error } 
        })),
      
      updateLastFetched: (key: keyof GlobalPosState['lastFetched']) =>
        set((state: GlobalPosState) => ({
          lastFetched: { ...state.lastFetched, [key]: Date.now() }
        })),
      
      clearData: () => set({
        products: [] as Product[],
        customers: [] as Customer[],
        categories: [] as Category[],
        errors: {
          products: null as string | null,
          customers: null as string | null,
          categories: null as string | null,
        },
        lastCustomerUpdate: null as number | null,
      }),

      // Customer Synchronization Actions

      /**
       * Add a new customer to the store and mark as updated
       */
      addCustomer: (customer: Customer) => {
        console.log('➕ Adding new customer to global store:', customer);
        set((state: GlobalPosState) => {
          // Check if customer already exists to avoid duplicates
          const exists = state.customers.find((c: Customer) => c.id === customer.id);
          if (exists) {
            console.log('⚠️ Customer already exists, updating instead:', customer.id);
            // Update existing customer
            const updatedCustomers = state.customers.map((c: Customer) => 
              c.id === customer.id ? customer : c
            );
            return { 
              customers: updatedCustomers,
              lastCustomerUpdate: Date.now()
            };
          }
          
          // Add new customer to the beginning of the list
          const updatedCustomers = [customer, ...state.customers];
          return { 
            customers: updatedCustomers,
            lastCustomerUpdate: Date.now()
          };
        });
      },

      /**
       * Update an existing customer in the store
       */
      updateCustomer: (customer: Customer) => {
        console.log('✏️ Updating customer in global store:', customer);
        set((state: GlobalPosState) => {
          const updatedCustomers = state.customers.map((c: Customer) => 
            c.id === customer.id ? customer : c
          );
          return { 
            customers: updatedCustomers,
            lastCustomerUpdate: Date.now()
          };
        });
      },

      /**
       * Remove a customer from the store
       */
      removeCustomer: (customerId: number) => {
        console.log('🗑️ Removing customer from global store:', customerId);
        set((state: GlobalPosState) => {
          const updatedCustomers = state.customers.filter((c: Customer) => c.id !== customerId);
          return { 
            customers: updatedCustomers,
            lastCustomerUpdate: Date.now()
          };
        });
      },

      /**
       * Force refresh customers from the server
       */
      refreshCustomers: async () => {
        const { setLoading, setError, setCustomers } = get();
        
        try {
          console.log('🔄 Refreshing customers from server...');
          setLoading('customers', true);
          setError('customers', null);

          const response = await customersService.getCustomers({ 
            page: 1, 
            limit: 1000 
          });
          
          if (response.customers) {
            setCustomers(response.customers);
            console.log('✅ Customers refreshed:', response.customers.length);
          }
        } catch (error: any) {
          console.error('❌ Failed to refresh customers:', error);
          setError('customers', error.message || 'Failed to refresh customers');
        } finally {
          setLoading('customers', false);
        }
      },

      /**
       * NEW: Refresh products from the server
       */
      refreshProducts: async () => {
        const { setLoading, setError, setProducts, updateLastFetched } = get();
        
        try {
          console.log('🔄 Refreshing products from server...');
          setLoading('products', true);
          setError('products', null);

          const response = await getInventoryProducts();
          setProducts(response.data);
          updateLastFetched('products');
          console.log('✅ Products refreshed:', response.data.length);
        } catch (error: any) {
          console.error('❌ Failed to refresh products:', error);
          setError('products', error.message || 'Failed to refresh products');
        } finally {
          setLoading('products', false);
        }
      },

      /**
       * NEW: Refresh categories from the server
       */
      refreshCategories: async () => {
        const { setLoading, setError, setCategories, updateLastFetched } = get();
        
        try {
          console.log('🔄 Refreshing categories from server...');
          setLoading('categories', true);
          setError('categories', null);

          const response = await getCategories();
          setCategories(response.data);
          updateLastFetched('categories');
          console.log('✅ Categories refreshed:', response.data.length);
        } catch (error: any) {
          console.error('❌ Failed to refresh categories:', error);
          setError('categories', error.message || 'Failed to refresh categories');
        } finally {
          setLoading('categories', false);
        }
      },

      /**
       * NEW: Refresh all data from the server
       */
      refreshAllData: async () => {
        console.log('🔄 Refreshing all data from server...');
        const { refreshProducts, refreshCustomers, refreshCategories } = get();
        
        await Promise.all([
          refreshProducts(),
          refreshCustomers(),
          refreshCategories()
        ]);
        
        console.log('✅ All data refreshed successfully');
      },

      /**
       * Smart synchronization - only refresh if needed
       */
      syncCustomers: async () => {
        const state = get();
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes cache
        
        // Only sync if data is stale or never fetched
        if (!state.lastFetched.customers || 
            (now - state.lastFetched.customers) > fiveMinutes) {
          console.log('🔄 Customers data is stale, syncing...');
          await state.refreshCustomers();
        } else {
          console.log('✅ Customers data is fresh, skipping sync');
        }
      },

      /**
       * Get customer by ID with fallback to server if not found locally
       */
      getCustomerById: (customerId: number): Customer | undefined => {
        const state = get();
        
        // First try to find in local store
        const localCustomer = state.customers.find((c: Customer) => c.id === customerId);
        if (localCustomer) {
          return localCustomer;
        }

        // If not found locally, try to fetch from server (async)
        // This doesn't block the UI but will update the store for future use
        setTimeout(async () => {
          try {
            const customer = await customersService.getCustomer(customerId);
            if (customer) {
              get().addCustomer(customer);
            }
          } catch (error) {
            console.error('❌ Failed to fetch customer:', error);
          }
        }, 0);

        return undefined;
      },
    }),
    {
      name: 'global-pos-store',
      partialize: (state: GlobalPosState) => ({
        products: state.products,
        customers: state.customers,
        categories: state.categories,
        lastFetched: state.lastFetched,
        lastCustomerUpdate: state.lastCustomerUpdate,
      }),
      
      // Custom merge function to handle customer updates
      merge: (persistedState: any, currentState: GlobalPosState) => {
        console.log('🔄 Merging persisted state with current state...');
        
        // If persisted state has newer customer data, use it
        const persistedLastUpdate = persistedState.lastCustomerUpdate || 0;
        const currentLastUpdate = currentState.lastCustomerUpdate || 0;
        
        if (persistedLastUpdate > currentLastUpdate) {
          console.log('📥 Using persisted customer data (newer)');
          return {
            ...currentState,
            ...persistedState,
          };
        }
        
        console.log('✅ Using current customer data (newer or equal)');
        return {
          ...persistedState,
          ...currentState,
          // Always use current functions
          addCustomer: currentState.addCustomer,
          updateCustomer: currentState.updateCustomer,
          removeCustomer: currentState.removeCustomer,
          refreshCustomers: currentState.refreshCustomers,
          refreshProducts: currentState.refreshProducts,
          refreshCategories: currentState.refreshCategories,
          refreshAllData: currentState.refreshAllData,
          syncCustomers: currentState.syncCustomers,
          getCustomerById: currentState.getCustomerById,
        };
      },
    }
  )
);

// Export helper functions for easy customer management

/**
 * Hook to easily add customers from any component
 */
export const useCustomerManager = () => {
  const { addCustomer, updateCustomer, removeCustomer, refreshCustomers } = useGlobalPosStore();

  const createAndAddCustomer = async (customerData: any) => {
    try {
      const result = await customersService.createCustomer(customerData);
      if (result?.customer) {
        addCustomer(result.customer);
        return result.customer;
      }
    } catch (error) {
      console.error('❌ Failed to create and add customer:', error);
      throw error;
    }
  };

  const updateAndSyncCustomer = async (customerId: number, customerData: any) => {
    try {
      const result = await customersService.updateCustomer(customerId, customerData);
      if (result?.customer) {
        updateCustomer(result.customer);
        return result.customer;
      }
    } catch (error) {
      console.error('❌ Failed to update and sync customer:', error);
      throw error;
    }
  };

  const deleteAndRemoveCustomer = async (customerId: number) => {
    try {
      await customersService.deleteCustomer(customerId);
      removeCustomer(customerId);
    } catch (error) {
      console.error('❌ Failed to delete and remove customer:', error);
      throw error;
    }
  };

  return {
    createAndAddCustomer,
    updateAndSyncCustomer,
    deleteAndRemoveCustomer,
    refreshCustomers,
  };
};

/**
 * Hook to automatically sync customers when component mounts
 */
export const useAutoSyncCustomers = (enable: boolean = true) => {
  const { syncCustomers, lastFetched } = useGlobalPosStore();

  React.useEffect(() => {
    if (enable && (!lastFetched.customers || Date.now() - lastFetched.customers > 5 * 60 * 1000)) {
      syncCustomers();
    }
  }, [enable, lastFetched.customers, syncCustomers]);
};