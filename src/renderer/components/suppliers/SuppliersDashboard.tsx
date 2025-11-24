// src/renderer/components/suppliers/SuppliersDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useSuppliersStore } from './stores/suppliersStore';
import SearchAndFilters from './components/SearchAndFilters';
import RecentRestocksGrid from './components/RecentRestocksGrid';
import ComparisonView from './components/ComparisonView';
import ResultsList from './components/ResultsList';
import { Package, Users, RotateCcw, Activity, TrendingUp, TrendingDown, Truck, DollarSign, Percent, Users as UsersIcon } from 'lucide-react';
import './SuppliersDashboard.css';

const SuppliersDashboard: React.FC = () => {
  const {
    currentView,
    recentRestocks,
    searchResults,
    comparisonData,
    portfolioData,
    stats,
    isLoading,
    setView,
    loadRecentRestocks,
    loadAllSuppliers,
  } = useSuppliersStore();

  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    console.log('🔄 SuppliersDashboard: Initial data load');
    loadRecentRestocks();
    loadAllSuppliers();
  }, [loadRecentRestocks, loadAllSuppliers]);

  // Debug effect to log data changes
  useEffect(() => {
    console.log('📊 Recent Restocks Data:', {
      count: recentRestocks.length,
      items: recentRestocks.slice(0, 3),
      total: recentRestocks.length
    });
  }, [recentRestocks]);

  useEffect(() => {
    console.log('📈 Stats Data:', stats);
  }, [stats]);

  // Live status indicator effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsLive(prev => !prev);
    }, 2000); // Blink every 2 seconds
    
    return () => clearInterval(interval);
  }, []);

  const navigationTabs = [
    {
      id: 'dashboard' as const,
      label: 'Recent Restocks',
      icon: <RotateCcw className="h-4 w-4" />,
      searchType: 'both' as const,
      cssClass: 'recent-restocks',
    },
    {
      id: 'product-search' as const,
      label: 'Product Analysis',
      icon: <Package className="h-4 w-4" />,
      searchType: 'products' as const,
      cssClass: 'product-analysis',
    },
    {
      id: 'supplier-search' as const,
      label: 'Supplier Portfolio',
      icon: <Users className="h-4 w-4" />,
      searchType: 'suppliers' as const,
      cssClass: 'supplier-portfolio',
    },
  ];

  const getCurrentTabSearchType = () => {
    const tab = navigationTabs.find(t => t.id === currentView);
    return tab?.searchType ?? 'both';
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <RecentRestocksGrid restocks={recentRestocks} isLoading={isLoading} />;
      case 'product-search':
      case 'supplier-search':
        return (
          <ResultsList
            results={searchResults}
            type={currentView === 'product-search' ? 'products' : 'suppliers'}
            isLoading={isLoading}
          />
        );
      case 'comparison':
        return comparisonData ? (
          <ComparisonView data={comparisonData} type="product" />
        ) : (
          <div className="empty-state">
            <div className="empty-state-title">No comparison data available</div>
          </div>
        );
      case 'portfolio':
        return portfolioData ? (
          <ComparisonView data={portfolioData} type="supplier" />
        ) : (
          <div className="empty-state">
            <div className="empty-state-title">No portfolio data available</div>
          </div>
        );
      default:
        return <RecentRestocksGrid restocks={recentRestocks} isLoading={isLoading} />;
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX'
    }).format(amount);
  };

  // Calculate trends based on data - Fixed TypeScript types
  const getTotalSuppliersTrend = (): 'up' | 'down' | 'neutral' => {
    return stats.totalSuppliers > 0 ? 'up' : 'neutral';
  };

  const getRecentRestocksTrend = (): 'up' | 'down' | 'neutral' => {
    return stats.recentRestocks > 0 ? 'up' : 'neutral';
  };

  const getPriceVarianceTrend = (): 'up' | 'down' | 'neutral' => {
    return stats.averagePriceVariance < 20 ? 'down' : 'up';
  };

  const getSavingsTrend = (): 'up' | 'down' | 'neutral' => {
    return stats.potentialSavings > 0 ? 'up' : 'neutral';
  };

  // Helper function to render trend icon
  const renderTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={14} />;
      case 'down':
        return <TrendingDown size={14} />;
      case 'neutral':
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="suppliers-dashboard">
      {/* Header */}
      <div className="suppliers-header">
        <div className="suppliers-header-main">
          <div className="suppliers-header-top">
            <div className="suppliers-header-content">
              {/* Main Header Row */}
              <div className="header-main-row">
                <div className="header-title-section">
                  <h1 className="suppliers-title">Supplier Management</h1>
                  <p className="suppliers-subtitle">
                    Monitor supplier performance and optimize purchasing decisions
                  </p>
                </div>
                
                {/* Live Status Indicator */}
                <div className="live-status-indicator">
                  <div className={`live-dot ${isLive ? 'live' : 'pulse'}`} />
                  <Activity className="live-icon" size={14} />
                  <span className="live-text">Live Data</span>
                </div>
              </div>
              
              {/* Data Status Bar */}
              <div className="data-status-bar">
                <div className="data-stats">
                  <span className="data-stat-item">
                    <strong>{recentRestocks.length}</strong> recent restocks
                  </span>
                  <span className="data-stat-divider">•</span>
                  <span className="data-stat-item">
                    <strong>{stats.totalSuppliers}</strong> active suppliers
                  </span>
                  <span className="data-stat-divider">•</span>
                  <span className="data-stat-item">
                    <strong>{stats.totalUnitsRestocked.toLocaleString()}</strong> units restocked
                  </span>
                </div>
                <div className="data-timestamp">
                  Updated just now
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="suppliers-navigation">
              <nav className="navigation-tabs" role="tablist">
                {navigationTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setView(tab.id)}
                    className={`navigation-tab ${currentView === tab.id ? `active ${tab.cssClass}` : ''}`}
                    role="tab"
                    aria-selected={currentView === tab.id}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <SearchAndFilters
          allowedSearchType={getCurrentTabSearchType()}
          currentView={currentView}
        />
      </div>

      {/* Main Content */}
      <div className="suppliers-main-content">
        <div className="suppliers-container">
          {/* Quick Metrics - Updated to smaller cards */}
          {currentView === 'dashboard' && (
            <div className="suppliers-metrics-grid">
              <div className="supplier-stat-card">
                <div className="stat-card__header">
                  <div className="stat-card__icon-wrapper">
                    <UsersIcon className="stat-card__icon" size={20} />
                  </div>
                  <div className="stat-card__label">Total Suppliers</div>
                </div>
                <div className="stat-card__value">{stats.totalSuppliers}</div>
                <div className="stat-card__footer">
                  <div className="stat-card__description">Active suppliers in system</div>
                  <div className={`stat-card__change stat-card__change--${getTotalSuppliersTrend()}`}>
                    {renderTrendIcon(getTotalSuppliersTrend())}
                  </div>
                </div>
              </div>

              <div className="supplier-stat-card">
                <div className="stat-card__header">
                  <div className="stat-card__icon-wrapper">
                    <Truck className="stat-card__icon" size={20} />
                  </div>
                  <div className="stat-card__label">Recent Restocks</div>
                </div>
                <div className="stat-card__value">{stats.recentRestocks}</div>
                <div className="stat-card__footer">
                  <div className="stat-card__description">
                    {stats.uniqueSuppliersUsed} suppliers • {stats.totalUnitsRestocked.toLocaleString()} units
                  </div>
                  <div className={`stat-card__change stat-card__change--${getRecentRestocksTrend()}`}>
                    {renderTrendIcon(getRecentRestocksTrend())}
                  </div>
                </div>
              </div>

              <div className="supplier-stat-card">
                <div className="stat-card__header">
                  <div className="stat-card__icon-wrapper">
                    <Percent className="stat-card__icon" size={20} />
                  </div>
                  <div className="stat-card__label">Avg. Price Variance</div>
                </div>
                <div className="stat-card__value">{stats.averagePriceVariance.toFixed(1)}%</div>
                <div className="stat-card__footer">
                  <div className="stat-card__description">{stats.betterPriceRestocks} better prices</div>
                  <div className={`stat-card__change stat-card__change--${getPriceVarianceTrend()}`}>
                    {renderTrendIcon(getPriceVarianceTrend())}
                  </div>
                </div>
              </div>

              <div className="supplier-stat-card">
                <div className="stat-card__header">
                  <div className="stat-card__icon-wrapper">
                    <DollarSign className="stat-card__icon" size={20} />
                  </div>
                  <div className="stat-card__label">Potential Savings</div>
                </div>
                <div className="stat-card__value">
                  {formatCurrency(stats.potentialSavings).replace('UGX', 'USh')}
                </div>
                <div className="stat-card__footer">
                  <div className="stat-card__description">From recent restocks</div>
                  <div className={`stat-card__change stat-card__change--${getSavingsTrend()}`}>
                    {renderTrendIcon(getSavingsTrend())}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main View */}
          <div className="suppliers-content-card">
            {renderCurrentView()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuppliersDashboard;