// src/renderer/src/components/products/ProductsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { inventoryService, Product } from '../../services/inventoryService';
import ProductsTable from './ProductsTable';
import StockAlertsPanel from './StockAlertsPanel';
import RestockManager from './RestockManager';
import ProductAnalytics from './ProductAnalytics';
import { Package, AlertTriangle, Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import './ProductsPage.css';

const ProductsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'alerts' | 'restock' | 'analytics'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate stats from products data
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => 
      sum + (product.quantity * (product.cost_price as number)), 0
    );

    // Calculate low stock count
    const lowStockCount = products.filter(product => {
      const quantity = product.quantity || 0;
      const minStock = product.min_stock || 0;
      const reorderLevel = product.reorder_level || minStock * 2;
      return quantity > 0 && quantity <= reorderLevel;
    }).length;

    // Calculate expiring products count (within 90 days)
    const expiringCount = products.filter(product => {
      if (!product.expiration_date) return false;
      
      const expiryDate = new Date(product.expiration_date);
      const today = new Date();
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 90 && (product.quantity || 0) > 0;
    }).length;

    return {
      totalProducts,
      lowStockCount,
      expiringCount,
      totalValue
    };
  }, [products]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getProducts();
      setProducts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
  };

  const handleProductUpdate = () => {
    loadProducts();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <ProductsTable 
            products={products} 
            loading={loading}
            onProductUpdate={handleProductUpdate}
          />
        );
      case 'alerts':
        return <StockAlertsPanel onProductUpdate={handleProductUpdate} />;
      case 'restock':
        return <RestockManager onRestockComplete={handleProductUpdate} />;
      case 'analytics':
        return <ProductAnalytics />;
      default:
        return null;
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const statCardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.08,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    })
  };

  const tabVariants: Variants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  if (error) {
    return (
      <motion.div 
        className="products-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="error-state">
          <div className="error-icon">
            <AlertTriangle size={48} />
          </div>
          <h2>Unable to Load Products</h2>
          <p>{error}</p>
          <button className="btn-retry" onClick={loadProducts}>
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="products-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <motion.h1 
              className="page-title"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              Inventory Management
            </motion.h1>
            <motion.p 
              className="page-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              Manage products, track stock levels, and analyze performance
            </motion.p>
          </div>
          <div className="header-actions">
            <motion.button 
              className={`btn-refresh ${refreshing ? 'refreshing' : ''}`}
              onClick={handleRefresh}
              disabled={refreshing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        className="stats-grid"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.08
            }
          }
        }}
      >
        <motion.div 
          className="stat-card"
          variants={statCardVariants}
          custom={0}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
        >
          <div className="stat-icon-wrapper primary">
            <Package size={22} strokeWidth={2.5} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{stats.totalProducts}</span>
            <span className="stat-label">Total Products</span>
          </div>
        </motion.div>

        <motion.div 
          className={`stat-card ${stats.lowStockCount > 0 ? 'critical' : ''}`}
          variants={statCardVariants}
          custom={1}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
        >
          <div className="stat-icon-wrapper critical">
            <AlertTriangle size={22} strokeWidth={2.5} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{stats.lowStockCount}</span>
            <span className="stat-label">Low Stock Items</span>
          </div>
          {stats.lowStockCount > 0 && (
            <motion.div 
              className="stat-badge critical"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 500, damping: 25 }}
            >
              {stats.lowStockCount}
            </motion.div>
          )}
        </motion.div>

        <motion.div 
          className={`stat-card ${stats.expiringCount > 0 ? 'warning' : ''}`}
          variants={statCardVariants}
          custom={2}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
        >
          <div className="stat-icon-wrapper warning">
            <Calendar size={22} strokeWidth={2.5} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{stats.expiringCount}</span>
            <span className="stat-label">Expiring Soon</span>
          </div>
          {stats.expiringCount > 0 && (
            <motion.div 
              className="stat-badge warning"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 500, damping: 25 }}
            >
              {stats.expiringCount}
            </motion.div>
          )}
        </motion.div>

        <motion.div 
          className="stat-card"
          variants={statCardVariants}
          custom={3}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
        >
          <div className="stat-icon-wrapper success">
            <TrendingUp size={22} strokeWidth={2.5} />
          </div>
          <div className="stat-content">
            <span className="stat-number">UGX {stats.totalValue.toLocaleString()}</span>
            <span className="stat-label">Total Inventory Value</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div 
        className="navigation-tabs"
        variants={tabVariants}
        initial="hidden"
        animate="visible"
      >
        <button 
          className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={18} strokeWidth={2.5} />
          All Products
        </button>
        <button 
          className={`tab-button ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <AlertTriangle size={18} strokeWidth={2.5} />
          Stock Alerts
          {stats.lowStockCount > 0 && (
            <span className="tab-badge">{stats.lowStockCount}</span>
          )}
        </button>
        <button 
          className={`tab-button ${activeTab === 'restock' ? 'active' : ''}`}
          onClick={() => setActiveTab('restock')}
        >
          <RefreshCw size={18} strokeWidth={2.5} />
          Restock
        </button>
        <button 
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={18} strokeWidth={2.5} />
          Analytics
        </button>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          className="tab-content-wrapper"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductsPage;