import axios from 'axios';
import authService from './authService';

// SIMPLE: Direct server connection - replace with your actual server IP
const API_BASE_URL = 'http://192.168.1.3:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

console.log('🚀 API Service initialized with direct URL:', API_BASE_URL);

// Remove the complex updateApiBaseUrl function - we use direct connection
export const updateApiBaseUrl = (serverIp: string, port: number = 3000) => {
  const newBaseUrl = `http://${serverIp}:${port}/api`;
  api.defaults.baseURL = newBaseUrl;
  console.log('🔧 API base URL updated to:', newBaseUrl);
};

api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Call: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }

    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      console.log('✅ User logged in:', currentUser.fullname);
    } else {
      console.log('⚠️ No user logged in');
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔐 Authentication error, clearing session...');
      try {
        await authService.logout();
      } catch (logoutError) {
        console.error('Logout during auth error:', logoutError);
      }
      
      if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
        console.log('🔄 Sending app reload request...');
        window.electron.ipcRenderer.send('app-reload', '');
      } else {
        console.log('⚠️ Electron IPC not available, forcing page reload');
        window.location.reload();
      }
      return Promise.reject(error);
    }

    console.error('❌ API Error:', {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      method: error.config?.method,
      status: error.response?.status,
      code: error.code,
      message: error.response?.data?.message || error.message,
    });

    let userMessage = 'Operation failed';
    
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      userMessage = `Cannot connect to server at ${API_BASE_URL}. Please ensure the backend server is running.`;
    } else if (error.response?.status === 404) {
      userMessage = 'Resource not found. Please check the ID and try again.';
    } else if (error.response?.status === 400) {
      userMessage = 'Invalid request. Please check your input data.';
    } else if (error.response?.status === 403) {
      userMessage = 'Access denied. You do not have permission for this operation.';
    } else if (error.response?.status === 409) {
      userMessage = 'Conflict detected. This resource may already exist.';
    } else if (error.response?.status === 422) {
      userMessage = 'Validation error. Please check your input data.';
    } else if (error.code === 'ECONNABORTED' || error.code === 'TIMEOUT_ERROR') {
      userMessage = 'Request timeout. The server is taking too long to respond. Please try again.';
    } else if (error.response?.status >= 500) {
      userMessage = 'Server error. Please try again later.';
    }

    const enhancedError = new Error(userMessage);
    enhancedError.name = error.name;
    enhancedError.stack = error.stack;
    return Promise.reject(enhancedError);
  }
);

export const withErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  customErrorMessage?: string
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    const code = error.code;

    console.error(`❌ API Operation Failed:`, {
      status,
      code,
      message,
      customErrorMessage
    });

    let userMessage = customErrorMessage || 'Operation failed';

    if (code === 'ERR_NETWORK' || message?.includes('Network Error')) {
      userMessage = `Cannot connect to server at ${API_BASE_URL}. Please ensure the backend server is running.`;
    } else if (status === 404) {
      userMessage = 'Resource not found. Please check the ID and try again.';
    } else if (status === 400) {
      userMessage = 'Invalid request. Please check your input data.';
    } else if (status === 401) {
      userMessage = 'Authentication required. Please log in again.';
    } else if (status === 403) {
      userMessage = 'Access denied. You do not have permission for this operation.';
    } else if (status === 409) {
      userMessage = 'Conflict detected. This resource may already exist.';
    } else if (status === 429) {
      userMessage = 'Rate limit exceeded. Please slow down your requests and try again in a moment.';
    } else if (status === 500) {
      userMessage = 'Server error. Please try again later.';
    }

    throw new Error(userMessage);
  }
};

// API endpoints - THESE ARE ESSENTIAL!
export const getInventoryProducts = () => api.get('/inventory/products');
export const getProductById = (id: string) => api.get(`/inventory/product/${id}`);
export const createProduct = (product: any) => api.post('/inventory/product', product);
export const updateProduct = (product: any) => api.put('/inventory/product', product);
export const deleteProduct = (productId: number) => api.delete(`/inventory/product/${productId}`);
export const restockProduct = (restockData: any) => api.post('/inventory/product/restock', restockData);

