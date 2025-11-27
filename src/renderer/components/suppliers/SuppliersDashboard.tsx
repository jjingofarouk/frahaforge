// src/renderer/src/components/suppliers/SuppliersDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  supplierService,
  Supplier,
  SupplierDashboard,
} from '../../services/supplierService';
import SuppliersTable from './SuppliersTable';
import SupplierIntelligence from './SupplierIntelligence';
import SupplierComparison from './SupplierComparison';
import BulkRestock from './BulkRestock';
import { Users, Package, RefreshCw, TrendingUp } from 'lucide-react';
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
      setError(null);
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load suppliers');
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
        return (
          <SuppliersTable
            suppliers={suppliers}
            loading={loading}
            onSupplierUpdate={handleSupplierUpdate}
          />
        );
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

  return (
    <div className="suppliers-dashboard">
      {/* Header Stats */}
      <div className="suppliers-header">
        <h1>Supplier Management</h1>

        <div className="suppliers-stats">
          <div className="stat-card">
            <Users size={24} />
            <div>
              <div className="stat-number">{suppliers.length}</div>
              <div className="stat-label">Total Suppliers</div>
            </div>
          </div>

          <div className="stat-card">
            <Package size={24} />
            <div>
              <div className="stat-number">
                {dashboardData?.top_suppliers.filter(s => s.total_restocks > 0).length || 0}
              </div>
              <div className="stat-label">Active Suppliers</div>
            </div>
          </div>

          <div className="stat-card">
            <RefreshCw size={24} />
            <div>
              <div className="stat-number">
                {dashboardData?.recent_restocks.length || 0}
              </div>
              <div className="stat-label">Recent Restocks</div>
            </div>
          </div>

          <div className="stat-card">
            <TrendingUp size={24} />
            <div>
              <div className="stat-number">
                {dashboardData?.top_suppliers.reduce((sum, s) => sum + (s.unique_products_supplied || 0), 0) || 0}
              </div>
              <div className="stat-label">Products Supplied</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Tab Content */}
      <div className="tab-content">
        {error && !loading && activeTab === 'suppliers' && (
          <div className="error-message" style={{ textAlign: 'center', padding: '40px', background: '#FEF2F2', borderRadius: '12px', margin: '20px' }}>
            <p style={{ color: '#DC2626', fontWeight: 500 }}>{error}</p>
            <button onClick={loadSuppliers} style={{ marginTop: '12px' }} className="btn-add">
              Retry
            </button>
          </div>
        )}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SuppliersDashboard;