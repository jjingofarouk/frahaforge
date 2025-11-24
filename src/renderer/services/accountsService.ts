// src/renderer/src/services/accountsService.ts
import { withErrorHandling } from './api';

// ======================== Interfaces ========================
export interface Expense {
  id: number;
  expense_date: string;
  description: string;
  amount: number;
  category: string;
  subcategory?: string;
  payment_method: string;
  vendor_name?: string;
  reference_number?: string;
  receipt_image?: string;
  status: string;
  due_date?: string;
  recurring: boolean;
  recurring_frequency?: string;
  created_by?: number;
  created_at: string;
}

export interface CreateExpenseRequest {
  expense_date: string;
  description: string;
  amount: number;
  category: string;
  subcategory?: string;
  payment_method: string;
  vendor_name?: string;
  reference_number?: string;
  receipt_image?: string;
  status?: string;
  due_date?: string;
  recurring?: boolean;
  recurring_frequency?: string;
  created_by?: number;
}

export interface DashboardSummary {
  revenue: number;
  expenses: number;
  netProfit: number;
  cashFlow: { inflow: number; outflow: number; net: number };
  accountsPayable: { totalDue: number; pendingCount: number };
  accountsReceivable: { totalDue: number; pendingCount: number };
}

export interface ProfitLossData {
  period: { startDate: string; endDate: string };
  revenue: { total: number; transactionCount: number };
  cogs: { total: number };
  grossProfit: { amount: number; margin: number };
  operatingExpenses: {
    total: number;
    count: number;
    breakdown: Array<{ category: string; amount: number; count: number }>;
  };
  netProfit: { amount: number; margin: number };
}

export interface ExpenseAnalysis {
  totalExpenses: number;
  expenseCount: number;
  averageExpense: number;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{ month: string; amount: number; count: number }>;
  topVendors: Array<{ vendor_name: string; amount: number; count: number }>;
}

// ======================== AccountsService Class ========================
class AccountsService {
  private baseURL = 'http://192.168.1.3:3000/api/accounts';

  // Real-time listeners
  private refreshListeners = new Set<() => void>();
  private expenseListeners = new Set<(expenses: Expense[]) => void>();
  private analysisListeners = new Set<(analysis: ExpenseAnalysis) => void>();
  private recurringListeners = new Set<(expenses: Expense[]) => void>();

  // Auto-refresh state
  private autoRefreshEnabled = true;
  private lastRefreshTime = new Date();
  private refreshInProgress = false;

  constructor() {
    console.log('🚀 AccountsService using:', this.baseURL);
  }

  // ======================== Public Refresh Controls ========================
  async manualRefresh(): Promise<void> {
    if (this.refreshInProgress) {
      console.log('Refresh already in progress...');
      return;
    }
    this.refreshInProgress = true;
    this.lastRefreshTime = new Date();
    try {
      await this.refreshAllExpenseData();
      this.notifyRefresh();
      console.log('Manual refresh completed at', this.lastRefreshTime.toLocaleTimeString());
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      this.refreshInProgress = false;
    }
  }

  getAutoRefreshStatus() {
    return {
      enabled: this.autoRefreshEnabled,
      lastRefresh: this.lastRefreshTime,
      inProgress: this.refreshInProgress,
    };
  }

  async toggleAutoRefresh(enabled: boolean): Promise<void> {
    this.autoRefreshEnabled = enabled;
    console.log('Auto-refresh turned', enabled ? 'ON' : 'OFF');
  }

  // ======================== Listener System ========================
  onRefresh(callback: () => void): () => void {
    this.refreshListeners.add(callback);
    return () => this.refreshListeners.delete(callback);
  }

  onExpensesUpdate(callback: (expenses: Expense[]) => void): () => void {
    this.expenseListeners.add(callback);
    return () => this.expenseListeners.delete(callback);
  }

  onAnalysisUpdate(callback: (analysis: ExpenseAnalysis) => void): () => void {
    this.analysisListeners.add(callback);
    return () => this.analysisListeners.delete(callback);
  }

  onRecurringExpensesUpdate(callback: (expenses: Expense[]) => void): () => void {
    this.recurringListeners.add(callback);
    return () => this.recurringListeners.delete(callback);
  }

  private notifyRefresh(): void {
    this.refreshListeners.forEach(cb => {
      try { cb(); } catch (_) {}
    });
  }

  private notifyExpenseUpdate(expenses: Expense[]): void {
    this.expenseListeners.forEach(cb => {
      try { cb(expenses); } catch (_) {}
    });
  }

  private notifyAnalysisUpdate(analysis: ExpenseAnalysis): void {
    this.analysisListeners.forEach(cb => {
      try { cb(analysis); } catch (_) {}
    });
  }

