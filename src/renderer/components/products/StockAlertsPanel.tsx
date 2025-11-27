// src/renderer/src/components/products/StockAlertsPanel.tsx
import React, { useState } from 'react';
import { Product } from '../../services/inventoryService';
import { AlertTriangle, XCircle, Calendar, Archive, ShoppingCart, Clock, Trash2 } from 'lucide-react';
import './StockAlertsPanel.css';

interface StockAlertsPanelProps {
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  expiringProducts: Product[];
  expiredProducts: Product[];
  onProductUpdate: () => void;
  onViewProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
}

type AlertTab = 'low-stock' | 'out-of-stock' | 'expiring' | 'expired';

const StockAlertsPanel: React.FC<StockAlertsPanelProps> = ({ 
  lowStockProducts,
  outOfStockProducts, 
  expiringProducts, 
  expiredProducts,
  onProductUpdate,
  onViewProduct,
  onEditProduct
}) => {
  const [activeTab, setActiveTab] = useState<AlertTab>('low-stock');
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);

  const getDaysUntilExpiry = (dateString?: string) => {
    if (!dateString) return 0;
    const expiryDate = new Date(dateString);
    const today = new Date();
    return Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleDeleteExpiredProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to permanently delete "${product.name}" and remove all its stock from the database? This action cannot be undone.`)) {
      return;
    }

    setDeletingProductId(product.id);
    try {
      // Import the inventory service
      const { inventoryService } = await import('../../services/inventoryService');
      await inventoryService.deleteProduct(product.id);
      onProductUpdate(); // Refresh the product list
    } catch (error: any) {
      alert(`Failed to delete product: ${error.message}`);
    } finally {
      setDeletingProductId(null);
    }
  };

  const renderProductCard = (product: Product, type: AlertTab) => {
    let cardClass = '';
    let icon = null;
    let badgeText = '';
    let primaryActionText = '';
    let primaryActionClass = '';
    let primaryActionHandler: (() => void) | null = null;

    switch (type) {
      case 'out-of-stock':
        cardClass = 'urgency-critical';
        icon = <XCircle size={20} />;
        badgeText = 'Out of Stock';
        primaryActionText = 'Restock Now';
        primaryActionClass = 'btn-primary';
        primaryActionHandler = () => onEditProduct(product);
        break;
      case 'expired':
        cardClass = 'urgency-critical';
        icon = <Archive size={20} />;
        badgeText = 'Expired';
        primaryActionText = 'Delete Product';
        primaryActionClass = 'btn-danger';
        primaryActionHandler = () => handleDeleteExpiredProduct(product);
        break;
      case 'low-stock':
        cardClass = 'urgency-high';
        icon = <AlertTriangle size={20} />;
        badgeText = 'Low Stock';
        primaryActionText = 'Restock';
        primaryActionClass = 'btn-primary';
        primaryActionHandler = () => onEditProduct(product);
        break;
      case 'expiring':
        const days = getDaysUntilExpiry(product.expiration_date);
        cardClass = days < 30 ? 'urgency-high' : 'urgency-medium';
        icon = <Clock size={20} />;
        badgeText = `Expires in ${days} days`;
        primaryActionText = 'Push Sales';
        primaryActionClass = 'btn-warning';
        primaryActionHandler = null; // No action for Push Sales
        break;
    }

    const handlePrimaryAction = () => {
      if (primaryActionHandler) {
        primaryActionHandler();
      }
      // If primaryActionHandler is null (Push Sales), do nothing
    };

    const handleViewDetails = () => {
      onViewProduct(product);
    };

    return (
      <div key={product.id} className={`alert-card ${cardClass}`}>
        <div className="alert-header">
          <span className="urgency-icon">{icon}</span>
          <div className="header-text">
            <h3>{product.name}</h3>
            <span className="product-category">{product.category}</span>
          </div>
          <span className="urgency-badge">{badgeText}</span>
        </div>
        
        <div className="alert-details">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">Current Stock</span>
              <span className={`value ${product.quantity === 0 ? 'text-danger' : ''}`}>
                {product.quantity}
              </span>
            </div>
            
            {(type === 'low-stock' || type === 'out-of-stock') && (
              <div className="detail-item">
                <span className="label">Min Stock</span>
                <span className="value">{product.min_stock}</span>
              </div>
            )}

            {(type === 'expiring' || type === 'expired') && (
               <div className="detail-item">
               <span className="label">Expiry Date</span>
               <span className="value">
                 {product.expiration_date ? new Date(product.expiration_date).toLocaleDateString() : 'N/A'}
               </span>
             </div>
            )}

            <div className="detail-item">
              <span className="label">Supplier</span>
              <span className="value">{product.supplier || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="alert-actions">
          <button 
            className={primaryActionClass}
            onClick={handlePrimaryAction}
            disabled={deletingProductId === product.id}
          >
            {deletingProductId === product.id ? (
              <>
                <div className="spinner"></div>
                Deleting...
              </>
            ) : (
              <>
                {type === 'expired' && <Trash2 size={16} />}
                {primaryActionText}
              </>
            )}
          </button>
          <button 
            className="btn-secondary"
            onClick={handleViewDetails}
          >
            View Details
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    let currentList: Product[] = [];
    let emptyMessage = '';
    let EmptyIcon = AlertTriangle;

    switch (activeTab) {
      case 'low-stock':
        currentList = lowStockProducts;
        emptyMessage = 'No low stock alerts. Inventory levels are healthy.';
        EmptyIcon = ShoppingCart;
        break;
      case 'out-of-stock':
        currentList = outOfStockProducts;
        emptyMessage = 'No products are currently out of stock.';
        EmptyIcon = ShoppingCart;
        break;
      case 'expiring':
        currentList = expiringProducts;
        emptyMessage = 'No products expiring within the next 90 days.';
        EmptyIcon = Calendar;
        break;
      case 'expired':
        currentList = expiredProducts;
        emptyMessage = 'No expired products found in inventory.';
        EmptyIcon = Archive;
        break;
    }

    if (currentList.length === 0) {
      return (
        <div className="no-alerts-state">
          <div className="empty-icon-wrapper">
            <EmptyIcon size={48} />
          </div>
          <h3>All Clear</h3>
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="alerts-grid">
        {currentList.map(product => renderProductCard(product, activeTab))}
      </div>
    );
  };

  return (
    <div className="stock-alerts-panel">
      <div className="alerts-header">
        <div className="header-title">
          <h2>Stock Alerts & Monitoring</h2>
          <p>Action items requiring attention</p>
        </div>
        
        <div className="alert-type-tabs">
          <button 
            className={`type-tab ${activeTab === 'low-stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('low-stock')}
          >
            Low Stock
            {lowStockProducts.length > 0 && <span className="tab-count warning">{lowStockProducts.length}</span>}
          </button>
          
          <button 
            className={`type-tab ${activeTab === 'out-of-stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('out-of-stock')}
          >
            Out of Stock
            {outOfStockProducts.length > 0 && <span className="tab-count danger">{outOfStockProducts.length}</span>}
          </button>

          <button 
            className={`type-tab ${activeTab === 'expiring' ? 'active' : ''}`}
            onClick={() => setActiveTab('expiring')}
          >
            Expiring Soon
            {expiringProducts.length > 0 && <span className="tab-count warning">{expiringProducts.length}</span>}
          </button>

          <button 
            className={`type-tab ${activeTab === 'expired' ? 'active' : ''}`}
            onClick={() => setActiveTab('expired')}
          >
            Expired
            {expiredProducts.length > 0 && <span className="tab-count danger">{expiredProducts.length}</span>}
          </button>
        </div>
      </div>

      <div className="alerts-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default StockAlertsPanel;