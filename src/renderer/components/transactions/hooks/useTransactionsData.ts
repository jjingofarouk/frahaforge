// src/renderer/src/hooks/useTransactionsData.ts
import { useState, useEffect, useCallback } from 'react';
import transactionsService, { Transaction, SalesReport, TopProduct, DailySummary } from '../../../services/transactionsService';
import electronStoreService from '../../../services/electronStoreService';

interface DateRange {
  start: Date;
  end: Date;
}

interface TransactionsState {
  loading: boolean;
  error: string | null;
  dateRange: DateRange;
  lastUpdated: number | null;
}

interface TransactionsActions {
  setDateRange: (range: DateRange) => void;
  handleExport: (filters?: ExportFilters) => void;
  getCustomerName: (customerId: number) => string;
  refreshData: () => void;
  clearCache: () => void;
}

interface TransactionsData {
  transactions: Transaction[];
  salesData: SalesDataItem[];
  paymentData: PaymentDataItem[];
  categoryData: CategoryDataItem[];
  topCustomersData: TopCustomerDataItem[];
  hourlyData: HourlyDataItem[];
  profitData: ProfitDataItem[];
  inventoryData: InventoryDataItem[];
  cashierData: CashierDataItem[];
  products: ProductItem[];
  customersDue: CustomerDueItem[];
  categoryObjects: CategoryObjectItem[];
}

export interface ExportFilters {
  startDate: string;
  endDate: string;
  status?: string;
  paymentMethod?: string;
}

// Type definitions for processed data
interface SalesDataItem {
  date: string;
  sales: number;
}

interface PaymentDataItem {
  method: string;
  count: number;
}

interface CategoryDataItem {
  category: string;
  count: number;
  total: number;
}

interface TopCustomerDataItem {
  customer: string;
  transactions: number;
  total: number;
}

interface HourlyDataItem {
  hour: string;
  sales: number;
}

interface ProfitDataItem {
  date: string;
  profit: number;
}

interface InventoryDataItem {
  product: string;
  quantity: number;
}

interface CashierDataItem {
  cashier: string;
  transactions: number;
  total: number;
}

interface ProductItem {
  id: number;
  name: string;
}

interface CustomerDueItem {
  customer: string;
  amount: number;
}

interface CategoryObjectItem {
  id: number;
  name: string;
}

// Cache keys for Electron Store
const CACHE_KEYS = {
  TRANSACTIONS_DATA: 'transactions_data_cache',
  LAST_UPDATED: 'transactions_last_updated',
  DATE_RANGE: 'transactions_date_range'
};

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Auto-refresh interval (30 seconds)
const AUTO_REFRESH_INTERVAL = 30 * 1000;

// Helper function to get today's date range as Date objects
const getTodayRange = (): DateRange => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Create start of day (00:00:00)
  const start = new Date(todayStr + 'T00:00:00');
  // Create end of day (23:59:59)
  const end = new Date(todayStr + 'T23:59:59');
  
  return { start, end };
};

