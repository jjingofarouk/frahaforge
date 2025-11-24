// src/renderer/components/accounting/dashboard/DashboardOverview.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { transactionsService, Transaction } from '../../../services/transactionsService';
import { accountsService, Expense } from '../../../services/accountsService';
import { getProfitMessage, getRevenueMessage, getExpenseMessage } from './dashboardMessages';
import './DashboardOverview.css';

interface DashboardOverviewProps {
  startDate: string;
  endDate: string;
  transactions: Transaction[];
  expenses: Expense[];
  loading: boolean;
}

interface PercentageChange {
  value: number;
  trend: 'up' | 'down' | 'neutral';
}

interface StatCard {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  change: PercentageChange;
  description: string;
  color: string;
  iconColor: string;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
  startDate, 
  endDate, 
  transactions = [], 
  expenses = [], 
  loading 
}) => {
  const [productSales, setProductSales] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Check if it's today's view
  const isTodayView = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return startDate === today && endDate === today;
  }, [startDate, endDate]);

  // Fetch product sales data
  const fetchProductSales = async () => {
    try {
      const data = await transactionsService.getProductSalesPerformance({
        startDate,
        endDate,
        limit: 1000
      });
      setProductSales(data || []);
    } catch (err) {
      console.error('Error fetching product sales:', err);
      setProductSales([]);
    }
  };

  // Calculate expenses from props
  useEffect(() => {
    if (expenses && expenses.length > 0) {
      const sum = expenses.reduce((total: number, expense: Expense) => total + expense.amount, 0);
      setTotalExpenses(sum);
    } else {
      setTotalExpenses(0);
    }
  }, [expenses]);

  // Load product sales when dates change
  useEffect(() => {
    if (!loading) {
      fetchProductSales();
      setLastUpdate(new Date());
    }
  }, [startDate, endDate, loading]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalRevenue = productSales.reduce((sum, product) => sum + product.totalRevenue, 0);
    const totalTransactions = transactions?.length || 0;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalTransactions,
      totalProducts: productSales.length,
      netProfit,
      profitMargin
    };
  }, [productSales, totalExpenses, transactions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchProductSales();
      setLastUpdate(new Date());
    } finally {
      setRefreshing(false);
    }
  };

  // Dynamic messages
  const dynamicMessages = useMemo(() => {
    return {
      profit: getProfitMessage(summaryStats.netProfit, summaryStats.profitMargin),
      revenue: getRevenueMessage(summaryStats.totalRevenue),
      expense: getExpenseMessage(totalExpenses)
    };
  }, [summaryStats.netProfit, summaryStats.profitMargin, summaryStats.totalRevenue, totalExpenses]);

  const statsCards: StatCard[] = [
    {
      label: isTodayView ? "Today's Revenue" : 'Total Revenue',
      value: accountsService.formatCurrency(summaryStats.totalRevenue),
      icon: DollarSign,
      change: { value: 0, trend: 'neutral' },
      description: dynamicMessages.revenue,
      color: 'var(--card-green)',
      iconColor: 'var(--icon-green)'
    },
    {
      label: isTodayView ? "Today's Expenses" : 'Total Expenses',
      value: accountsService.formatCurrency(totalExpenses),
      icon: TrendingDown,
      change: { value: 0, trend: 'neutral' },
      description: dynamicMessages.expense,
      color: 'var(--card-orange)',
      iconColor: 'var(--icon-orange)'
    },
    {
      label: isTodayView ? "Today's Profit" : 'Net Profit',
      value: accountsService.formatCurrency(summaryStats.netProfit),
      icon: TrendingUp,
      change: { 
        value: Math.abs(Math.round(summaryStats.profitMargin)), 
        trend: summaryStats.netProfit >= 0 ? 'up' : 'down' 
      },
      description: dynamicMessages.profit,
      color: summaryStats.netProfit >= 0 ? 'var(--card-teal)' : 'var(--card-red)',
      iconColor: summaryStats.netProfit >= 0 ? 'var(--icon-teal)' : 'var(--icon-red)'
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
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    hover: {
      y: -6,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.2,
      }
    }
  };

  const iconVariants: Variants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.5,
        ease: [0.34, 1.56, 0.64, 1],
      }
    },
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: {
        duration: 0.3,
      }
    }
  };

  const valueVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        delay: 0.2,
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboard-overview">
        <div className="stats-grid">
          {statsCards.map((_, i) => (
            <div key={i} className="stat-card stat-card--loading">
              <div className="stat-card__header">
                <div className="stat-card__icon-wrapper"></div>
                <div className="stat-card__label"></div>
              </div>
              <div className="stat-card__value"></div>
              <div className="stat-card__footer">
                <div className="stat-card__description"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      <motion.div 
        className="dashboard-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <div className="header-text">
            <h1 className="header-title">
              {isTodayView ? "Today's Performance" : 'Financial Overview'}
            </h1>
            <p className="header-subtitle">
              {summaryStats.totalTransactions} transactions • {summaryStats.totalProducts} products • {expenses.length} expenses
            </p>
          </div>
          <div className="header-actions">
            <div className="live-status">
              <div className="live-indicator">
                <div className="live-dot"></div>
                <span>Live</span>
              </div>
              <span className="update-time">
                Updated {lastUpdate.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <motion.button
              className="refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
              Refresh
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="stats-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {statsCards.map((stat) => (
          <motion.div
            key={stat.label}
            className="stat-card"
            style={{ backgroundColor: stat.color }}
            variants={cardVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <div className="stat-card__header">
              <motion.div
                className="stat-card__icon-wrapper"
                style={{ color: stat.iconColor }}
                variants={iconVariants}
              >
                <stat.icon size={20} />
              </motion.div>
              <span className="stat-card__label">{stat.label}</span>
            </div>
            
            <motion.div 
              className="stat-card__value"
              variants={valueVariants}
            >
              {stat.value}
            </motion.div>
            
            <div className="stat-card__footer">
              <span className="stat-card__description">{stat.description}</span>
              {stat.change.value > 0 && (
                <motion.div 
                  className={`stat-card__change stat-card__change--${stat.change.trend}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {stat.change.trend === 'up' ? (
                    <ArrowUpRight size={12} />
                  ) : stat.change.trend === 'down' ? (
                    <ArrowDownRight size={12} />
                  ) : null}
                  <span>{stat.change.value}%</span>
                </motion.div>
              )}
            </div>

            <div className="stat-card__decoration" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default DashboardOverview;