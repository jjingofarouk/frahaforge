// src/renderer/components/suppliers/ComparisonView.tsx
import React from 'react';
import { ArrowLeft, Star, TrendingUp, TrendingDown, Package, Users, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { ProductSupplierComparison, SupplierProductPortfolio } from '../../../services/supplierService';
import { useSuppliersStore } from '../stores/suppliersStore';
import SupplierMetricsCard from './SupplierMetricsCard';
import './ComparisonView.css';

interface ComparisonViewProps {
  data: ProductSupplierComparison | SupplierProductPortfolio;
  type: 'product' | 'supplier';
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ data, type }) => {
  const { setView, setSelectedProduct, setSelectedSupplier } = useSuppliersStore();

  const handleBack = () => {
    setView('dashboard');
    setSelectedProduct(null);
    setSelectedSupplier(null);
  };

  const isProductComparison = (data: any): data is ProductSupplierComparison => {
    return type === 'product';
  };

  const getSupplierRating = (supplier: any) => {
    const restocks = supplier.total_restocks || 0;
    const quantity = supplier.total_quantity_supplied || 0;
    
    if (restocks >= 10 && quantity >= 1000) return 5;
    if (restocks >= 5 && quantity >= 500) return 4;
    if (restocks >= 2 && quantity >= 100) return 3;
    if (restocks >= 1) return 2;
    return 1;
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (!amount && amount !== 0) return 'UGX 0';
    return `UGX ${amount.toLocaleString(undefined, {
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderProductComparison = (comparison: ProductSupplierComparison) => {
    const { product, supplier_comparison, summary } = comparison;

    return (
      <div className="comparison-container">
        {/* Header */}
        <div className="comparison-header">
          <button
            onClick={handleBack}
            className="back-button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div className="comparison-title-section">
            <h1 className="comparison-title">{product.name}</h1>
            <p className="comparison-subtitle">
              Comparing {supplier_comparison.length} suppliers for this product
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="comparison-metrics-grid">
          <SupplierMetricsCard
            title="Current Cost"
            value={formatCurrency(product.current_cost_price)}
            description="From current supplier"
            trend="neutral"
          />
          <SupplierMetricsCard
            title="Best Price"
            value={formatCurrency(summary.best_supplier?.average_cost_price)}
            description={`From ${summary.best_supplier?.supplier_name}`}
            trend="down"
          />
          <SupplierMetricsCard
            title="Price Range"
            value={formatCurrency(summary.price_range)}
            description="Across all suppliers"
            trend="neutral"
          />
          <SupplierMetricsCard
            title="Potential Savings"
            value={((product.current_cost_price - (summary.best_supplier?.average_cost_price || 0)) / product.current_cost_price * 100).toFixed(1) + '%'}
            description="Switch to best supplier"
            trend="up"
          />
        </div>

        {/* Suppliers Comparison Table */}
        <div className="comparison-table-container">
          <div className="vpt-table-header">
            <div className="vpt-header-row">
              <div className="vpt-header-cell">Supplier</div>
              <div className="vpt-header-cell">Performance</div>
              <div className="vpt-header-cell">Avg. Cost</div>
              <div className="vpt-header-cell">Best Price</div>
              <div className="vpt-header-cell">Total Supplied</div>
              <div className="vpt-header-cell">Last Supply</div>
            </div>
          </div>
          
          <div className="vpt-table-body">
            {supplier_comparison.length === 0 ? (
              <div className="vpt-empty-state">
                <Users size={48} className="vpt-empty-icon" />
                <div className="vpt-empty-text">No suppliers found</div>
                <div className="vpt-empty-subtext">No suppliers have supplied this product yet</div>
              </div>
            ) : (
              <div className="vpt-table-rows">
                {supplier_comparison.map((supplier, index) => {
                  const isCurrent = supplier.supplier_id === product.current_supplier_id;
                  const isBest = supplier.supplier_id === summary.best_supplier?.supplier_id;
                  const rating = getSupplierRating(supplier);
                  
                  return (
                    <div 
                      key={supplier.supplier_id}
                      className={`vpt-virtual-row ${index % 2 === 0 ? 'vpt-virtual-row-even' : 'vpt-virtual-row-odd'} ${isCurrent ? 'current-supplier' : ''} ${isBest ? 'best-supplier' : ''}`}
                      onClick={() => setSelectedSupplier(supplier.supplier_id)}
                      tabIndex={0}
                    >
                      <div className="vpt-virtual-cell">
                        <div className="supplier-cell">
                          <div className="supplier-avatar">
                            <Users className="supplier-avatar-icon" />
                          </div>
                          <div className="supplier-info">
                            <div className="supplier-name">
                              {supplier.supplier_name}
                              <div className="supplier-badges">
                                {isCurrent && (
                                  <span className="supplier-badge current">
                                    <CheckCircle size={12} />
                                    Current
                                  </span>
                                )}
                                {isBest && (
                                  <span className="supplier-badge best">
                                    <TrendingDown size={12} />
                                    Best Price
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="vpt-virtual-cell">
                        <div className="rating-container">
                          <div className="star-rating">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`star ${i < rating ? 'filled' : 'empty'}`}
                                size={14}
                              />
                            ))}
                          </div>
                          <span className="rating-count">
                            ({supplier.total_restocks} orders)
                          </span>
                        </div>
                      </div>
                      <div className="vpt-virtual-cell">
                        <span className="vpt-price">{formatCurrency(supplier.average_cost_price)}</span>
                      </div>
                      <div className="vpt-virtual-cell">
                        <span className="best-price">{formatCurrency(supplier.best_price)}</span>
                      </div>
                      <div className="vpt-virtual-cell">
                        <span className="vpt-price">{supplier.total_quantity_supplied?.toLocaleString()} units</span>
                      </div>
                      <div className="vpt-virtual-cell">
                        <span className="vpt-category">
                          {supplier.last_supply_date 
                            ? formatDate(supplier.last_supply_date)
                            : 'Never'
                          }
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recommendation */}
        {summary.best_supplier && summary.best_supplier.supplier_id !== product.current_supplier_id && (
          <div className="recommendation-banner">
            <div className="recommendation-content">
              <TrendingDown className="recommendation-icon" />
              <div className="recommendation-text">
                <h3>Cost Saving Opportunity</h3>
                <p>
                  Switch to {summary.best_supplier.supplier_name} could save{' '}
                  {((product.current_cost_price - summary.best_supplier.average_cost_price) / product.current_cost_price * 100).toFixed(1)}%
                  on this product
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSupplierPortfolio = (portfolio: SupplierProductPortfolio) => {
    const { supplier, products, performance } = portfolio;

    // Show ALL products - both current supplier products and historically supplied products
    const allSuppliedProducts = products;

    return (
      <div className="comparison-container">
        {/* Header */}
        <div className="comparison-header">
          <button
            onClick={handleBack}
            className="back-button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div className="comparison-title-section">
            <h1 className="comparison-title">{supplier.name}</h1>
            <p className="comparison-subtitle">
              Product portfolio and performance analysis
            </p>
          </div>
        </div>

        {/* Supplier Performance Stats */}
        <div className="comparison-metrics-grid">
          <SupplierMetricsCard
            title="Total Products"
            value={performance.unique_products_supplied?.toString()}
            description="Unique items supplied"
            trend="neutral"
          />
          <SupplierMetricsCard
            title="Total Units"
            value={performance.total_units_supplied?.toLocaleString()}
            description="All-time supplied"
            trend="up"
          />
          <SupplierMetricsCard
            title="Avg. Cost"
            value={formatCurrency(performance.average_cost_across_products)}
            description="Across all products"
            trend="neutral"
          />
          <SupplierMetricsCard
            title="Price Variability"
            value={formatCurrency(performance.price_variability)}
            description="Cost consistency"
            trend="down"
          />
        </div>

        {/* Products Table */}
        <div className="comparison-table-container">
          <div className="portfolio-header">
            <h3 className="portfolio-title">Supplied Products</h3>
            <div className="portfolio-stats">
              {allSuppliedProducts.length} products • {performance.total_restock_events} restocks
            </div>
          </div>
          
          <div className="vpt-table-header">
            <div className="vpt-header-row">
              <div className="vpt-header-cell">Product</div>
              <div className="vpt-header-cell">Relationship</div>
              <div className="vpt-header-cell">Current Stock</div>
              <div className="vpt-header-cell">Current Cost</div>
              <div className="vpt-header-cell">Times Supplied</div>
              <div className="vpt-header-cell">Best Price</div>
              <div className="vpt-header-cell">Savings Potential</div>
            </div>
          </div>
          
          <div className="vpt-table-body">
            {allSuppliedProducts.length === 0 ? (
              <div className="vpt-empty-state">
                <Package className="vpt-empty-icon" size={48} />
                <h3>No Products Supplied</h3>
                <p>This supplier hasn't supplied any products yet.</p>
              </div>
            ) : (
              <div className="vpt-table-rows">
                {allSuppliedProducts.map((product, index) => {
                  const isCurrentSupplier = product.supplier_relationship === 'current';
                  const savingsPotential = ((product.current_cost - product.best_price_from_supplier) / product.current_cost * 100);
                  const stockStatus = product.quantity === 0 ? 'out-of-stock' : 
                                    product.quantity <= 10 ? 'low-stock' : 'in-stock';
                  
                  return (
                    <div 
                      key={product.id}
                      className={`vpt-virtual-row ${index % 2 === 0 ? 'vpt-virtual-row-even' : 'vpt-virtual-row-odd'} clickable-row`}
                      onClick={() => setSelectedProduct(product.id)}
                      tabIndex={0}
                    >
                      <div className="vpt-virtual-cell">
                        <div className="product-cell">
                          <div className="product-avatar">
                            <Package className="product-avatar-icon" />
                          </div>
                          <div className="product-info">
                            <div className="product-name">
                              {product.name}
                            </div>
                            <div className="product-category">
                              {product.category}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="vpt-virtual-cell">
                        <div className="relationship-badge">
                          {isCurrentSupplier ? (
                            <span className="relationship-current">
                              <CheckCircle size={12} />
                              Current Supplier
                            </span>
                          ) : (
                            <span className="relationship-historical">
                              <Clock size={12} />
                              Historical Supplier
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="vpt-virtual-cell">
                        <span className={`stock-badge ${stockStatus}`}>
                          {product.quantity} units
                        </span>
                      </div>
                      <div className="vpt-virtual-cell">
                        <span className="vpt-price">{formatCurrency(product.current_cost)}</span>
                      </div>
                      <div className="vpt-virtual-cell">
                        <div className="times-supplied">
                          {product.times_supplied || 0} times
                        </div>
                      </div>
                      <div className="vpt-virtual-cell">
                        <span className="best-price">{formatCurrency(product.best_price_from_supplier)}</span>
                      </div>
                      <div className="vpt-virtual-cell">
                        {savingsPotential > 0 ? (
                          <div className="savings-indicator positive">
                            <TrendingDown className="savings-icon" />
                            {savingsPotential.toFixed(1)}%
                          </div>
                        ) : product.times_supplied > 0 ? (
                          <span className="savings-indicator neutral">No better price</span>
                        ) : (
                          <span className="savings-indicator no-data">No data</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>


      </div>
    );
  };

  return isProductComparison(data) 
    ? renderProductComparison(data)
    : renderSupplierPortfolio(data);
};

export default ComparisonView;