// Helper function to format date for API (YYYY-MM-DD)
const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const useTransactionsData = () => {
  const [state, setState] = useState<TransactionsState>({
    loading: true,
    error: null,
    dateRange: getTodayRange(),
    lastUpdated: null
  });

  const [data, setData] = useState<TransactionsData>({
    transactions: [],
    salesData: [],
    paymentData: [],
    categoryData: [],
    topCustomersData: [],
    hourlyData: [],
    profitData: [],
    inventoryData: [],
    cashierData: [],
    products: [],
    customersDue: [],
    categoryObjects: []
  });

  // Auto-refresh state
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);

  // Load cached data on mount
  const loadCachedData = useCallback(async (): Promise<boolean> => {
    try {
      const [cachedData, lastUpdated, cachedDateRange] = await Promise.all([
        electronStoreService.get(CACHE_KEYS.TRANSACTIONS_DATA),
        electronStoreService.get(CACHE_KEYS.LAST_UPDATED),
        electronStoreService.get(CACHE_KEYS.DATE_RANGE)
      ]);
      
      // Set cached date range if available
      if (cachedDateRange && cachedDateRange.start && cachedDateRange.end) {
        setState(prev => ({
          ...prev,
          dateRange: {
            start: new Date(cachedDateRange.start),
            end: new Date(cachedDateRange.end)
          }
        }));
      }

      if (cachedData && lastUpdated) {
        const cacheAge = Date.now() - lastUpdated;
        
        // Use cache if it's less than 5 minutes old
        if (cacheAge < CACHE_DURATION) {
          setData(cachedData);
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            lastUpdated 
          }));
          console.log('✅ Loaded transactions data from cache');
          return true;
        }
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
    return false;
  }, []);

  // Save data to cache
  const saveToCache = useCallback(async (data: TransactionsData): Promise<void> => {
    try {
      await electronStoreService.set(CACHE_KEYS.TRANSACTIONS_DATA, data);
      await electronStoreService.set(CACHE_KEYS.LAST_UPDATED, Date.now());
      console.log('✅ Transactions data cached successfully');
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }, []);

  // Save date range to cache
  const saveDateRangeToCache = useCallback(async (dateRange: DateRange): Promise<void> => {
    try {
      await electronStoreService.set(CACHE_KEYS.DATE_RANGE, {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString()
      });
    } catch (error) {
      console.error('Error caching date range:', error);
    }
  }, []);

  // Load data with caching
  const loadData = useCallback(async (forceRefresh = false): Promise<void> => {
    // Don't show loading if we're using cache and not forcing refresh
    if (!forceRefresh) {
      const cacheUsed = await loadCachedData();
      if (cacheUsed) {
        return; // Data loaded from cache, no need to fetch
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔄 Loading transactions for date range:', {
        start: state.dateRange.start,
        end: state.dateRange.end,
        startFormatted: formatDateForAPI(state.dateRange.start),
        endFormatted: formatDateForAPI(state.dateRange.end)
      });

      const freshData = await fetchAllData(state.dateRange);
      setData(freshData);
      await saveToCache(freshData);
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        lastUpdated: Date.now() 
      }));
      
      console.log('✅ Transactions data loaded from server');
    } catch (error) {
      console.error('Error loading transactions data:', error);
      
      // If fresh data fails, try to use cache as fallback
      if (!forceRefresh) {
        const cacheUsed = await loadCachedData();
        if (cacheUsed) {
          console.log('⚠️ Using cached data as fallback');
          return;
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load data' 
      }));
    }
  }, [state.dateRange, loadCachedData, saveToCache]);

  // Initial load - only once when component mounts
  useEffect(() => {
    loadData();
  }, []); // Empty dependency array - only run on mount

  // Load data when date range changes
  useEffect(() => {
    if (state.lastUpdated !== null) { // Don't run on initial mount
      loadData(true); // Force refresh when date range changes
      saveDateRangeToCache(state.dateRange);
    }
  }, [state.dateRange, saveDateRangeToCache]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing transactions data...');
      loadData(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, loadData]);

  // Action handlers
  const actions: TransactionsActions = {
    setDateRange: (range: DateRange) => {
      setState(prev => ({ ...prev, dateRange: range }));
    },

    handleExport: async (filters?: ExportFilters) => {
      try {
        const exportFilters = filters || {
          startDate: formatDateForAPI(state.dateRange.start),
          endDate: formatDateForAPI(state.dateRange.end)
        };
        
        const csv = convertToCSV(data.transactions, exportFilters);
        downloadCSV(csv, 'transactions.csv');
      } catch (error) {
        console.error('Export failed:', error);
      }
    },

    getCustomerName: (customerId: number): string => {
      const transaction = data.transactions.find(t => t.customer_id === customerId);
      return transaction?.customer_name || 'Walk-in Customer';
    },

    refreshData: () => {
      loadData(true); // Force refresh
    },

    clearCache: () => {
      try {
        electronStoreService.delete(CACHE_KEYS.TRANSACTIONS_DATA);
        electronStoreService.delete(CACHE_KEYS.LAST_UPDATED);
        electronStoreService.delete(CACHE_KEYS.DATE_RANGE);
        setState(prev => ({ ...prev, lastUpdated: null }));
        console.log('✅ Transactions cache cleared');
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    }
  };

  return { 
    state, 
    actions, 
    data,
    autoRefreshEnabled,
    setAutoRefreshEnabled
  };
};

