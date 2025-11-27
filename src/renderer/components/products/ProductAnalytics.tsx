// src/renderer/src/components/products/ProductAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { inventoryService, StockMovement, ProfitableCategory, SupplierPerformance } from '../../services/inventoryService';
import './ProductAnalytics.css';

const ProductAnalytics: React.FC = () => {
  const [stockMovement, setStockMovement] = useState<StockMovement[]>([]);
  const [profitableCategories, setProfitableCategories] = useState<ProfitableCategory[]>([]);
  const [supplierPerformance, setSupplierPerformance] = useState<SupplierPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'movement' | 'categories' | 'suppliers'>('movement');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [movement, categories, suppliers] = await Promise.all([
        inventoryService.getStockMovementAnalysis(),
        inventoryService.getProfitableCategories(),
        inventoryService.getSupplierPerformance()
      ]);
      setStockMovement(movement);
      setProfitableCategories(categories);
      setSupplierPerformance(suppliers);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'fast': return 'movement-fast';
      case 'medium': return 'movement-medium';
      case 'slow': return 'movement-slow';
      case 'dead': return 'movement-dead';
      default: return 'movement-unknown';
    }
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'fast': return '🚀';
      case 'medium': return '📈';
      case 'slow': return '🐢';
      case 'dead': return '💀';
      default: return '❓';
    }
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    return value.toLocaleString();
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'UGX 0';
    }
    return `UGX ${value.toLocaleString()}`;
  };

  const renderStockMovement = () => {
    if (loading) return <div className="loading">Loading stock movement...</div>;

    const fastMoving = stockMovement.filter(item => item.movement_type === 'fast');
    const slowMoving = stockMovement.filter(item => item.movement_type === 'slow');
    const deadStock = stockMovement.filter(item => item.movement_type === 'dead');

    return (
      <div className="analytics-section">
        <div className="movement-overview">
          <div className="overview-card fast-moving">
            <h3>Fast Moving</h3>
            <span className="count">{fastMoving.length}</span>
            <span className="description">High turnover products</span>
          </div>
          <div className="overview-card slow-moving">
            <h3>Slow Moving</h3>
            <span className="count">{slowMoving.length}</span>
            <span className="description">Low turnover products</span>
          </div>
          <div className="overview-card dead-stock">
            <h3>Dead Stock</h3>
            <span className="count">{deadStock.length}</span>
            <span className="description">No recent sales</span>
          </div>
        </div>

        <div className="movement-details">
          <h3>Product Movement Details</h3>
          <div className="movement-table">
            <div className="table-header">
              <span>Product</span>
              <span>Category</span>
              <span>Movement</span>
              <span>Quantity Sold</span>
              <span>Revenue</span>
              <span>Profit</span>
            </div>
            {stockMovement.slice(0, 20).map(item => (
              <div key={item.product_id} className={`table-row ${getMovementTypeColor(item.movement_type)}`}>
                <span className="product-name">{item.product_name || 'Unknown'}</span>
                <span className="category">{item.category || 'Uncategorized'}</span>
                <span className="movement-type">
                  {getMovementTypeIcon(item.movement_type)} {item.movement_type || 'unknown'}
                </span>
                <span className="quantity">{formatNumber(item.total_quantity_sold)}</span>
                <span className="revenue">{formatCurrency(item.total_revenue)}</span>
                <span className="profit">{formatCurrency(item.total_profit)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderProfitableCategories = () => {
    if (loading) return <div className="loading">Loading category data...</div>;

    return (
      <div className="analytics-section">
        <h3>Most Profitable Categories</h3>
        <div className="categories-grid">
          {profitableCategories.map((category, index) => (
            <div key={category.category || `category-${index}`} className="category-card">
              <h4>{category.category || 'Uncategorized'}</h4>
              <div className="category-stats">
                <div className="stat">
                  <span className="label">Total Profit</span>
                  <span className="value profit">{formatCurrency(category.total_profit)}</span>
                </div>
                <div className="stat">
                  <span className="label">Profit Margin</span>
                  <span className="value margin">
                    {category.profit_margin_percent != null ? category.profit_margin_percent.toFixed(1) : '0.0'}%
                  </span>
                </div>
                <div className="stat">
                  <span className="label">Products</span>
                  <span className="value">{formatNumber(category.product_count)}</span>
                </div>
                <div className="stat">
                  <span className="label">Quantity Sold</span>
                  <span className="value">{formatNumber(category.total_quantity_sold)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSupplierPerformance = () => {
    if (loading) return <div className="loading">Loading supplier data...</div>;

    return (
      <div className="analytics-section">
        <h3>Supplier Performance</h3>
        <div className="suppliers-grid">
          {supplierPerformance.map((supplier, index) => (
            <div key={supplier.supplier_id || `supplier-${index}`} className="supplier-card">
              <h4>{supplier.supplier_name || 'Unknown Supplier'}</h4>
              <div className="supplier-stats">
                <div className="stat">
                  <span className="label">Products Supplied</span>
                  <span className="value">{formatNumber(supplier.unique_products_supplied)}</span>
                </div>
                <div className="stat">
                  <span className="label">Total Restocks</span>
                  <span className="value">{formatNumber(supplier.total_restocks)}</span>
                </div>
                <div className="stat">
                  <span className="label">Avg Cost Price</span>
                  <span className="value">{formatCurrency(supplier.average_cost_price)}</span>
                </div>
                <div className="stat">
                  <span className="label">Current Inventory Value</span>
                  <span className="value">{formatCurrency(supplier.current_inventory_value)}</span>
                </div>
              </div>
              <div className="supplier-meta">
                <span>
                  Last Restock: {
                    supplier.last_restock_date 
                      ? new Date(supplier.last_restock_date).toLocaleDateString() 
                      : 'Never'
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="product-analytics">
      <div className="analytics-header">
        <h2>Product Analytics & Intelligence</h2>
        <div className="analytics-tabs">
          <button 
            className={`analytics-tab ${activeTab === 'movement' ? 'active' : ''}`}
            onClick={() => setActiveTab('movement')}
          >
            Stock Movement
          </button>
          <button 
            className={`analytics-tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Profitable Categories
          </button>
          <button 
            className={`analytics-tab ${activeTab === 'suppliers' ? 'active' : ''}`}
            onClick={() => setActiveTab('suppliers')}
          >
            Supplier Performance
          </button>
        </div>
      </div>

      <div className="analytics-content">
        {activeTab === 'movement' && renderStockMovement()}
        {activeTab === 'categories' && renderProfitableCategories()}
        {activeTab === 'suppliers' && renderSupplierPerformance()}
      </div>
    </div>
  );
};

export default ProductAnalytics;