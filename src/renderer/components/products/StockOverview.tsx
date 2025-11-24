// src/renderer/src/components/StockOverview.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  Package, 
  Plus, 
  RefreshCw, 
  AlertTriangle, 
  Thermometer, 
  Clock, 
  DollarSign, 
  AlertCircle,
  Flame,
  ThumbsUp,
  Calendar,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { stockService, StockProduct, StockStats } from '../../services/stockService';
import { generateStockAlerts } from './StockIntelligence';
import './StockOverview.css';

interface StockOverviewProps {
  products: StockProduct[];
  stats: StockStats | null;
  onRefresh: () => void;
  onAddProduct: () => void;
  loading: boolean;
  onOpenLowStockModal: (products: StockProduct[], stockType: 'low-stock' | 'out-of-stock') => void;
  onOpenExpiryModal: (products: StockProduct[], expiryType: 'expiring-soon' | 'expired') => void;
  expiringSoonProducts: StockProduct[];
  expiredProducts: StockProduct[];
  autoRefreshEnabled?: boolean;
  onAutoRefreshToggle?: (enabled: boolean) => void;
  lastRefresh?: Date | null;
}

// Local StockAlert type for component compatibility
interface ComponentStockAlert {
  type: 'critical' | 'warning' | 'info' | 'success';
  message: string;
  suggestion?: string;
  priority: number;
}

type HeaderStatus = 'healthy' | 'low' | 'warning' | 'critical';

