// src/renderer/src/components/products/StockAlertsPanel.tsx
import React, { useState, useEffect } from 'react';
import { inventoryService, LowStockAlert, ExpiringProduct } from '../../services/inventoryService';
import './StockAlertsPanel.css';

interface StockAlertsPanelProps {
  onProductUpdate: () => void;
}

const StockAlertsPanel: React.FC<StockAlertsPanelProps> = ({ onProductUpdate }) => {
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [expiringProducts, setExpiringProducts] = useState<ExpiringProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAlertType, setActiveAlertType] = useState<'low-stock' | 'expiring'>('low-stock');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async (): Promise<void> => {
    try {
      setLoading(true);
      const [lowStock, expiring] = await Promise.all([
        inventoryService.getLowStockAlerts(),
        inventoryService.getExpiringProducts({ days: 90 })
      ]);
      setLowStockAlerts(lowStock);
      setExpiringProducts(expiring);
    } catch (err: any) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'critical': return 'urgency-critical';
      case 'high': return 'urgency-high';
      case 'medium': return 'urgency-medium';
      default: return 'urgency-low';
    }
  };

  const getUrgencyIcon = (urgency: string): string => {
    switch (urgency) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      default: return '🟢';
    }
  };

  const renderLowStockAlerts = (): JSX.Element => {
    if (loading) return <div className="loading">Loading alerts...</div>;
    
    if (lowStockAlerts.length === 0) {
      return <div className="no-alerts">No low stock alerts</div>;
    }

    return (
      <div className="alerts-grid">
        {lowStockAlerts.map(alert => (
          <div key={alert.product_id} className={`alert-card ${getUrgencyColor(alert.urgency)}`}>
            <div className="alert-header">
              <span className="urgency-icon">{getUrgencyIcon(alert.urgency)}</span>
              <h3>{alert.product_name}</h3>
              <span className="urgency-badge">{alert.urgency}</span>
            </div>
            <div className="alert-details">
              <div className="detail-row">
                <span>Current Stock:</span>
                <span className="stock-quantity">{alert.current_quantity}</span>
              </div>
              <div className="detail-row">
                <span>Minimum Stock:</span>
                <span>{alert.min_stock}</span>
              </div>
              <div className="detail-row">
                <span>Category:</span>
                <span>{alert.category}</span>
              </div>
              <div className="detail-row">
                <span>Supplier:</span>
                <span>{alert.supplier_name}</span>
              </div>
              {alert.last_sold_date && (
                <div className="detail-row">
                  <span>Last Sold:</span>
                  <span>{new Date(alert.last_sold_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            <div className="alert-actions">
              <button className="btn-primary">Restock Now</button>
              <button className="btn-secondary">View Product</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderExpiringProducts = (): JSX.Element => {
    if (loading) return <div className="loading">Loading expiring products...</div>;
    
    if (expiringProducts.length === 0) {
      return <div className="no-alerts">No products expiring soon</div>;
    }

    return (
      <div className="alerts-grid">
        {expiringProducts.map(product => (
          <div key={product.product_id} className={`alert-card ${getUrgencyColor(product.urgency)}`}>
            <div className="alert-header">
              <span className="urgency-icon">{getUrgencyIcon(product.urgency)}</span>
              <h3>{product.product_name}</h3>
              <span className="urgency-badge">{product.urgency}</span>
            </div>
            <div className="alert-details">
              <div className="detail-row">
                <span>Expires:</span>
                <span className="expiry-date">{new Date(product.expiration_date).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span>Days Left:</span>
                <span className="days-left">{Math.floor(product.days_until_expiry)} days</span>
              </div>
              <div className="detail-row">
                <span>Current Stock:</span>
                <span>{product.current_quantity}</span>
              </div>
              <div className="detail-row">
                <span>Category:</span>
                <span>{product.category}</span>
              </div>
              <div className="detail-row">
                <span>Cost Price:</span>
                <span>UGX {Number(product.cost_price).toLocaleString()}</span>
              </div>
            </div>
            <div className="alert-actions">
              <button className="btn-warning">Push Sales</button>
              <button className="btn-secondary">View Details</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="stock-alerts-panel">
      <div className="alerts-header">
        <h2>Stock Alerts & Monitoring</h2>
        <div className="alert-type-tabs">
          <button 
            className={`type-tab ${activeAlertType === 'low-stock' ? 'active' : ''}`}
            onClick={() => setActiveAlertType('low-stock')}
          >
            Low Stock ({lowStockAlerts.length})
          </button>
          <button 
            className={`type-tab ${activeAlertType === 'expiring' ? 'active' : ''}`}
            onClick={() => setActiveAlertType('expiring')}
          >
            Expiring Soon ({expiringProducts.length})
          </button>
        </div>
      </div>

      <div className="alerts-content">
        {activeAlertType === 'low-stock' ? renderLowStockAlerts() : renderExpiringProducts()}
      </div>
    </div>
  );
};

export default StockAlertsPanel;