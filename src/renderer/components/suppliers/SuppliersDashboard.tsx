// src/renderer/src/components/suppliers/SuppliersDashboard.tsx
import React, { useState, useEffect } from 'react';
import { supplierService, Supplier, SupplierDashboard, SupplierReliability, PriceTrend, ProductSupplierComparison } from '../../services/supplierService';
import SupplierIntelligence from './SupplierIntelligence';
import SupplierComparison from './SupplierComparison';
import BulkRestock from './BulkRestock';
import './SuppliersDashboard.css';

const SuppliersDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'intelligence' | 'comparison' | 'bulk'>('suppliers');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dashboardData, setDashboardData] = useState<SupplierDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuppliers();
    loadDashboardData();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const data = await supplierService.getSupplierDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const handleSupplierUpdate = () => {
    loadSuppliers();
    loadDashboardData();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'suppliers':
        return renderSuppliersList();
      case 'intelligence':
        return <SupplierIntelligence onSupplierUpdate={handleSupplierUpdate} />;
      case 'comparison':
        return <SupplierComparison />;
      case 'bulk':
        return <BulkRestock onRestockComplete={handleSupplierUpdate} />;
      default:
        return null;
    }
  };

  const renderSuppliersList = () => {
    if (loading) return <div className="loading">Loading suppliers...</div>;
    
    if (error) {
      return (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadSuppliers}>Retry</button>
        </div>
      );
    }

    return (
      <div className="suppliers-list">
        <div className="list-header">
          <h3>All Suppliers</h3>
          <button className="btn-primary">Add New Supplier</button>
        </div>
        
        <div className="suppliers-grid">
          {suppliers.map(supplier => (
            <div key={supplier.id} className="supplier-card">
              <div className="supplier-header">
                <h4>{supplier.name}</h4>
                <span className="supplier-id">#{supplier.id}</span>
              </div>
              
              <div className="supplier-stats">
                <div className="stat">
                  <span className="label">Total Products</span>
                  <span className="value">{supplier.total_products || 0}</span>
                </div>
                <div className="stat">
                  <span className="label">Products Restocked</span>
                  <span className="value">{supplier.unique_products_restocked || 0}</span>
                </div>
                {supplier.last_restock_date && (
                  <div className="stat">
                    <span className="label">Last Restock</span>
                    <span className="value">{new Date(supplier.last_restock_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="supplier-actions">
                <button className="btn-primary">View Products</button>
                <button className="btn-secondary">Contact</button>
              </div>
            </div>
          ))}
        </div>

        {suppliers.length === 0 && (
          <div className="no-suppliers">
            <p>No suppliers found. Add your first supplier to get started.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="suppliers-dashboard">
      <div className="suppliers-header">
        <h1>Supplier Management</h1>
        <div className="suppliers-stats">
          <div className="stat-card">
            <span className="stat-number">{suppliers.length}</span>
            <span className="stat-label">Total Suppliers</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {dashboardData?.top_suppliers.filter(s => s.total_restocks > 0).length || 0}
            </span>
            <span className="stat-label">Active Suppliers</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {dashboardData?.recent_restocks.length || 0}
            </span>
            <span className="stat-label">Recent Restocks</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {dashboardData?.top_suppliers.reduce((sum, s) => sum + s.unique_products_supplied, 0) || 0}
            </span>
            <span className="stat-label">Products Supplied</span>
          </div>
        </div>
      </div>

      <div className="suppliers-tabs">
        <button 
          className={`tab-button ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          All Suppliers
        </button>
        <button 
          className={`tab-button ${activeTab === 'intelligence' ? 'active' : ''}`}
          onClick={() => setActiveTab('intelligence')}
        >
          Supplier Intelligence
        </button>
        <button 
          className={`tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          Price Comparison
        </button>
        <button 
          className={`tab-button ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          Bulk Restock
        </button>
      </div>

      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SuppliersDashboard;