// Data processing functions
const processTransactionData = (transactions: Transaction[]): TransactionsData => {
  const salesData = processSalesData(transactions);
  const paymentData = processPaymentData(transactions);
  const categoryData = processCategoryData(transactions);
  const cashierData = processCashierData(transactions);

  return {
    transactions,
    salesData,
    paymentData,
    categoryData,
    topCustomersData: processTopCustomersData(transactions),
    hourlyData: processHourlyData(transactions),
    profitData: processProfitData(transactions),
    inventoryData: [],
    cashierData,
    products: [],
    customersDue: processCustomersDueData(transactions),
    categoryObjects: []
  };
};

const processSalesData = (transactions: Transaction[]): SalesDataItem[] => {
  const dailySales: { [key: string]: number } = {};

  transactions.forEach(transaction => {
    const date = new Date(transaction.created_at).toLocaleDateString();
    dailySales[date] = (dailySales[date] || 0) + transaction.total;
  });

  return Object.entries(dailySales).map(([date, sales]) => ({
    date,
    sales
  }));
};

const processPaymentData = (transactions: Transaction[]): PaymentDataItem[] => {
  const paymentMethods: { [key: string]: number } = {};

  transactions.forEach(transaction => {
    const method = transaction.payment_type || 'Unknown';
    paymentMethods[method] = (paymentMethods[method] || 0) + 1;
  });

  return Object.entries(paymentMethods).map(([method, count]) => ({
    method,
    count
  }));
};

const processCategoryData = (transactions: Transaction[]): CategoryDataItem[] => {
  const categories: { [key: string]: { count: number; total: number } } = {};

  transactions.forEach(transaction => {
    transaction.items?.forEach(item => {
      const category = item.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = { count: 0, total: 0 };
      }
      categories[category].count += 1;
      categories[category].total += item.price * item.quantity;
    });
  });

  return Object.entries(categories).map(([category, stats]) => ({
    category,
    count: stats.count,
    total: stats.total
  }));
};

const processCashierData = (transactions: Transaction[]): CashierDataItem[] => {
  const cashierStats: { [key: string]: { count: number; total: number } } = {};

  transactions.forEach(transaction => {
    const cashier = transaction.user_name;
    if (!cashierStats[cashier]) {
      cashierStats[cashier] = { count: 0, total: 0 };
    }
    cashierStats[cashier].count += 1;
    cashierStats[cashier].total += transaction.total;
  });

  return Object.entries(cashierStats).map(([cashier, stats]) => ({
    cashier,
    transactions: stats.count,
    total: stats.total
  }));
};

