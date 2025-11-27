// src/renderer/src/components/products/ProductsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, AlertTriangle, Calendar, TrendingUp, RefreshCw,
  ShoppingCart, Archive, Plus
} from 'lucide-react';

import { inventoryService, Product } from '../../services/inventoryService';
import ProductsTable from './ProductsTable';
import StockAlertsPanel from './StockAlertsPanel';
import ProductAnalytics from './ProductAnalytics';
import { LowStockModal } from './LowStockModal';
import { ExpiryModal } from './ExpiryModal';
import ProductModal from './ProductModal';

import './ProductsPage.css';

const ProductsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'alerts' | 'restock' | 'analytics'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);

  // Product modal state - simplified like ProductsTable
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [showProductModal, setShowProductModal] = useState(false);

  // Alert modals
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showExpiringModal, setShowExpiringModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);

  const { lowStockProducts, outOfStockProducts, expiringProducts, expiredProducts } = useMemo(() => {
    const lowStock = products.filter(p => {
      const qty = p.quantity || 0;
      const reorder = p.reorder_level || (p.min_stock || 0) * 2;
      return qty > 0 && qty <= reorder;
    });
    const outOfStock = products.filter(p => (p.quantity || 0) === 0);
    const expiring = products.filter(p => {
      if (!p.expiration_date) return false;
      const days = Math.floor((new Date(p.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 90 && (p.quantity || 0) > 0;
    });
    const expired = products.filter(p => {
      if (!p.expiration_date) return false;
      const days = Math.floor((new Date(p.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days < 0 && (p.quantity || 0) > 0;
    });
    return { lowStockProducts: lowStock, outOfStockProducts: outOfStock, expiringProducts: expiring, expiredProducts: expired };
  }, [products]);

  const stats = useMemo(() => {
    const totalValue = products.reduce((sum, p) => sum + (p.quantity || 0) * (parseFloat(p.cost_price as any) || 0), 0);
    return {
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      expiringCount: expiringProducts.length,
      expiredCount: expiredProducts.length,
      totalValue: Math.round(totalValue / 100) * 100
    };
  }, [products, lowStockProducts, outOfStockProducts, expiringProducts, expiredProducts]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (lastRefresh) {
      setIsBlinking(true);
      const t = setTimeout(() => setIsBlinking(false), 1000);
      return () => clearTimeout(t);
    }
  }, [lastRefresh]);

  // Listen for switch to edit mode event - like ProductsTable does
  useEffect(() => {
    const handleSwitchToEditMode = (event: CustomEvent) => {
      setSelectedProduct(event.detail);
      setModalMode('edit');
      setShowProductModal(true);
    };

    window.addEventListener('switchToEditMode' as any, handleSwitchToEditMode as EventListener);
    
    return () => {
      window.removeEventListener('switchToEditMode' as any, handleSwitchToEditMode as EventListener);
    };
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryService.getProducts();
      setProducts(data);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(`Failed to load products: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setModalMode('create');
    setShowProductModal(true);
  };

  const handleProductUpdate = () => {
    loadProducts();
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('view');
    setShowProductModal(true);
    setShowLowStockModal(false);
    setShowExpiringModal(false);
    setShowExpiredModal(false);
    setShowOutOfStockModal(false);
  };

  // Handle edit product from alerts panel
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('edit');
    setShowProductModal(true);
    setShowLowStockModal(false);
    setShowExpiringModal(false);
    setShowExpiredModal(false);
    setShowOutOfStockModal(false);
  };

  const handleCloseModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
    setModalMode('view');
  };

  const handleSaveProduct = () => {
    handleProductUpdate();
    handleCloseModal();
  };

  if (error && !refreshing) {
    return (
      <div className="products-container">
        <div className="error-banner">
          <AlertTriangle size={14} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      </div>
    );
  }

  return (
    <div className="products-container">
      {/* Header */}
      <div className="products-header">
        <div className="products-header__content">
          <div className="products-header__title">
            <h1>Inventory Management</h1>
            {lastRefresh && (
              <div className="last-refresh-container">
                <span className={`last-refresh ${isBlinking ? 'blinking' : ''}`}>
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
                <span className="realtime-indicator">• Live</span>
              </div>
            )}
          </div>
          <div className="products-header__actions">
            <button
              className="products-refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              className="products-add-btn"
              onClick={handleCreateProduct}
            >
              <Plus size={14} />
              Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <AlertTriangle size={14} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Stats Grid - Compact Cards */}
      <div className="stats-grid">
        <div className="stat-card total-products">
          <Package size={18} />
          <div className="stat-content">
            <div className="stat-number">{stats.totalProducts}</div>
            <div className="stat-label">Total Products</div>
          </div>
        </div>

        <div className="stat-card low-stock clickable" onClick={() => stats.lowStockCount > 0 && setShowLowStockModal(true)}>
          <AlertTriangle size={18} />
          <div className="stat-content">
            <div className="stat-number">{stats.lowStockCount}</div>
            <div className="stat-label">Low Stock</div>
          </div>
          {stats.lowStockCount > 0 && <span className="stat-badge">{stats.lowStockCount}</span>}
        </div>

        <div className="stat-card out-of-stock clickable" onClick={() => stats.outOfStockCount > 0 && setShowOutOfStockModal(true)}>
          <ShoppingCart size={18} />
          <div className="stat-content">
            <div className="stat-number">{stats.outOfStockCount}</div>
            <div className="stat-label">Out of Stock</div>
          </div>
          {stats.outOfStockCount > 0 && <span className="stat-badge">{stats.outOfStockCount}</span>}
        </div>

        <div className="stat-card expiring clickable" onClick={() => stats.expiringCount > 0 && setShowExpiringModal(true)}>
          <Calendar size={18} />
          <div className="stat-content">
            <div className="stat-number">{stats.expiringCount}</div>
            <div className="stat-label">Expiring Soon</div>
          </div>
          {stats.expiringCount > 0 && <span className="stat-badge">{stats.expiringCount}</span>}
        </div>

        <div className="stat-card expired clickable" onClick={() => stats.expiredCount > 0 && setShowExpiredModal(true)}>
          <Archive size={18} />
          <div className="stat-content">
            <div className="stat-number">{stats.expiredCount}</div>
            <div className="stat-label">Expired</div>
          </div>
          {stats.expiredCount > 0 && <span className="stat-badge">{stats.expiredCount}</span>}
        </div>

        <div className="stat-card value">
          <TrendingUp size={18} />
          <div className="stat-content">
            <div className="stat-number">UGX {(stats.totalValue / 1000).toFixed(0)}K</div>
            <div className="stat-label">Inventory Value</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="products-tabs">
        <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
          <Package size={14} /> All Products
        </button>
        <button className={activeTab === 'alerts' ? 'active' : ''} onClick={() => setActiveTab('alerts')}>
          <AlertTriangle size={14} /> Alerts
          {(stats.lowStockCount + stats.outOfStockCount + stats.expiringCount + stats.expiredCount > 0) && (
            <span className="tab-badge">
              {stats.lowStockCount + stats.outOfStockCount + stats.expiringCount + stats.expiredCount}
            </span>
          )}
        </button>
        <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
          <TrendingUp size={14} /> Analytics
        </button>
      </div>

      {/* Main Content */}
      <div className="products-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'products' && <ProductsTable products={products} loading={loading} onProductUpdate={handleProductUpdate} />}
            {activeTab === 'alerts' && (
              <StockAlertsPanel 
                lowStockProducts={lowStockProducts}
                outOfStockProducts={outOfStockProducts}
                expiringProducts={expiringProducts}
                expiredProducts={expiredProducts}
                onProductUpdate={handleProductUpdate}
                onViewProduct={handleProductSelect}
                onEditProduct={handleEditProduct}
              />
            )}
            {activeTab === 'analytics' && <ProductAnalytics />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modals */}
      <LowStockModal isOpen={showLowStockModal} onClose={() => setShowLowStockModal(false)} products={lowStockProducts} onSelectProduct={handleProductSelect} />
      <LowStockModal isOpen={showOutOfStockModal} onClose={() => setShowOutOfStockModal(false)} products={outOfStockProducts} onSelectProduct={handleProductSelect} />
      <ExpiryModal isOpen={showExpiringModal} onClose={() => setShowExpiringModal(false)} products={expiringProducts} expiryType="expiring-soon" onSelectProduct={handleProductSelect} />
      <ExpiryModal isOpen={showExpiredModal} onClose={() => setShowExpiredModal(false)} products={expiredProducts} expiryType="expired" onSelectProduct={handleProductSelect} />

      {/* Product Modal - Like ProductsTable */}
      {showProductModal && (
        <ProductModal
          product={modalMode === 'create' ? null : selectedProduct}
          mode={modalMode}
          onClose={handleCloseModal}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
};

export default ProductsPage;