// src/renderer/src/stores/ultraFastAccountingStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  dateRange: DateRange;
  hash: string;
}

export interface AccountingData {
  transactions: { [rangeHash: string]: CachedData<any[]> };
  expenses: { [rangeHash: string]: CachedData<any[]> };
  dashboardSummary: { [rangeHash: string]: CachedData<any> };
  profitLoss: { [rangeHash: string]: CachedData<any> };
  expenseAnalysis: { [rangeHash: string]: CachedData<any> };
  
  chartOfAccounts: any[];
  accountsPayable: any[];
  accountsReceivable: any[];
  
  currentDateRange: DateRange;
  loadingStates: { [key: string]: boolean };
  lastUserAction: number;
}

export interface UltraFastAccountingStore extends AccountingData {
  getCachedData: <T>(key: keyof AccountingData, dateRange: DateRange, initialValue: T) => T;
  setCachedData: <T>(key: keyof AccountingData, dateRange: DateRange, data: T) => void;
  
  setDateRange: (dateRange: DateRange) => void;
  getCurrentRangeHash: () => string;
  
  setLoading: (key: string, loading: boolean) => void;
  isDataLoading: (key: string) => boolean;
  
  addTransaction: (transaction: any) => void;
  updateTransaction: (id: number, updates: any) => void;
  deleteTransaction: (id: number) => void;
  
  addExpense: (expense: any) => void;
  updateExpense: (id: number, updates: any) => void;
  deleteExpense: (id: number) => void;
  
  clearCache: (key?: keyof AccountingData) => void;
  getCacheStats: () => { totalEntries: number; memoryUsage: string };
}

// Simple utility to ensure Date objects
const ensureDate = (date: any): Date => {
  if (date instanceof Date) return date;
  if (typeof date === 'string' || typeof date === 'number') return new Date(date);
  return new Date();
};

// Generate hash from date range
const generateRangeHash = (dateRange: DateRange): string => {
  const start = ensureDate(dateRange.start);
  const end = ensureDate(dateRange.end);
  return `${start.getTime()}-${end.getTime()}`;
};

// Check if cache is valid (default 5 minutes)
const isCacheValid = (cachedData: CachedData<any> | null, maxAge: number = 5 * 60 * 1000): boolean => {
  if (!cachedData) return false;
  return Date.now() - cachedData.timestamp < maxAge;
};

// Get today's date range
const getTodayRange = (): DateRange => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  };
};

