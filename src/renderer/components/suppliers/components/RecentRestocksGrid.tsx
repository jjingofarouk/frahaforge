// src/renderer/components/suppliers/RecentRestocksGrid.tsx
import React, { useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { RecentRestock } from '../../../services/supplierService';
import { useSuppliersStore } from '../stores/suppliersStore';
import './RecentRestocksGrid.css';

interface RecentRestocksGridProps {
  restocks: RecentRestock[];
  isLoading: boolean;
}

// Extended interface to include batch_number safely
interface ExtendedRecentRestock extends RecentRestock {
  batch_number?: string;
}

const RecentRestocksGrid: React.FC<RecentRestocksGridProps> = ({ restocks, isLoading }) => {
  const { 
    setSelectedProduct, 
    calculateStats, 
    loadRecentRestocks,
    stats 
  } = useSuppliersStore();

  // Get only the 10 most recent restocks, sorted by date (newest first)
  const recentRestocks = useMemo(() => {
    return restocks
      .sort((a, b) => new Date(b.restock_date).getTime() - new Date(a.restock_date).getTime())
      .slice(0, 10);
  }, [restocks]);

  // Recalculate stats when restocks change
  useEffect(() => {
    if (restocks.length > 0) {
      console.log('🔄 RecentRestocksGrid: Recalculating stats with', restocks.length, 'restocks');
      calculateStats();
    }
  }, [restocks, calculateStats]);

  // Handle manual refresh
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    await loadRecentRestocks();
  };

  // Safe batch number access
  const getBatchNumber = (restock: RecentRestock): string | undefined => {
    return (restock as any).batch_number;
  };

  // Calculate performance metrics for display - using ALL restocks for accurate stats
  const calculatePerformanceMetrics = () => {
    const betterPriceCount = restocks.filter(restock => {
      if (!restock.current_cost_price || !restock.cost_price) return false;
      return restock.cost_price < restock.current_cost_price;
    }).length;

    const totalUnits = restocks.reduce((sum, restock) => sum + (restock.quantity || 0), 0);
    const uniqueSuppliers = new Set(restocks.map(restock => restock.supplier_id)).size;
    const totalSavings = restocks.reduce((total, restock) => {
      if (restock.current_cost_price && restock.cost_price && restock.cost_price < restock.current_cost_price) {
        return total + ((restock.current_cost_price - restock.cost_price) * (restock.quantity || 0));
      }
      return total;
    }, 0);

    return {
      betterPriceCount,
      totalUnits,
      uniqueSuppliers,
      totalSavings,
      totalRestocks: restocks.length
    };
  };

  const performanceMetrics = calculatePerformanceMetrics();

  if (isLoading) {
    return (
      <div className="restocks-loading">
        <div className="loading-header">
          <div className="loading-title">
            <RefreshCw className="loading-spinner" />
            <span>Loading Recent Restocks...</span>
          </div>
        </div>
        <div className="loading-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line title"></div>
              <div className="skeleton-line subtitle"></div>
              <div className="skeleton-line price"></div>
              <div className="skeleton-line meta"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (restocks.length === 0) {
    return (
      <div className="restocks-empty">
        <Clock className="empty-icon" />
        <h3 className="empty-title">No Recent Restocks</h3>
        <p className="empty-description">
          There are no recent supplier restocks to display.
        </p>
        <button 
          className="refresh-button"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriceTrend = (restock: RecentRestock) => {
    if (!restock.current_cost_price || !restock.cost_price) return 'neutral';
    return restock.cost_price < restock.current_cost_price ? 'positive' : 'negative';
  };

  const getPriceDifference = (restock: RecentRestock) => {
    if (!restock.current_cost_price || !restock.cost_price) return 0;
    return restock.current_cost_price - restock.cost_price;
  };

  const getSavingsPercentage = (restock: RecentRestock) => {
    if (!restock.current_cost_price || !restock.cost_price || restock.cost_price >= restock.current_cost_price) return 0;
    return ((restock.current_cost_price - restock.cost_price) / restock.current_cost_price) * 100;
  };

  return (
    <div className="restocks-grid-container">
      {/* Header with refresh button */}
      <div className="restocks-header">
        <div className="restocks-title-group">
          <h2>Recent Restocks</h2>
          <p>Showing 10 most recent supplier deliveries and price changes</p>
          <div className="restocks-count">
            {performanceMetrics.totalRestocks > 10 && (
              <span className="total-count">
                {performanceMetrics.totalRestocks} total restocks in system
              </span>
            )}
          </div>
        </div>
        <div className="restocks-actions">
          <button 
            className="refresh-button"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'spinning' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="view-all-button">
            View All Suppliers
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Real-time Stats Overview */}
      <div className="real-time-stats">
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-value">{performanceMetrics.totalRestocks}</div>
            <div className="stat-label">Total Restocks</div>
            <div className="stat-note">Showing 10 most recent</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{performanceMetrics.uniqueSuppliers}</div>
            <div className="stat-label">Suppliers Used</div>
          </div>
          <div className="stat-card">
            <div className="stat-value positive">{performanceMetrics.betterPriceCount}</div>
            <div className="stat-label">Better Prices</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{performanceMetrics.totalUnits.toLocaleString()}</div>
            <div className="stat-label">Total Units</div>
          </div>
          <div className="stat-card highlight">
            <div className="stat-value savings">
              {performanceMetrics.totalSavings.toLocaleString('en-UG', {
                style: 'currency',
                currency: 'UGX'
              })}
            </div>
            <div className="stat-label">Total Savings</div>
          </div>
        </div>
      </div>

      {/* Restocks Grid - Only showing 10 most recent */}
      <div className="restocks-grid">
        {recentRestocks.map((restock, index) => {
          const trend = getPriceTrend(restock);
          const priceDiff = getPriceDifference(restock);
          const savingsPercent = getSavingsPercentage(restock);
          const batchNumber = getBatchNumber(restock);
          
          return (
            <div
              key={`${restock.product_id}-${restock.restock_date}-${index}`}
              className="restock-card"
              onClick={() => setSelectedProduct(restock.product_id)}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${restock.product_name} from ${restock.supplier_name}`}
            >
              {/* Product Header */}
              <div className="restock-product-info">
                <h3 className="restock-product-name">
                  {restock.product_name}
                </h3>
                <p className="restock-supplier">
                  by {restock.supplier_name}
                  {restock.supplier_id === restock.current_supplier_id && (
                    <span className="current-supplier-badge">Current</span>
                  )}
                </p>
              </div>

              {/* Price Information */}
              <div className="restock-pricing">
                <div className="price-comparison">
                  <span className="price-label">Restock Price:</span>
                  <span className="price-value highlight">
                    {restock.cost_price?.toLocaleString('en-UG', {
                      style: 'currency',
                      currency: 'UGX'
                    })}
                  </span>
                </div>
                
                <div className="price-comparison">
                  <span className="price-label">Current Price:</span>
                  <span className="price-value">
                    {restock.current_cost_price?.toLocaleString('en-UG', {
                      style: 'currency',
                      currency: 'UGX'
                    })}
                  </span>
                </div>

                {/* Price Trend Indicator */}
                {trend !== 'neutral' && (
                  <div className={`price-trend-indicator ${trend}`}>
                    {trend === 'positive' ? (
                      <>
                        <TrendingDown className="trend-icon" />
                        <span className="trend-text">
                          Saved {priceDiff.toLocaleString('en-UG', {
                            style: 'currency',
                            currency: 'UGX'
                          })} ({savingsPercent.toFixed(1)}%)
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="trend-icon" />
                        <span className="trend-text">
                          Increased {Math.abs(priceDiff).toLocaleString('en-UG', {
                            style: 'currency',
                            currency: 'UGX'
                          })} ({Math.abs(savingsPercent).toFixed(1)}%)
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* No change indicator */}
                {trend === 'neutral' && restock.current_cost_price && restock.cost_price && (
                  <div className="price-trend-indicator neutral">
                    <span className="trend-text">No price change</span>
                  </div>
                )}
              </div>

              {/* Quantity and Batch Info */}
              <div className="restock-details">
                <div className="detail-item">
                  <span className="detail-label">Quantity:</span>
                  <span className="detail-value">{restock.quantity} units</span>
                </div>
                {batchNumber && (
                  <div className="detail-item">
                    <span className="detail-label">Batch:</span>
                    <span className="detail-value">{batchNumber}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="restock-meta">
                <span className="restock-date">
                  {formatDate(restock.restock_date)}
                </span>
                <span className="restock-id">
                  #{restock.product_id}
                </span>
              </div>

              {/* Click hint */}
              <div className="click-hint">
                Click to view supplier comparison
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Summary */}
      {restocks.length > 0 && (
        <div className="performance-summary">
          <div className="summary-header">
            <h4>Performance Summary</h4>
            <div className="summary-actions">
              <span className="last-updated">
                Updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <div className="summary-stats">
            <div className="summary-item">
              <div className="summary-value">
                {performanceMetrics.betterPriceCount} / {performanceMetrics.totalRestocks}
              </div>
              <div className="summary-label">Restocks with better prices</div>
            </div>
            
            <div className="summary-item">
              <div className="summary-value">
                {performanceMetrics.uniqueSuppliers}
              </div>
              <div className="summary-label">Unique suppliers used</div>
            </div>
            
            <div className="summary-item">
              <div className="summary-value">
                {performanceMetrics.totalUnits.toLocaleString()}
              </div>
              <div className="summary-label">Total units restocked</div>
            </div>
            
            <div className="summary-item highlight">
              <div className="summary-value savings">
                {performanceMetrics.totalSavings.toLocaleString('en-UG', {
                  style: 'currency',
                  currency: 'UGX'
                })}
              </div>
              <div className="summary-label">Total potential savings</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentRestocksGrid;