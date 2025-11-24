// src/renderer/src/components/pos/GlobalPosDataManager.tsx
import React, { useEffect, useCallback } from 'react';
import { useGlobalPosStore } from '../../src/stores/globalPosStore';
import { getInventoryProducts, getCategories } from '../../services/api';
import { customersService } from '../../services/customerService';

export const GlobalPosDataManager: React.FC = () => {
  const {
    setProducts,
    setCustomers,
    setCategories,
    setLoading,
    setError,
    updateLastFetched,
    lastFetched,
    refreshProducts,
    refreshCustomers,
    refreshCategories,
  } = useGlobalPosStore();

  // Enhanced fetch function with immediate refresh capability
  const fetchAllData = async (forceRefresh = false) => {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    console.log('🔄 GlobalPosDataManager: Fetching data', { forceRefresh, lastFetched });

    // Fetch products if never fetched or older than 1 minute or forced
    if (forceRefresh || !lastFetched.products || now - lastFetched.products > oneMinute) {
      try {
        setLoading('products', true);
        setError('products', null);
        const response = await getInventoryProducts();
        setProducts(response.data);
        updateLastFetched('products');
        console.log('✅ Products data refreshed:', response.data.length, 'products');
      } catch (error: any) {
        setError('products', error.message || 'Failed to fetch products');
        console.error('❌ Failed to fetch products:', error);
      } finally {
        setLoading('products', false);
      }
    }

    // Fetch customers if never fetched or older than 1 minute or forced
    if (forceRefresh || !lastFetched.customers || now - lastFetched.customers > oneMinute) {
      try {
        setLoading('customers', true);
        setError('customers', null);
        const response = await customersService.getCustomers();
        setCustomers(response.customers || response.data || response);
        updateLastFetched('customers');
        console.log('✅ Customers data refreshed:', (response.customers || response.data || response).length, 'customers');
      } catch (error: any) {
        setError('customers', error.message || 'Failed to fetch customers');
        console.error('❌ Failed to fetch customers:', error);
      } finally {
        setLoading('customers', false);
      }
    }

    // Fetch categories if never fetched or older than 1 minute or forced
    if (forceRefresh || !lastFetched.categories || now - lastFetched.categories > oneMinute) {
      try {
        setLoading('categories', true);
        setError('categories', null);
        const response = await getCategories();
        setCategories(response.data);
        updateLastFetched('categories');
        console.log('✅ Categories data refreshed:', response.data.length, 'categories');
      } catch (error: any) {
        setError('categories', error.message || 'Failed to fetch categories');
        console.error('❌ Failed to fetch categories:', error);
      } finally {
        setLoading('categories', false);
      }
    }
  };

  // NEW: Immediate refresh function for transactions
  const refreshImmediately = useCallback(async () => {
    console.log('🚀 GlobalPosDataManager: Immediate refresh triggered by transaction');
    await fetchAllData(true); // Force refresh all data
  }, [fetchAllData]);

  // NEW: Refresh only products (for transaction completion)
  const refreshProductsImmediately = useCallback(async () => {
    console.log('🚀 GlobalPosDataManager: Immediate products refresh triggered');
    try {
      setLoading('products', true);
      setError('products', null);
      const response = await getInventoryProducts();
      setProducts(response.data);
      updateLastFetched('products');
      console.log('✅ Products immediately refreshed:', response.data.length, 'products');
    } catch (error: any) {
      setError('products', error.message || 'Failed to refresh products');
      console.error('❌ Failed to refresh products:', error);
    } finally {
      setLoading('products', false);
    }
  }, [setLoading, setError, setProducts, updateLastFetched]);

  // Expose refresh functions to window for global access
  useEffect(() => {
    // @ts-ignore
    window.globalDataManager = {
      refreshImmediately,
      refreshProductsImmediately,
      refreshAllData: () => fetchAllData(true)
    };
    
    return () => {
      // @ts-ignore
      delete window.globalDataManager;
    };
  }, [refreshImmediately, refreshProductsImmediately, fetchAllData]);

  // Initial data load
  useEffect(() => {
    console.log('🏁 GlobalPosDataManager: Initial data load');
    fetchAllData(true);
  }, []);

  // Periodic refresh every 1 minute
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ GlobalPosDataManager: Periodic refresh');
      fetchAllData(false);
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [lastFetched]);

  return null;
};

// Export the refresh functions for direct use
export const globalDataRefresh = {
  refreshImmediately: () => {
    // @ts-ignore
    if (window.globalDataManager) {
      // @ts-ignore
      return window.globalDataManager.refreshImmediately();
    }
    console.warn('⚠️ GlobalDataManager not available');
  },
  refreshProductsImmediately: () => {
    // @ts-ignore
    if (window.globalDataManager) {
      // @ts-ignore
      return window.globalDataManager.refreshProductsImmediately();
    }
    console.warn('⚠️ GlobalDataManager not available');
  }
};