  private notifyRecurringUpdate(expenses: Expense[]): void {
    this.recurringListeners.forEach(cb => {
      try { cb(expenses); } catch (_) {}
    });
  }

  // ======================== Core Refresh Logic ========================
  private async refreshAllExpenseData(): Promise<void> {
    try {
      // Fetch fresh expenses
      const expensesRes = await this.getExpenses({ page: 1, limit: 2000 });
      const allExpenses: Expense[] = expensesRes.success ? (expensesRes.data || []) : [];

      this.notifyExpenseUpdate(allExpenses);

      // Fetch analysis
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const analysisRes = await this.getExpenseAnalysis({ startDate, endDate });
      if (analysisRes.success && analysisRes.data) {
        this.notifyAnalysisUpdate(analysisRes.data);
      }

      // Notify recurring
      this.notifyRecurringUpdate(allExpenses.filter(e => e.recurring));

      console.log('All accounting data refreshed');
    } catch (error) {
      console.error('Failed to refresh all data:', error);
      throw error;
    }
  }

  // ======================== API Methods ========================
  async getExpenses(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    category?: string;
    status?: string;
  }) {
    return withErrorHandling(async () => {
      const query = params ? new URLSearchParams(params as any).toString() : '';
      const res = await fetch(`${this.baseURL}/expenses?${query}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      
      // Notify listeners of fresh data
      const data = json.data || json;
      if (Array.isArray(data)) {
        this.notifyExpenseUpdate(data);
      }
      return json;
    }, 'Failed to load expenses');
  }

  async createExpense(data: CreateExpenseRequest) {
    return withErrorHandling(async () => {
      const res = await fetch(`${this.baseURL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create expense');
      }
      const json = await res.json();
      
      // Refresh all data after creation
      await this.refreshAllExpenseData();
      return json;
    }, 'Failed to create expense');
  }

  async updateExpense(id: number, updates: Partial<Expense>) {
    return withErrorHandling(async () => {
      const res = await fetch(`${this.baseURL}/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Update failed');
      const json = await res.json();
      
      // Refresh all data after update
      await this.refreshAllExpenseData();
      return json;
    }, 'Failed to update expense');
  }

  async deleteExpense(id: number) {
    return withErrorHandling(async () => {
      const res = await fetch(`${this.baseURL}/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await res.json();

      // Refresh all data after deletion
      await this.refreshAllExpenseData();
      return { success: true };
    }, 'Failed to delete expense');
  }

  async getExpenseAnalysis(params: { startDate: string; endDate: string }) {
    return withErrorHandling(async () => {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${this.baseURL}/expenses/analysis?${query}`);
      if (!res.ok) throw new Error('Analysis failed');
      const json = await res.json();
      const data = json.data || json;

      // Notify listeners
      this.notifyAnalysisUpdate(data);
      return json;
    }, 'Failed to load analysis');
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    return withErrorHandling(async () => {
      const res = await fetch(`${this.baseURL}/dashboard/summary`);
      if (!res.ok) throw new Error('Failed to load dashboard summary');
      const json = await res.json();
      return json.data || json;
    }, 'Failed to load dashboard summary');
  }

  async getProfitLoss(startDate: string, endDate: string): Promise<ProfitLossData> {
    return withErrorHandling(async () => {
      const query = new URLSearchParams({ startDate, endDate }).toString();
      const res = await fetch(`${this.baseURL}/reports/profit-loss?${query}`);
      if (!res.ok) throw new Error('Failed to load profit/loss report');
      const json = await res.json();
      return json.data || json;
    }, 'Failed to load profit/loss report');
  }

  // ======================== Utility Methods ========================
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  validateExpense(data: CreateExpenseRequest) {
    const errors: string[] = [];
    if (!data.expense_date) errors.push('Date is required');
    if (!data.description?.trim()) errors.push('Description is required');
    if (!data.amount || data.amount <= 0) errors.push('Valid amount required');
    if (!data.category) errors.push('Category is required');
    if (!data.payment_method) errors.push('Payment method required');
    return { isValid: errors.length === 0, errors };
  }

  getExpenseCategories() {
    return ['Rent', 'Salaries', 'Utilities', 'Supplies', 'Marketing', 'Transportation', 'Professional Fees', 'Insurance', 'Maintenance', 'Office Supplies', 'Taxes', 'Other'];
  }

  getPaymentMethods() {
    return ['Cash', 'Bank Transfer', 'Mobile Money', 'Credit Card', 'Cheque', 'Other'];
  }

  getExpenseStatusOptions() {
    return ['Pending', 'Paid', 'Overdue', 'Cancelled'];
  }

  getRecurringFrequencyOptions() {
    return ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];
  }
}

// Export singleton
export const accountsService = new AccountsService();
export default accountsService;