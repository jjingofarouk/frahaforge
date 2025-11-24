// src/renderer/src/hooks/useInstantTransactions.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import transactionsService from '../../services/transactionsService';
import { useUltraFastAccountingStore } from '../stores/ultraFastAccountingStore';
import { Transaction } from '../../components/transactions/components/ModernTables/transactions.types';

interface UseInstantTransactionsProps {
  dateRange: { start: Date; end: Date };
  enableBackgroundRefresh?: boolean;
}

interface UseInstantTransactionsReturn {
  data: Transaction[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasCachedData: boolean;
  refreshData: () => Promise<void>;
  fetchData: (forceRefresh?: boolean) => Promise<void>;
  addTransaction: (transaction: any) => void;
  updateTransaction: (id: number, updates: any) => void;
  deleteTransaction: (id: number) => void;
}

// Helper to ensure Date objects
const ensureDate = (date: any): Date => {
  if (date instanceof Date) return date;
  if (typeof date === 'string' || typeof date === 'number') return new Date(date);
  return new Date();
};

export const useInstantTransactions = ({ 
  dateRange, 
  enableBackgroundRefresh = true 
}: UseInstantTransactionsProps): UseInstantTransactionsReturn => {
  const store = useUltraFastAccountingStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const lastRangeHash = useRef('');
  const refreshIntervalRef = useRef<number | null>(null);

  // Ensure proper Date objects
  const safeDateRange = {
    start: ensureDate(dateRange.start),
    end: ensureDate(dateRange.end)
  };

  // Get cached data (always returns array)
  const cachedData = store.getCachedData<Transaction[]>('transactions', safeDateRange, []);
  const isLoading = store.isDataLoading('transactions');

  // Fetch data function
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Skip if we have cache and not forcing refresh
    if (!forceRefresh && cachedData.length > 0) {
      console.log('🚀 Using cached data');
      return;
    }

    store.setLoading('transactions', true);
    setError(null);
    setIsRefreshing(true);

    try {
      console.log('🔄 Fetching transactions...');
      
      const response = await transactionsService.getTransactions({
        start_date: safeDateRange.start.toISOString().split('T')[0],
        end_date: safeDateRange.end.toISOString().split('T')[0],
        limit: 5000
      });

      const transactions: Transaction[] = response.transactions || [];
      store.setCachedData('transactions', safeDateRange, transactions);
      
      console.log(`✅ Loaded ${transactions.length} transactions`);
      
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      store.setLoading('transactions', false);
      setIsRefreshing(false);
    }
  }, [safeDateRange.start.getTime(), safeDateRange.end.getTime(), store, cachedData.length]);

  // Handle date range changes
  useEffect(() => {
    const rangeHash = store.getCurrentRangeHash();
    
    if (rangeHash !== lastRangeHash.current) {
      lastRangeHash.current = rangeHash;
      
      if (cachedData.length === 0) {
        console.log('🎯 Date changed, fetching...');
        fetchData();
      } else {
        console.log('🎯 Date changed, using cache');
      }
    }
  }, [store.getCurrentRangeHash(), fetchData, cachedData.length]);

  // Background refresh
  useEffect(() => {
    if (enableBackgroundRefresh) {
      refreshIntervalRef.current = window.setInterval(() => {
        const rangeHash = store.getCurrentRangeHash();
        const cached = store.getCachedData<Transaction[]>('transactions', safeDateRange, []);
        const transactionsCache = store.transactions[rangeHash];
        
        // Refresh if data is older than 2 minutes
        if (cached.length > 0 && transactionsCache && Date.now() - transactionsCache.timestamp > 2 * 60 * 1000) {
          console.log('🔄 Background refresh');
          fetchData(true);
        }
      }, 30 * 1000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [enableBackgroundRefresh, store, fetchData, safeDateRange.start.getTime(), safeDateRange.end.getTime()]);

  // Manual refresh
  const refreshData = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    data: cachedData,
    isLoading: isLoading && cachedData.length === 0,
    isRefreshing,
    error,
    hasCachedData: cachedData.length > 0,
    refreshData,
    fetchData,
    addTransaction: store.addTransaction,
    updateTransaction: store.updateTransaction,
    deleteTransaction: store.deleteTransaction
  };
};