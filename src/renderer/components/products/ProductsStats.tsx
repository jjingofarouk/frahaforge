import React from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, Thermometer, Clock, DollarSign, Pill, Shield, Snowflake, Info } from 'lucide-react';
import { ProductStats } from '../../types/products.types';
import './ProductsStats.css';

interface ProductsStatsProps {
  stats: ProductStats;
}

type TrendType = 'up' | 'down' | 'neutral';

export const ProductsStats: React.FC<ProductsStatsProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === 0) return 'UGX 0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const statCards: Array<{
    title: string;
    value: string;
    icon: any;
    color: string;
    trend: TrendType;
    description?: string;
    showInfo?: boolean;
  }> = [
    {
      title: 'Total Inventory Value',
      value: formatCurrency(stats.totalInventoryValue),
      icon: Package,
      color: 'blue',
      trend: 'up',
      description: `Based on ${formatNumber(stats.productsWithCostPrice)} products with cost data`,
      showInfo: true
    },
    {
      title: 'Total Cost Value',
      value: formatCurrency(stats.totalCostValue),
      icon: DollarSign,
      color: 'gray',
      trend: 'neutral',
      description: `From ${formatNumber(stats.productsWithCostPrice)} products`,
      showInfo: true
    },
    {
      title: 'Potential Profit',
      value: formatCurrency(stats.totalPotentialProfit),
      icon: DollarSign,
      color: 'green',
      trend: 'up',
      description: `From ${formatNumber(stats.productsWithCostPrice)} products`,
      showInfo: true
    },
    {
      title: 'Low Stock Items',
      value: formatNumber(stats.lowStockCount),
      icon: AlertTriangle,
      color: 'yellow',
      trend: stats.lowStockCount > 0 ? 'down' : 'neutral'
    },
    {
      title: 'Out of Stock',
      value: formatNumber(stats.outOfStockCount),
      icon: Thermometer,
      color: 'red',
      trend: stats.outOfStockCount > 0 ? 'down' : 'neutral'
    },
    {
      title: 'Expiring Soon',
      value: formatNumber(stats.expiringSoonCount),
      icon: Clock,
      color: 'orange',
      trend: stats.expiringSoonCount > 0 ? 'down' : 'neutral'
    },
    {
      title: 'Prescription Drugs',
      value: formatNumber(stats.prescriptionProducts),
      icon: Pill,
      color: 'purple',
      trend: 'neutral'
    },
    {
      title: 'Controlled Substances',
      value: formatNumber(stats.controlledSubstances),
      icon: Shield,
      color: 'indigo',
      trend: 'neutral'
    }
  ];

  const getTrendColor = (trend: TrendType) => {
    switch (trend) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTrendIcon = (trend: TrendType) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const costCoveragePercentage = stats.totalProducts > 0 
    ? Math.round((stats.productsWithCostPrice / stats.totalProducts) * 100)
    : 0;

  return (
    <motion.div 
      className="products-stats"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Cost Coverage Alert */}
      {costCoveragePercentage < 100 && (
        <motion.div 
          className="cost-coverage-alert"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Info size={16} />
          <span>
            <strong>Cost Data Coverage: {costCoveragePercentage}%</strong> - 
            {stats.productsWithCostPrice} of {stats.totalProducts} products have cost price data.
            {costCoveragePercentage < 50 && ' Consider adding cost prices for accurate inventory valuation.'}
          </span>
        </motion.div>
      )}

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            className={`stat-card stat-card-${stat.color}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="stat-header">
              <div className={`stat-icon stat-icon-${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div className="stat-header-right">
                {stat.showInfo && (
                  <div className="stat-info-icon" title={stat.description}>
                    <Info size={14} />
                  </div>
                )}
                <div className="stat-trend" style={{ color: getTrendColor(stat.trend) }}>
                  {getTrendIcon(stat.trend)}
                </div>
              </div>
            </div>
            
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-title">{stat.title}</div>
              {stat.description && (
                <div className="stat-description">
                  {stat.description}
                </div>
              )}
            </div>

            {/* Progress bar for critical stats */}
            {(stat.title.includes('Low Stock') || stat.title.includes('Out of Stock') || stat.title.includes('Expiring')) && (
              <div className="stat-progress">
                <div 
                  className={`stat-progress-bar stat-progress-${stat.color}`}
                  style={{ 
                    width: `${Math.min(100, (Number(stat.value.replace(/,/g, '')) / stats.totalProducts) * 100)}%` 
                  }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Enhanced Summary Bar */}
      <div className="stats-summary">
        <div className="summary-item">
          <span className="summary-label">Total Products:</span>
          <span className="summary-value">{formatNumber(stats.totalProducts)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">With Cost Data:</span>
          <span className={`summary-value ${costCoveragePercentage === 100 ? 'success' : costCoveragePercentage >= 80 ? 'warning' : 'danger'}`}>
            {formatNumber(stats.productsWithCostPrice)} ({costCoveragePercentage}%)
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Profit Margin:</span>
          <span className="summary-value profit">
            {stats.totalCostValue > 0 
              ? `${((stats.totalPotentialProfit / stats.totalCostValue) * 100).toFixed(1)}%`
              : 'N/A'
            }
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Alert Items:</span>
          <span className="summary-value warning">
            {stats.lowStockCount + stats.outOfStockCount + stats.expiringSoonCount}
          </span>
        </div>
      </div>
    </motion.div>
  );
};