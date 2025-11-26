// src/renderer/src/components/suppliers/SupplierComparison.tsx
import React, { useState, useEffect } from 'react';
import { supplierService, ProductSupplierComparison } from '../../services/supplierService';
import { inventoryService } from '../../services/inventoryService';
import './SupplierComparison.css';

const SupplierComparison: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [comparisonData, setComparisonData] = useState<ProductSupplierComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadComparisonData(selectedProduct);
    }
  }, [selectedProduct]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadComparisonData = async (productId: number) => {
    try {
      const data = await supplierService.getProductSupplierComparison(productId);
      setComparisonData(data);
    } catch (err: any) {
      console.error('Failed to load comparison data:', err);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBestSupplier = () => {
    if (!comparisonData || comparisonData.supplier_comparison.length === 0) return null;
    
    return comparisonData.supplier_comparison.reduce((best, current) =>
      current.average_cost_price < best.average_cost_price ? current : best
    );
  };

  const getMostReliableSupplier = () => {
    if (!comparisonData || comparisonData.supplier_comparison.length === 0) return null;
    
    return comparisonData.supplier_comparison.reduce((best, current) =>
      current.total_restocks > best.total_restocks ? current : best
    );
  };

  const renderProductList = () => {
    if (loading) return <div className="loading">Loading products...</div>;

    return (
      <div className="product-selection">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="products-list">
          {filteredProducts.slice(0, 20).map(product => (
            <div
              key={product.id}
              className={`product-item ${selectedProduct === product.id ? 'selected' : ''}`}
              onClick={() => setSelectedProduct(product.id)}
            >
              <div className="product-info">
                <h4>{product.name}</h4>
                <span className="product-category">{product.category}</span>
                <span className="product-stock">Stock: {product.quantity}</span>
              </div>
              <div className="product-price">
                <span>UGX {parseFloat(product.cost_price).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderComparison = () => {
    if (!selectedProduct) {
      return (
        <div className="no-selection">
          <p>Select a product to compare suppliers</p>
        </div>
      );
    }

    if (!comparisonData) {
      return <div className="loading">Loading supplier comparison...</div>;
    }

    const bestSupplier = getBestSupplier();
    const mostReliableSupplier = getMostReliableSupplier();

    return (
      <div className="comparison-results">
        <div className="comparison-header">
          <h3>{comparisonData.product.name} - Supplier Comparison</h3>
          <div className="current-supplier">
            <strong>Current Supplier:</strong> {comparisonData.product.current_supplier}
            <br />
            <strong>Current Cost:</strong> UGX {Number(comparisonData.product.current_cost_price).toLocaleString()}
          </div>
        </div>

        {bestSupplier && mostReliableSupplier && (
          <div className="supplier-recommendations">
            <div className="recommendation-card best-price">
              <h4>💰 Best Price</h4>
              <div className="supplier-info">
                <strong>{bestSupplier.supplier_name}</strong>
                <p>Average Cost: UGX {bestSupplier.average_cost_price.toLocaleString()}</p>
                <p>Total Restocks: {bestSupplier.total_restocks}</p>
                <p>Best Price: UGX {bestSupplier.best_price.toLocaleString()}</p>
              </div>
              <button className="btn-primary">Switch to this Supplier</button>
            </div>

            <div className="recommendation-card most-reliable">
              <h4>⭐ Most Reliable</h4>
              <div className="supplier-info">
                <strong>{mostReliableSupplier.supplier_name}</strong>
                <p>Total Restocks: {mostReliableSupplier.total_restocks}</p>
                <p>Products Supplied: {mostReliableSupplier.total_quantity_supplied}</p>
                <p>Last Supply: {new Date(mostReliableSupplier.last_supply_date).toLocaleDateString()}</p>
              </div>
              <button className="btn-primary">Switch to this Supplier</button>
            </div>
          </div>
        )}

        <div className="suppliers-table">
          <h4>All Suppliers Comparison</h4>
          <div className="table-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Avg Cost Price</th>
                  <th>Best Price</th>
                  <th>Worst Price</th>
                  <th>Total Restocks</th>
                  <th>Total Quantity</th>
                  <th>Last Supply</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.supplier_comparison.map(supplier => (
                  <tr key={supplier.supplier_id} className={
                    supplier.supplier_id === comparisonData.product.current_supplier_id ? 'current-supplier-row' : ''
                  }>
                    <td>
                      <strong>{supplier.supplier_name}</strong>
                      {supplier.supplier_id === comparisonData.product.current_supplier_id && (
                        <span className="current-badge">Current</span>
                      )}
                    </td>
                    <td>UGX {supplier.average_cost_price.toLocaleString()}</td>
                    <td className="best-price-cell">UGX {supplier.best_price.toLocaleString()}</td>
                    <td className="worst-price-cell">UGX {supplier.worst_price.toLocaleString()}</td>
                    <td>{supplier.total_restocks}</td>
                    <td>{supplier.total_quantity_supplied}</td>
                    <td>{new Date(supplier.last_supply_date).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-primary">Switch</button>
                      <button className="btn-secondary">Contact</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="comparison-summary">
          <h4>Summary</h4>
          <div className="summary-stats">
            <div className="summary-stat">
              <span>Total Suppliers:</span>
              <span>{comparisonData.summary.total_suppliers}</span>
            </div>
            <div className="summary-stat">
              <span>Price Range:</span>
              <span>UGX {comparisonData.summary.price_range.toLocaleString()}</span>
            </div>
            <div className="summary-stat">
              <span>Potential Savings:</span>
              <span className="savings">
                UGX {(
                  Number(comparisonData.product.current_cost_price) - 
                  (bestSupplier?.average_cost_price || 0)
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="supplier-comparison">
      <div className="comparison-header">
        <h2>Product-Supplier Price Comparison</h2>
        <p>Compare suppliers to find the best prices and most reliable partners</p>
      </div>

      <div className="comparison-layout">
        <div className="product-panel">
          {renderProductList()}
        </div>
        
        <div className="comparison-panel">
          {renderComparison()}
        </div>
      </div>
    </div>
  );
};

export default SupplierComparison;