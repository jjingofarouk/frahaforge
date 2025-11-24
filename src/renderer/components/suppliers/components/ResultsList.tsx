// Updated ResultsList.tsx with new CSS classes
import React from 'react';
import { Package, Users, TrendingUp, TrendingDown, Star, Calendar } from 'lucide-react';
import { useSuppliersStore } from '../stores/suppliersStore';
import './ResultsList.css';

interface ResultsListProps {
  results: any[];
  type: 'products' | 'suppliers';
  isLoading: boolean;
}

const ResultsList: React.FC<ResultsListProps> = ({ results, type, isLoading }) => {
  const { setSelectedProduct, setSelectedSupplier } = useSuppliersStore();

  if (isLoading) {
    return (
      <div className="results-loading">
        <div className="loading-skeleton">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-item">
              <div className="skeleton-icon"></div>
              <div className="skeleton-content">
                <div className="skeleton-line short"></div>
                <div className="skeleton-line medium"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="results-empty">
        {type === 'products' ? (
          <Package className="empty-icon" />
        ) : (
          <Users className="empty-icon" />
        )}
        <h3 className="empty-title">
          No {type} found
        </h3>
        <p className="empty-description">
          Try adjusting your search terms or filters
        </p>
      </div>
    );
  }

  const handleItemClick = (item: any) => {
    if (type === 'products') {
      setSelectedProduct(item.id);
    } else {
      setSelectedSupplier(item.id);
    }
  };

  const getSupplierPerformance = (supplier: any) => {
    const totalProducts = supplier.total_products || 0;
    const uniqueProducts = supplier.unique_products_restocked || 0;
    
    if (totalProducts === 0) return 'new';
    if (uniqueProducts >= 10) return 'excellent';
    if (uniqueProducts >= 5) return 'good';
    if (uniqueProducts >= 2) return 'fair';
    return 'poor';
  };

  const getProductSavingsPotential = (product: any) => {
    const currentPrice = product.current_cost || 0;
    const bestPrice = product.best_historical_price || currentPrice;
    
    if (currentPrice === 0 || bestPrice >= currentPrice) return 0;
    return ((currentPrice - bestPrice) / currentPrice) * 100;
  };

  return (
    <div className="results-list-container">
      <div className="results-header">
        <h2 className="results-title">
          {type} Search Results
        </h2>
        <p className="results-count">
          Found {results.length} {type}
        </p>
      </div>

      <div className="results-grid">
        {results.map((item) => (
          <div
            key={item.id}
            className="result-item"
            onClick={() => handleItemClick(item)}
            tabIndex={0}
          >
            {/* Icon */}
            <div className="result-icon-container">
              {type === 'products' ? (
                <div className="result-icon product">
                  <Package className="h-5 w-5" />
                </div>
              ) : (
                <div className="result-icon supplier">
                  <Users className="h-5 w-5" />
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="result-content">
              <h3 className="result-title">
                {item.name}
              </h3>
              
              {type === 'products' && (
                <div className="result-meta">
                  <span className="result-meta-item">Category: {item.category || 'N/A'}</span>
                  <span className="result-meta-item">Barcode: {item.barcode || 'N/A'}</span>
                </div>
              )}
              
              {type === 'suppliers' && (
                <div className="result-meta">
                  <span className="result-meta-item">Products: {item.total_products || 0}</span>
                  <span className="result-meta-item">Restocked: {item.unique_products_restocked || 0} items</span>
                </div>
              )}
            </div>

            {/* Metrics */}
            <div className="result-metrics">
              {type === 'products' && (
                <>
                  <div className="metric-group">
                    <div className="metric-value">
                      {item.current_cost?.toLocaleString('en-UG', {
                        style: 'currency',
                        currency: 'UGX'
                      })}
                    </div>
                    <div className="metric-label">Current Cost</div>
                  </div>
                  
                  {item.best_historical_price && (
                    <div className="metric-group">
                      <div className="metric-value" style={{color: 'var(--success)'}}>
                        {item.best_historical_price.toLocaleString('en-UG', {
                          style: 'currency',
                          currency: 'UGX'
                        })}
                      </div>
                      <div className="metric-label">Best Price</div>
                    </div>
                  )}
                  
                  {item.total_suppliers_used > 1 && (
                    <div className="metric-group">
                      <div className="savings-indicator">
                        <TrendingDown className="savings-icon" />
                        {getProductSavingsPotential(item).toFixed(1)}%
                      </div>
                      <div className="metric-label">Save Potential</div>
                    </div>
                  )}
                  
                  <div className="metric-group">
                    <div className="metric-value">
                      {item.total_suppliers_used || 1}
                    </div>
                    <div className="metric-label">Suppliers</div>
                  </div>
                </>
              )}

              {type === 'suppliers' && (
                <>
                  <div className="metric-group">
                    <div className="metric-value">
                      {item.current_inventory_value?.toLocaleString('en-UG', {
                        style: 'currency',
                        currency: 'UGX'
                      })}
                    </div>
                    <div className="metric-label">Inventory Value</div>
                  </div>
                  
                  <div className="metric-group">
                    <div className={`performance-badge ${getSupplierPerformance(item)}`}>
                      <Star className="h-4 w-4" />
                      <span className="capitalize">
                        {getSupplierPerformance(item)}
                      </span>
                    </div>
                    <div className="metric-label">Performance</div>
                  </div>
                  
                  {item.last_restock_date && (
                    <div className="metric-group">
                      <div className="date-indicator">
                        <Calendar className="date-icon" />
                        <span>
                          {new Date(item.last_restock_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="metric-label">Last Restock</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsList;