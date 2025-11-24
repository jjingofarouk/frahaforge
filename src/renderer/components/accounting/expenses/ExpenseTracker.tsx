// src/renderer/src/components/accounting/ExpenseTracker.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  AlertCircle,
  Loader2,
  Building,
  Plus,
  Target,
  TrendingDown,
  Lightbulb,
  Zap
} from 'lucide-react';
import ModernHeader from '../ModernHeader';
import ExpenseForm from './ExpenseForm';
import { accountsService, Expense } from '../../../services/accountsService';
import { format, startOfDay, endOfDay, isSameDay, isSameMonth } from 'date-fns';
import { useUltraFastAccountingStore } from '../../../src/stores/ultraFastAccountingStore';
import { 
  getExpenseEfficiencyMessage, 
  getExpenseTrendMessage, 
  getCategoryInsightMessage,
  getExpenseOptimizationSuggestion
} from './expenseIntelligence';
import './ExpenseTracker.css';

interface ExpenseTrackerProps {}

interface SummaryStats {
  totalExpenses: number;
  expenseCount: number;
  averageExpense: number;
  topCategory?: string;
  categoryBreakdown: Record<string, number>;
  efficiencyScore: number;
}

const ExpenseTracker: React.FC<ExpenseTrackerProps> = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  // Get date range from global store
  const store = useUltraFastAccountingStore();
  const dateRange = store.currentDateRange;

  // Convert dates to strings for API call
  const startDate = format(dateRange.start, 'yyyy-MM-dd');
  const endDate = format(dateRange.end, 'yyyy-MM-dd');

  // Fetch expenses when date range changes
  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching expenses for:', { startDate, endDate });

      const response = await accountsService.getExpenses({
        startDate,
        endDate,
        limit: 1000,
      });

      if (response.success && Array.isArray(response.data)) {
        // Filter out recurring expenses and ensure they're within the date range
        const filtered = response.data.filter((e: Expense) => {
          const expenseDate = new Date(e.expense_date);
          return !e.recurring && 
                 expenseDate >= dateRange.start && 
                 expenseDate <= dateRange.end;
        });
        console.log(`Found ${filtered.length} expenses for the selected range`);
        setExpenses(filtered);
      } else {
        console.log('No data found');
        setExpenses([]);
      }
    } catch (err: any) {
      console.error('Error fetching expenses:', err);
      setError(err.message || 'Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseCreated = () => {
    setShowExpenseForm(false);
    // Refresh the expenses list
    fetchExpenses();
  };

  const handleCancelExpense = () => {
    setShowExpenseForm(false);
  };

  // Enhanced summary stats with intelligent metrics
  const stats = useMemo<SummaryStats>(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const count = expenses.length;
    const avg = count > 0 ? total / count : 0;

    const categoryMap = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    // Calculate efficiency score (0-100)
    const efficiencyScore = calculateEfficiencyScore(expenses, total, count);

    return {
      totalExpenses: total,
      expenseCount: count,
      averageExpense: avg,
      topCategory,
      categoryBreakdown: categoryMap,
      efficiencyScore
    };
  }, [expenses]);

  // Intelligent messages based on expense patterns
  const intelligentMessages = useMemo(() => {
    return {
      efficiency: getExpenseEfficiencyMessage(stats.efficiencyScore, stats.totalExpenses),
      trend: getExpenseTrendMessage(stats.averageExpense, stats.expenseCount),
      category: getCategoryInsightMessage(stats.topCategory, stats.categoryBreakdown),
      optimization: getExpenseOptimizationSuggestion(stats)
    };
  }, [stats]);

  // Dynamic subtitle with intelligent insights
  const displayText = useMemo(() => {
    if (loading) return { subtitle: 'Analyzing expense patterns...', empty: '' };

    const count = expenses.length;
    const total = stats.totalExpenses;
    const formatted = new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(total);

    let subtitle = '';
    let emptyMessage = '';

    if (count === 0) {
      if (isSameDay(dateRange.start, dateRange.end)) {
        emptyMessage = 'No expenses recorded today - efficient operations maintained';
        subtitle = 'Optimal cost control • No expenses today';
      } else {
        emptyMessage = `No expenses found from ${format(dateRange.start, 'dd MMM')} – ${format(dateRange.end, 'dd MMM yyyy')}`;
        subtitle = `Cost efficiency maintained • ${format(dateRange.start, 'dd MMM')} – ${format(dateRange.end, 'dd MMM yyyy')}`;
      }
    } else {
      const efficiencyBadge = stats.efficiencyScore > 75 ? '• High Efficiency' : stats.efficiencyScore > 50 ? '• Good Control' : '• Review Recommended';
      
      if (isSameDay(dateRange.start, dateRange.end)) {
        subtitle = `${count} expense${count > 1 ? 's' : ''} today • ${formatted} total ${efficiencyBadge}`;
      } else if (isSameMonth(dateRange.start, dateRange.end)) {
        subtitle = `${count} expense${count > 1 ? 's' : ''} in ${format(dateRange.start, 'MMMM yyyy')} • ${formatted} total ${efficiencyBadge}`;
      } else {
        subtitle = `${count} expense${count > 1 ? 's' : ''} • ${format(dateRange.start, 'dd MMM')} – ${format(dateRange.end, 'dd MMM yyyy')} • ${formatted} total ${efficiencyBadge}`;
      }
    }

    return { subtitle, emptyMessage };
  }, [expenses, dateRange, loading, stats]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);

  const statCards = [
    {
      label: 'Total Expenses',
      value: formatCurrency(stats.totalExpenses),
      icon: DollarSign,
      description: intelligentMessages.efficiency,
      color: 'var(--card-orange)',
      iconColor: 'var(--icon-orange)',
      trend: stats.totalExpenses > 0 ? 'analysis' : 'neutral'
    },
    {
      label: 'Transactions',
      value: stats.expenseCount.toString(),
      icon: Receipt,
      description: intelligentMessages.trend,
      color: 'var(--card-blue)',
      iconColor: 'var(--icon-blue)',
      trend: stats.expenseCount > 10 ? 'active' : 'moderate'
    },
    {
      label: 'Average Expense',
      value: formatCurrency(stats.averageExpense),
      icon: TrendingUp,
      description: `Per transaction analysis`,
      color: 'var(--card-purple)',
      iconColor: 'var(--icon-purple)',
      trend: stats.averageExpense > 500000 ? 'premium' : 'standard'
    },
    {
      label: 'Top Category',
      value: stats.topCategory || 'N/A',
      icon: Building,
      description: intelligentMessages.category,
      color: 'var(--card-teal)',
      iconColor: 'var(--icon-teal)',
      trend: 'insight'
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
    hover: { y: -6, scale: 1.02 },
    tap: { scale: 0.98 },
  };

  const handleExport = () => {
    const csv = [
      ['Date', 'Description', 'Amount', 'Category', 'Payment Method', 'Vendor', 'Status'],
      ...expenses.map((e) => [
        format(new Date(e.expense_date), 'dd MMM yyyy'),
        e.description,
        e.amount,
        e.category,
        e.payment_method,
        e.vendor_name || '-',
        e.status,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${startDate}_to_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <motion.div className="error-alert" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <AlertCircle size={20} />
        <span>{error}</span>
      </motion.div>
    );
  }

  return (
    <div className="expense-tracker">
      <ModernHeader
        dateRange={dateRange}
        onDateRangeChange={store.setDateRange}
        onExport={handleExport}
        transactionCount={expenses.length}
        loading={loading}
        title="Expense Intelligence"
        subtitle={displayText.subtitle}
      />

      {/* Intelligence Header */}
      {!loading && expenses.length > 0 && (
        <motion.div 
          className="expense-intelligence-bar"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="intelligence-content">
            <div className="efficiency-score">
              <Zap size={16} />
              <span>Efficiency Score: {Math.round(stats.efficiencyScore)}%</span>
              {stats.efficiencyScore > 75 && <span className="score-badge excellent">Excellent</span>}
              {stats.efficiencyScore > 50 && stats.efficiencyScore <= 75 && <span className="score-badge good">Good</span>}
              {stats.efficiencyScore <= 50 && <span className="score-badge needs-improvement">Needs Improvement</span>}
            </div>
            
            {intelligentMessages.optimization && (
              <div className="optimization-suggestion">
                <Lightbulb size={16} />
                <span>{intelligentMessages.optimization}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Action Bar */}
      <div className="expense-actions">
        <motion.button
          className="add-expense-btn"
          onClick={() => setShowExpenseForm(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={16} />
          Add Expense
        </motion.button>

        {expenses.length > 0 && (
          <div className="expense-insights">
            <Target size={14} />
            <span>{expenses.length} transactions analyzed</span>
          </div>
        )}
      </div>

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div className="expense-form-modal">
          <div className="expense-form-overlay" onClick={() => setShowExpenseForm(false)} />
          <motion.div
            className="expense-form-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <ExpenseForm
              onSuccess={handleExpenseCreated}
              onCancel={handleCancelExpense}
            />
          </motion.div>
        </div>
      )}

      {/* Summary Cards */}
      <motion.div className="stats-grid" variants={containerVariants} initial="hidden" animate="visible">
        {statCards.map((stat) => (
          <motion.div
            key={stat.label}
            className="stat-card"
            style={{ backgroundColor: stat.color }}
            variants={cardVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <div className="stat-card__header">
              <motion.div className="stat-card__icon-wrapper" style={{ color: stat.iconColor }}>
                <stat.icon size={20} />
              </motion.div>
              <span className="stat-card__label">{stat.label}</span>
              {stat.trend && (
                <span className={`trend-indicator trend-${stat.trend}`}>
                  {stat.trend}
                </span>
              )}
            </div>
            <motion.div className="stat-card__value">
              {stat.value}
            </motion.div>
            <div className="stat-card__footer">
              <span className="stat-card__description">{stat.description}</span>
            </div>
            <motion.div className="stat-card__decoration" />
          </motion.div>
        ))}
      </motion.div>

      {/* Table or Empty/Loading State */}
      {loading ? (
        <div className="loading-container">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <Loader2 size={32} color="#0d9488" />
          </motion.div>
          <p>Analyzing expense patterns...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="empty-state">
          <TrendingDown size={48} color="#9CA3AF" />
          <p>{displayText.emptyMessage}</p>
          <motion.button
            className="add-expense-btn empty-state-btn"
            onClick={() => setShowExpenseForm(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={16} />
            Record First Expense
          </motion.button>
        </div>
      ) : (
        <div className="expense-table-container">
          <table className="expense-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Vendor</th>
                <th>Method</th>
                <th className="amount">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <motion.tr
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
                >
                  <td>{format(new Date(expense.expense_date), 'dd MMM yyyy')}</td>
                  <td className="description">{expense.description}</td>
                  <td><span className="category-tag">{expense.category}</span></td>
                  <td>{expense.vendor_name || '-'}</td>
                  <td>
                    <span className={`payment-method ${expense.payment_method.toLowerCase().replace(/ /g, '-')}`}>
                      {expense.payment_method === 'Mobile Money' ? 'Momo' : expense.payment_method}
                    </span>
                  </td>
                  <td className="amount">{formatCurrency(expense.amount)}</td>
                  <td>
                    <span className={`status-badge status-${expense.status.toLowerCase()}`}>
                      {expense.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Calculate expense efficiency score (0-100)
const calculateEfficiencyScore = (expenses: Expense[], totalExpenses: number, count: number): number => {
  if (count === 0) return 100; // No expenses = perfect efficiency
  
  let score = 100;
  
  // Penalize for high average expense
  const avgExpense = totalExpenses / count;
  if (avgExpense > 1000000) score -= 30;
  else if (avgExpense > 500000) score -= 15;
  else if (avgExpense > 100000) score -= 5;
  
  // Bonus for good category distribution
  const categoryCount = new Set(expenses.map(e => e.category)).size;
  if (categoryCount >= 5) score += 10;
  
  // Penalize for pending/overdue expenses
  const problematicExpenses = expenses.filter(e => e.status === 'pending' || e.status === 'overdue').length;
  score -= (problematicExpenses / count) * 20;
  
  return Math.max(0, Math.min(100, score));
};

export default ExpenseTracker;