export const StockOverview: React.FC<StockOverviewProps> = ({
  products,
  stats,
  onRefresh,
  onAddProduct,
  loading,
  onOpenLowStockModal,
  onOpenExpiryModal,
  expiringSoonProducts,
  expiredProducts,
  autoRefreshEnabled = true,
  onAutoRefreshToggle,
  lastRefresh
}) => {
  const [currentAlert, setCurrentAlert] = useState<ComponentStockAlert | null>(null);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [isBlinking, setIsBlinking] = useState(false);

  // Blinking animation for real-time indicator
  useEffect(() => {
    if (lastRefresh) {
      setIsBlinking(true);
      const timer = setTimeout(() => setIsBlinking(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastRefresh]);

  // Load stock alerts from service
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const alerts = await stockService.getStockAlerts();
        setStockAlerts(alerts);
      } catch (error) {
        console.error('Failed to load stock alerts:', error);
      }
    };

    loadAlerts();
  }, [products]);

  // Memoized calculations using stock service data structure
  const { lowStockProducts, outOfStockProducts, criticalStockProducts } = useMemo(() => {
    const lowStock = products.filter(product => {
      const minStock = parseInt(product.min_stock || '0') || 5;
      return product.quantity <= minStock && product.quantity > 0;
    });
    
    const outOfStock = products.filter(product => product.quantity === 0);
    const criticalStock = lowStock.filter(product => product.quantity <= 3 && product.quantity > 0);

    return {
      lowStockProducts: lowStock,
      outOfStockProducts: outOfStock,
      criticalStockProducts: criticalStock
    };
  }, [products]);

  // Overall status calculation
  const headerStatus = useMemo((): HeaderStatus => {
    const hasOutOfStock = outOfStockProducts.length > 0;
    const hasCriticalStock = criticalStockProducts.length > 0;
    const hasExpired = expiredProducts.length > 0;
    const hasExpiringSoon = expiringSoonProducts.length > 0;

    if (lowStockProducts.length === 0 && !hasExpired && !hasExpiringSoon) return 'healthy';
    if (hasOutOfStock || hasExpired) return 'critical';
    if (hasCriticalStock || hasExpiringSoon) return 'warning';
    return 'low';
  }, [lowStockProducts.length, outOfStockProducts.length, criticalStockProducts.length, expiredProducts.length, expiringSoonProducts.length]);

  const statusConfig = useMemo(() => {
    const config: Record<HeaderStatus, { 
      icon: React.ReactElement; 
      bgColor: string; 
      textColor: string;
      borderColor: string;
      label: string;
    }> = {
      healthy: { 
        icon: <ThumbsUp size={16} />, 
        bgColor: 'var(--success)',
        textColor: 'white',
        borderColor: 'var(--success-dark)',
        label: 'Healthy'
      },
      low: { 
        icon: <AlertTriangle size={16} />, 
        bgColor: 'var(--warning)',
        textColor: 'white',
        borderColor: 'var(--warning-dark)',
        label: 'Needs Attention'
      },
      warning: { 
        icon: <AlertCircle size={16} />, 
        bgColor: 'var(--warning)',
        textColor: 'white',
        borderColor: 'var(--warning-dark)',
        label: 'Urgent Attention'
      },
      critical: { 
        icon: <Flame size={16} />, 
        bgColor: 'var(--danger)',
        textColor: 'white',
        borderColor: 'var(--danger-dark)',
        label: 'Critical Action'
      }
    };
    return config[headerStatus];
  }, [headerStatus]);

  const statusMessage = useMemo(() => {
    const totalIssues = lowStockProducts.length + expiringSoonProducts.length + expiredProducts.length;
    
    const messages: Record<HeaderStatus, string> = {
      healthy: `All ${products.length} products are properly stocked`,
      low: `${totalIssues} products need attention`,
      warning: `${totalIssues} products need urgent attention`,
      critical: `${totalIssues} critical issues need immediate action`
    };
    return messages[headerStatus];
  }, [headerStatus, products.length, lowStockProducts.length, expiringSoonProducts.length, expiredProducts.length]);

  // Format helpers with rounding to nearest hundreds for Ugandan currency
  const formatCurrency = (amount: number) => {
    // Round to nearest hundreds (UGX smallest denomination is 100)
    const roundedAmount = Math.round(amount / 100) * 100;
    return `UGX ${roundedAmount.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Calculate rounded inventory value for stats
  const roundedInventoryValue = useMemo(() => {
    if (!stats?.totalInventoryValue) return 0;
    return Math.round(stats.totalInventoryValue / 100) * 100;
  }, [stats?.totalInventoryValue]);

  // Stats configuration - using actual stats from service
  const statItems = useMemo(() => [
    { 
      label: 'Total Products', 
      value: formatNumber(stats?.totalProducts || 0), 
      icon: Package,
      clickable: false,
      color: 'var(--card-blue)',
      iconColor: 'var(--icon-blue)',
      description: 'All products in inventory'
    },
    { 
      label: 'Low Stock', 
      value: formatNumber(lowStockProducts.length - outOfStockProducts.length), 
      icon: AlertTriangle,
      clickable: true, 
      onClick: () => onOpenLowStockModal(lowStockProducts.filter(p => p.quantity > 0), 'low-stock'),
      badge: (lowStockProducts.length - outOfStockProducts.length) > 0 ? 'Action' : undefined,
      color: 'var(--card-orange)',
      iconColor: 'var(--icon-orange)',
      description: 'Stock below threshold'
    },
    { 
      label: 'Out of Stock', 
      value: formatNumber(outOfStockProducts.length), 
      icon: Thermometer,
      clickable: true, 
      onClick: () => onOpenLowStockModal(outOfStockProducts, 'out-of-stock'),
      badge: outOfStockProducts.length > 0 ? 'Critical' : undefined,
      color: 'var(--card-red)',
      iconColor: 'var(--icon-red)',
      description: 'Zero stock items'
    },
    { 
      label: 'Expiring Soon', 
      value: formatNumber(expiringSoonProducts.length), 
      icon: Clock,
      clickable: true, 
      onClick: () => onOpenExpiryModal(expiringSoonProducts, 'expiring-soon'),
      badge: expiringSoonProducts.length > 0 ? 'Action' : undefined,
      color: 'var(--card-gold)',
      iconColor: 'var(--icon-gold)',
      description: 'Near expiry date'
    },
    { 
      label: 'Expired', 
      value: formatNumber(expiredProducts.length), 
      icon: Calendar,
      clickable: true, 
      onClick: () => onOpenExpiryModal(expiredProducts, 'expired'),
      badge: expiredProducts.length > 0 ? 'Critical' : undefined,
      color: 'var(--card-red)',
      iconColor: 'var(--icon-red)',
      description: 'Past expiry date'
    },
    { 
      label: 'Inventory Value', 
      value: stats ? formatCurrency(stats.totalInventoryValue) : 'UGX 0', 
      icon: DollarSign,
      clickable: false,
      color: 'var(--card-green)',
      iconColor: 'var(--icon-green)',
      description: 'Total stock value'
    },
  ], [stats, lowStockProducts, outOfStockProducts, expiringSoonProducts, expiredProducts, onOpenLowStockModal, onOpenExpiryModal]);

  // AI Intelligence alerts - using legacy alerts for compatibility
  useEffect(() => {
    const legacyAlerts = generateStockAlerts({
      lowStockProducts,
      outOfStockProducts,
      criticalStockProducts,
      expiredProducts,
      expiringSoonProducts,
      totalProducts: products.length,
      totalInventoryValue: stats?.totalInventoryValue || 0
    });

    if (legacyAlerts.length > 0) {
      setCurrentAlert(legacyAlerts[0]);
      const timer = setTimeout(() => {
        setCurrentAlert(null);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [lowStockProducts, outOfStockProducts, criticalStockProducts, expiredProducts, expiringSoonProducts, products.length, stats?.totalInventoryValue]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
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

  return (
    <div className="stock-overview">
      {/* AI Alert Toast */}
      {currentAlert && (
        <motion.div
          className="so-ai-alert"
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          style={{ 
            backgroundColor: currentAlert.type === 'critical' ? 'var(--card-red)' : 
                           currentAlert.type === 'warning' ? 'var(--card-gold)' : 'var(--card-blue)'
          }}
        >
          <div className="so-ai-alert-header">
            <motion.div
              className="so-ai-alert-icon"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles size={16} />
            </motion.div>
            <span className="so-ai-alert-title">AI Stock Insight</span>
            <motion.button
              className="so-ai-alert-close"
              onClick={() => setCurrentAlert(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>
          </div>
          <p className="so-ai-alert-message">{currentAlert.message}</p>
          {currentAlert.suggestion && (
            <p className="so-ai-alert-suggestion">{currentAlert.suggestion}</p>
          )}
        </motion.div>
      )}

      {/* Header - Compact Design */}
      <motion.div 
        className="so-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="so-header-main">
          <div className="so-header-title-section">
            <h1 className="so-header-title">Stock Overview</h1>
            {lastRefresh && (
              <div className="so-last-refresh-container">
                <span className={`so-last-refresh ${isBlinking ? 'so-blinking' : ''}`}>
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
                <span className="so-realtime-indicator">• Live</span>
              </div>
            )}
          </div>
          
          {/* Status indicator - compact version */}
          <div className="so-status-container">
            <motion.div 
              className="so-status-indicator"
              style={{ 
                backgroundColor: statusConfig.bgColor,
                borderColor: statusConfig.borderColor
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="so-status-icon"
                animate={{ rotate: [0, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                {statusConfig.icon}
              </motion.div>
              <div className="so-status-content">
                <span className="so-status-label">{statusConfig.label}</span>
                <span className="so-status-text">{statusMessage}</span>
              </div>
            </motion.div>
          </div>
        </div>
        
        <div className="so-header-actions">
          {/* Auto-refresh toggle */}
          {onAutoRefreshToggle && (
            <div className="so-auto-refresh-toggle">
              <label className="so-auto-refresh-label">
                <input
                  type="checkbox"
                  checked={autoRefreshEnabled}
                  onChange={(e) => onAutoRefreshToggle(e.target.checked)}
                  className="so-auto-refresh-checkbox"
                />
                <span className="so-auto-refresh-text">
                  Auto-refresh {autoRefreshEnabled ? 'ON' : 'OFF'}
                </span>
              </label>
            </div>
          )}

          <motion.button
            className="so-btn so-btn-secondary"
            onClick={onRefresh}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              animate={{ rotate: loading ? 360 : 0 }}
              transition={{ duration: 1, repeat: loading ? Infinity : 0 }}
            >
              <RefreshCw size={16} />
            </motion.div>
            {loading ? 'Refreshing...' : 'Refresh'}
          </motion.button>
          
          <motion.button
            className="so-btn so-btn-primary"
            onClick={onAddProduct}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={16} />
            Add Product
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Grid - 3 cards per row */}
      <motion.div 
        className="so-stats-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {statItems.map((stat, index) => (
          <motion.div
            key={stat.label}
            className={`so-stat-card ${stat.clickable ? 'so-stat-card-clickable' : ''}`}
            style={{ backgroundColor: stat.color }}
            variants={cardVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={stat.clickable ? stat.onClick : undefined}
          >
            <div className="so-stat-header">
              <motion.div
                className="so-stat-icon"
                style={{ color: stat.iconColor }}
                variants={iconVariants}
              >
                <stat.icon size={20} />
              </motion.div>
              <span className="so-stat-label">{stat.label}</span>
              {stat.badge && (
                <motion.div 
                  className="so-stat-badge"
                  style={{ 
                    backgroundColor: stat.iconColor,
                    color: 'white'
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 500,
                    damping: 15,
                    delay: 0.3 + index * 0.1
                  }}
                >
                  {stat.badge}
                </motion.div>
              )}
            </div>
            
            <motion.div 
              className="so-stat-value"
              style={{ color: 'var(--text-primary)' }}
              variants={valueVariants}
            >
              {stat.value}
            </motion.div>

            <div className="so-stat-footer">
              <span className="so-stat-description">{stat.description}</span>
              {stat.clickable && (
                <motion.div 
                  className="so-stat-arrow"
                  style={{ color: stat.iconColor }}
                  whileHover={{ x: 3 }}
                >
                  <ArrowRight size={14} />
                </motion.div>
              )}
            </div>

            {/* Background decorative element */}
            <motion.div 
              className="so-stat-decoration"
              style={{ backgroundColor: stat.iconColor }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.1, scale: 1 }}
              transition={{ delay: 0.3 }}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};