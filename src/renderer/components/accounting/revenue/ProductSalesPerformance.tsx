// src/renderer/components/accounting/revenue/ProductSalesPerformance.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  AlertCircle,
  Loader2,
  Target,
  Award,
  BarChart3,
  Users
} from 'lucide-react';
import { transactionsService, Transaction } from '../../../services/transactionsService';
import { ProductSalesTable } from './ProductSalesTable';
import { 
  getRevenuePerformanceMessage,
  getSalesVolumeMessage,
  getProductMixMessage,
  getTransactionEfficiencyMessage
} from './productSalesMessages';
import './ProductSalesPerformance.css';

interface ProductSalesPerformanceProps {
  startDate: string;
  endDate: string;
  transactions: Transaction[];
  loading: boolean;
}

interface ProductSalesData {
  productName: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  transactionCount: number;
  averagePrice: number;
}

interface StatCard {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
  iconColor: string;
}

const ProductSalesPerformance: React.FC<ProductSalesPerformanceProps> = ({
  startDate,
  endDate,
  transactions = [],
  loading
}) => {
  const [productSales, setProductSales] = useState<ProductSalesData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductSales = async () => {
      try {
        setDataLoading(true);
        setError(null);
        
        const data = await transactionsService.getProductSalesPerformance({
          startDate,
          endDate,
          limit: 1000
        });

        setProductSales(data || []);
      } catch (err: any) {
        console.error('Error fetching product sales:', err);
        setError(err.message || 'Failed to load product sales data');
      } finally {
        setDataLoading(false);
      }
    };

    if (startDate && endDate && !loading) {
      fetchProductSales();
    }
  }, [startDate, endDate, loading]);

  // Calculate comprehensive summary stats
  const summaryStats = useMemo(() => {
    const totalRevenue = productSales.reduce((sum, product) => sum + product.totalRevenue, 0);
    const totalQuantity = productSales.reduce((sum, product) => sum + product.totalQuantity, 0);
    const totalProducts = productSales.length;
    const totalTransactions = transactions?.length || 0;
    
    // Advanced metrics
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const averageUnitsPerTransaction = totalTransactions > 0 ? totalQuantity / totalTransactions : 0;
    const revenuePerProduct = totalProducts > 0 ? totalRevenue / totalProducts : 0;
    
    // Category analysis
    const categoryRevenue = productSales.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + product.totalRevenue;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categoryRevenue)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalRevenue,
      totalQuantity,
      totalProducts,
      totalTransactions,
      averageTransactionValue,
      averageUnitsPerTransaction,
      revenuePerProduct,
      topCategory
    };
  }, [productSales, transactions]);

  // Intelligent messages based on sales performance
  const intelligentMessages = useMemo(() => {
    return {
      revenue: getRevenuePerformanceMessage(summaryStats.totalRevenue, summaryStats.revenuePerProduct),
      volume: getSalesVolumeMessage(summaryStats.totalQuantity, summaryStats.averageUnitsPerTransaction),
      products: getProductMixMessage(summaryStats.totalProducts, summaryStats.topCategory),
      transactions: getTransactionEfficiencyMessage(summaryStats.totalTransactions, summaryStats.averageTransactionValue)
    };
  }, [summaryStats]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
  };

  const statsCards: StatCard[] = [
    {
      label: 'Total Revenue',
      value: formatCurrency(summaryStats.totalRevenue),
      icon: DollarSign,
      description: intelligentMessages.revenue,
      color: 'var(--card-green)',
      iconColor: 'var(--icon-green)'
    },
    {
      label: 'Units Sold',
      value: summaryStats.totalQuantity.toLocaleString(),
      icon: Package,
      description: intelligentMessages.volume,
      color: 'var(--card-blue)',
      iconColor: 'var(--icon-blue)'
    },
    {
      label: 'Product Diversity',
      value: summaryStats.totalProducts.toString(),
      icon: BarChart3,
      description: intelligentMessages.products,
      color: 'var(--card-purple)',
      iconColor: 'var(--icon-purple)'
    },
    {
      label: 'Transaction Efficiency',
      value: summaryStats.totalTransactions.toString(),
      icon: TrendingUp,
      description: intelligentMessages.transactions,
      color: 'var(--card-orange)',
      iconColor: 'var(--icon-orange)'
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

  if (error) {
    return (
      <motion.div 
        className="error-alert"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="error-alert__icon">
          <AlertCircle size={20} />
        </div>
        <span>{error}</span>
      </motion.div>
    );
  }

  if (loading || dataLoading) {
    return (
      <motion.div 
        className="loading-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={32} color="var(--primary-teal)" />
        </motion.div>
        <p>Loading sales performance data...</p>
      </motion.div>
    );
  }

  return (
    <div className="product-sales-performance">
      {/* Header */}
      <motion.div 
        className="performance-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="performance-title">Product Sales Performance</h1>
        <div className="performance-subtitle">
          <Calendar size={16} />
          {startDate} to {endDate} • {productSales.length} products sold • {transactions.length} transactions
        </div>
      </motion.div>

      {/* Summary Cards */}
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
            </div>

            {/* Background decorative elements */}
            <motion.div 
              className="stat-card__decoration"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Product Sales Table */}
      <ProductSalesTable 
        productSales={productSales}
        loading={dataLoading}
      />
    </div>
  );
};

export default ProductSalesPerformance;