export const getCategories = () => api.get('/categories/all');
export const createCategory = (category: { name: string }) => api.post('/categories/category', category);
export const updateCategory = (category: { id: number; name: string }) => api.put('/categories/category', category);
export const deleteCategory = (categoryId: number) => api.delete(`/categories/category/${categoryId}`);

export const getUsers = () => api.get('/users/all');
export const getUserById = (userId: number) => api.get(`/users/user/${userId}`);
export const createUser = (userData: any) => api.post('/users/user', userData);
export const updateUser = (userId: number, userData: any) => api.post('/users/user', { ...userData, id: userId });
export const deleteUser = (userId: number) => api.delete(`/users/user/${userId}`);

// Remove settings endpoints since we're not using them
// export const getSettings = () => api.get('/settings/get');
// export const updateSettings = (settings: any) => api.put('/settings/update', settings);

export const getFinancialSummary = (params?: { startDate?: string; endDate?: string }) => api.get('/accounting/summary', { params });
export const getExpenses = (params?: { category?: string; startDate?: string; endDate?: string }) => api.get('/accounting/expenses', { params });
export const addExpense = (expense: any) => api.post('/accounting/expenses', expense);
export const updateExpense = (id: string, expense: any) => api.put(`/accounting/expenses/${id}`, expense);
export const deleteExpense = (id: string) => api.delete(`/accounting/expenses/${id}`);
export const getExpenseCategories = () => api.get('/accounting/expenses/categories');

export const getSalesReport = (params: { startDate: string; endDate: string }) => api.get('/analytics/sales', { params });
export const getInventoryReport = () => api.get('/analytics/inventory');
export const getCustomerReport = () => api.get('/analytics/customers');

export const checkServerHealth = () => api.get('/health');
export const getServerInfo = () => api.get('/server-info');

export const getUserRole = (user: any): string => {
  if (!user) return 'Unknown';
  if (user.perm_users && user.perm_settings) return 'Administrator';
  if (user.perm_products && user.perm_transactions && !user.perm_users) return 'Manager';
  if (user.perm_products && !user.perm_transactions && !user.perm_users) return 'Dispenser';
  if (!user.perm_products && user.perm_transactions && !user.perm_users) return 'Cashier';
  return 'Limited User';
};

export const hasPermission = (user: any, permission: string): boolean => {
  return user ? user[permission] === 1 : false;
};

export const canAccessModule = (user: any, module: string): boolean => {
  const permissions = {
    'users': 'perm_users',
    'settings': 'perm_settings',
    'products': 'perm_products',
    'categories': 'perm_categories',
    'transactions': 'perm_transactions',
    'pos': 'perm_products',
    'orders': 'perm_products',
    'accounting': 'perm_transactions'
  };
  const permissionKey = permissions[module as keyof typeof permissions];
  return permissionKey ? hasPermission(user, permissionKey) : true;
};

export const getTransactions = (params?: {
  page?: number;
  limit?: number;
  customer_id?: number;
  status?: number;
  start_date?: string;
  end_date?: string;
}) => api.get('/transactions', { params });

export const getTransactionById = (transactionId: number) => api.get(`/transactions/${transactionId}`);
export const createTransaction = (transactionData: any) => api.post('/transactions', transactionData);
export const createTransactionAlt = (transactionData: any) => api.post('/transactions/create', transactionData);
export const getTransactionItems = (transactionId: number) => api.get(`/transactions/${transactionId}/items`);
export const refundTransaction = (transactionId: number, refundData: any) =>
  api.put(`/transactions/${transactionId}/refund`, refundData);
export const updateTransaction = (transactionId: number, updateData: any) =>
  api.put(`/transactions/${transactionId}`, updateData);
export const deleteTransaction = (transactionId: number) =>
  api.delete(`/transactions/${transactionId}`);

export default api;