const processTopCustomersData = (transactions: Transaction[]): TopCustomerDataItem[] => {
  const customerStats: { [key: string]: { transactions: number; total: number } } = {};

  transactions.forEach(transaction => {
    const customer = transaction.customer_name;
    if (!customerStats[customer]) {
      customerStats[customer] = { transactions: 0, total: 0 };
    }
    customerStats[customer].transactions += 1;
    customerStats[customer].total += transaction.total;
  });

  return Object.entries(customerStats)
    .map(([customer, stats]) => ({
      customer,
      transactions: stats.transactions,
      total: stats.total
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
};

const processHourlyData = (transactions: Transaction[]): HourlyDataItem[] => {
  const hourlySales: { [key: string]: number } = {};

  transactions.forEach(transaction => {
    const hour = new Date(transaction.created_at).getHours();
    const hourLabel = `${hour}:00`;
    hourlySales[hourLabel] = (hourlySales[hourLabel] || 0) + transaction.total;
  });

  return Object.entries(hourlySales).map(([hour, sales]) => ({
    hour,
    sales
  }));
};

const processProfitData = (transactions: Transaction[]): ProfitDataItem[] => {
  const dailyProfit: { [key: string]: number } = {};

  transactions.forEach(transaction => {
    const date = new Date(transaction.created_at).toLocaleDateString();
    // Simple profit calculation (total - cost estimate)
    const costEstimate = transaction.total * 0.7; // Assuming 30% margin
    const profit = transaction.total - costEstimate;
    dailyProfit[date] = (dailyProfit[date] || 0) + profit;
  });

  return Object.entries(dailyProfit).map(([date, profit]) => ({
    date,
    profit
  }));
};

const processCustomersDueData = (transactions: Transaction[]): CustomerDueItem[] => {
  const customersDue: { [key: string]: number } = {};

  transactions.forEach(transaction => {
    const due = (transaction.total || 0) - (transaction.paid || 0);
    if (due > 0) {
      const customer = transaction.customer_name;
      customersDue[customer] = (customersDue[customer] || 0) + due;
    }
  });

  return Object.entries(customersDue).map(([customer, amount]) => ({
    customer,
    amount
  }));
};

// Fetch all required data from the server
const fetchAllData = async (dateRange: DateRange): Promise<TransactionsData> => {
  try {
    const transactionsResponse = await transactionsService.getTransactions({
      start_date: formatDateForAPI(dateRange.start),
      end_date: formatDateForAPI(dateRange.end),
      limit: 1000
    });

    const transactions = transactionsResponse.transactions || [];
    console.log(`📊 Fetched ${transactions.length} transactions from server`);

    // Process the data
    return processTransactionData(transactions);

  } catch (error) {
    console.error('Error fetching all data:', error);
    throw error;
  }
};

// Enhanced CSV export with filters
const convertToCSV = (transactions: Transaction[], filters?: ExportFilters): string => {
  // Apply filters if provided
  let filteredTransactions = transactions;
  
  if (filters) {
    filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.created_at).toISOString().split('T')[0];
      const matchesDate = transactionDate >= filters.startDate && transactionDate <= filters.endDate;
      
      let matchesStatus = true;
      let matchesPaymentMethod = true;
      
      // Status filter logic
      if (filters.status) {
        const status = getStatusInfo(transaction);
        matchesStatus = status.label.toLowerCase() === filters.status?.toLowerCase();
      }
      
      // Payment method filter
      if (filters.paymentMethod) {
        matchesPaymentMethod = transaction.payment_type?.toLowerCase() === filters.paymentMethod?.toLowerCase();
      }
      
      return matchesDate && matchesStatus && matchesPaymentMethod;
    });
  }

  const headers = ['ID', 'Order Number', 'Customer', 'Total', 'Paid', 'Due', 'Payment Method', 'Status', 'Date', 'Cashier'];
  const rows = filteredTransactions.map(transaction => {
    const due = (transaction.total || 0) - (transaction.paid || 0);
    const status = getStatusInfo(transaction);
    
    return [
      transaction.id,
      transaction.order_number,
      transaction.customer_name,
      transaction.total,
      transaction.paid,
      due,
      transaction.payment_type,
      status.label,
      new Date(transaction.created_at).toLocaleDateString(),
      transaction.user_name
    ];
  });

  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

const downloadCSV = (csv: string, filename: string): void => {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

// Helper function to get status info (matching the table component)
const getStatusInfo = (transaction: Transaction): { label: string; color: string } => {
  const total = transaction.total || 0;
  const paid = transaction.paid || 0;
  const due = total - paid;
  if (due === 0) return { label: 'Paid', color: 'success' };
  if (paid > 0) return { label: 'Partial', color: 'warning' };
  return { label: 'Unpaid', color: 'danger' };
};