export const useUltraFastAccountingStore = create<UltraFastAccountingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      transactions: {},
      expenses: {},
      dashboardSummary: {},
      profitLoss: {},
      expenseAnalysis: {},
      chartOfAccounts: [],
      accountsPayable: [],
      accountsReceivable: [],
      currentDateRange: getTodayRange(),
      loadingStates: {},
      lastUserAction: Date.now(),

      // Get cached data with fallback
      getCachedData: <T>(key: keyof AccountingData, dateRange: DateRange, initialValue: T): T => {
        const state = get();
        const rangeHash = generateRangeHash(dateRange);
        
        const cacheMap = {
          transactions: state.transactions,
          expenses: state.expenses,
          dashboardSummary: state.dashboardSummary,
          profitLoss: state.profitLoss,
          expenseAnalysis: state.expenseAnalysis,
        };
        
        const cache = cacheMap[key as keyof typeof cacheMap] as { [rangeHash: string]: CachedData<T> };
        
        if (cache?.[rangeHash] && isCacheValid(cache[rangeHash])) {
          console.log(`✅ Cache HIT for ${key}`);
          return cache[rangeHash].data;
        }
        
        console.log(`❌ Cache MISS for ${key}`);
        return initialValue;
      },

      // Set cached data
      setCachedData: <T>(key: keyof AccountingData, dateRange: DateRange, data: T) => {
        const rangeHash = generateRangeHash(dateRange);
        
        set((state) => {
          const updateObj: Partial<AccountingData> = {};
          
          if (['transactions', 'expenses', 'dashboardSummary', 'profitLoss', 'expenseAnalysis'].includes(key)) {
            updateObj[key] = {
              ...(state[key] as any),
              [rangeHash]: {
                data,
                timestamp: Date.now(),
                dateRange: {
                  start: ensureDate(dateRange.start),
                  end: ensureDate(dateRange.end)
                },
                hash: rangeHash
              }
            };
          }
          
          return { ...state, ...updateObj };
        });
        
        console.log(`💾 Cached ${key}`);
      },

      // Set date range
      setDateRange: (dateRange: DateRange) => {
        set({
          currentDateRange: {
            start: ensureDate(dateRange.start),
            end: ensureDate(dateRange.end)
          }
        });
      },

      // Get current range hash
      getCurrentRangeHash: () => {
        return generateRangeHash(get().currentDateRange);
      },

      // Loading state
      setLoading: (key: string, loading: boolean) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, [key]: loading }
        }));
      },

      isDataLoading: (key: string) => {
        return !!get().loadingStates[key];
      },

      // Transaction operations
      addTransaction: (transaction: any) => {
        set((state) => {
          const rangeHash = generateRangeHash(state.currentDateRange);
          const newTransactions = { ...state.transactions };
          
          if (newTransactions[rangeHash]) {
            newTransactions[rangeHash] = {
              ...newTransactions[rangeHash],
              data: [transaction, ...(newTransactions[rangeHash].data || [])],
              timestamp: Date.now()
            };
          } else {
            newTransactions[rangeHash] = {
              data: [transaction],
              timestamp: Date.now(),
              dateRange: state.currentDateRange,
              hash: rangeHash
            };
          }
          
          return { transactions: newTransactions };
        });
      },

      updateTransaction: (id: number, updates: any) => {
        set((state) => {
          const newTransactions = { ...state.transactions };
          
          Object.keys(newTransactions).forEach(rangeHash => {
            if (newTransactions[rangeHash]) {
              newTransactions[rangeHash] = {
                ...newTransactions[rangeHash],
                data: newTransactions[rangeHash].data.map((tx: any) =>
                  tx.id === id ? { ...tx, ...updates } : tx
                ),
                timestamp: Date.now()
              };
            }
          });
          
          return { transactions: newTransactions };
        });
      },

      deleteTransaction: (id: number) => {
        set((state) => {
          const newTransactions = { ...state.transactions };
          
          Object.keys(newTransactions).forEach(rangeHash => {
            if (newTransactions[rangeHash]) {
              newTransactions[rangeHash] = {
                ...newTransactions[rangeHash],
                data: newTransactions[rangeHash].data.filter((tx: any) => tx.id !== id),
                timestamp: Date.now()
              };
            }
          });
          
          return { transactions: newTransactions };
        });
      },

      // Expense operations
      addExpense: (expense: any) => {
        set((state) => {
          const rangeHash = generateRangeHash(state.currentDateRange);
          const newExpenses = { ...state.expenses };
          
          if (newExpenses[rangeHash]) {
            newExpenses[rangeHash] = {
              ...newExpenses[rangeHash],
              data: [expense, ...(newExpenses[rangeHash].data || [])],
              timestamp: Date.now()
            };
          } else {
            newExpenses[rangeHash] = {
              data: [expense],
              timestamp: Date.now(),
              dateRange: state.currentDateRange,
              hash: rangeHash
            };
          }
          
          return { expenses: newExpenses };
        });
      },

      updateExpense: (id: number, updates: any) => {
        set((state) => {
          const newExpenses = { ...state.expenses };
          
          Object.keys(newExpenses).forEach(rangeHash => {
            if (newExpenses[rangeHash]) {
              newExpenses[rangeHash] = {
                ...newExpenses[rangeHash],
                data: newExpenses[rangeHash].data.map((expense: any) =>
                  expense.id === id ? { ...expense, ...updates } : expense
                ),
                timestamp: Date.now()
              };
            }
          });
          
          return { expenses: newExpenses };
        });
      },

      deleteExpense: (id: number) => {
        set((state) => {
          const newExpenses = { ...state.expenses };
          
          Object.keys(newExpenses).forEach(rangeHash => {
            if (newExpenses[rangeHash]) {
              newExpenses[rangeHash] = {
                ...newExpenses[rangeHash],
                data: newExpenses[rangeHash].data.filter((expense: any) => expense.id !== id),
                timestamp: Date.now()
              };
            }
          });
          
          return { expenses: newExpenses };
        });
      },

      // Cache management
      clearCache: (key?: keyof AccountingData) => {
        set((state) => {
          if (key) {
            return { [key]: {} };
          }
          return {
            transactions: {},
            expenses: {},
            dashboardSummary: {},
            profitLoss: {},
            expenseAnalysis: {}
          };
        });
      },

      getCacheStats: () => {
        const state = get();
        let totalEntries = 0;
        let totalSize = 0;
        
        const keys: (keyof AccountingData)[] = ['transactions', 'expenses', 'dashboardSummary', 'profitLoss', 'expenseAnalysis'];
        
        keys.forEach(key => {
          const cache = state[key] as { [rangeHash: string]: CachedData<any> };
          if (cache) {
            totalEntries += Object.keys(cache).length;
            Object.values(cache).forEach(cachedData => {
              if (cachedData?.data) {
                totalSize += JSON.stringify(cachedData.data).length;
              }
            });
          }
        });
        
        return {
          totalEntries,
          memoryUsage: `${(totalSize / 1024 / 1024).toFixed(2)} MB`
        };
      }
    }),
    {
      name: 'ultra-fast-accounting-store',
      version: 1,
      partialize: (state) => ({
        transactions: state.transactions,
        expenses: state.expenses,
        dashboardSummary: state.dashboardSummary,
        profitLoss: state.profitLoss,
        expenseAnalysis: state.expenseAnalysis,
        currentDateRange: state.currentDateRange
      }),
      // Ensure dates are converted when loading from storage
      onRehydrateStorage: () => (state) => {
        if (state?.currentDateRange) {
          state.currentDateRange = {
            start: ensureDate(state.currentDateRange.start),
            end: ensureDate(state.currentDateRange.end)
          };
        }
        
        // Convert all cached date ranges
        const cacheKeys = ['transactions', 'expenses', 'dashboardSummary', 'profitLoss', 'expenseAnalysis'];
        
        cacheKeys.forEach(key => {
          const cache = state?.[key as keyof AccountingData];
          if (cache && typeof cache === 'object' && !Array.isArray(cache)) {
            const cacheObj = cache as { [rangeHash: string]: CachedData<any> };
            Object.keys(cacheObj).forEach(hash => {
              const item = cacheObj[hash];
              if (item?.dateRange) {
                item.dateRange = {
                  start: ensureDate(item.dateRange.start),
                  end: ensureDate(item.dateRange.end)
                };
              }
            });
          }
        });
      }
    }
  )
);