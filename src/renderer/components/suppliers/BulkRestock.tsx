// src/renderer/src/components/suppliers/BulkRestock.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, Package, TrendingUp, Users, RefreshCw, ShoppingCart, Plus, Minus } from 'lucide-react';
import { supplierService, BulkRestockItem } from '../../services/supplierService';
import { inventoryService, RestockSuggestion } from '../../services/inventoryService';
import './BulkRestock.css';

interface BulkRestockProps {
  onRestockComplete: () => void;
}

const BulkRestock: React.FC<BulkRestockProps> = ({ onRestockComplete }) => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [restockSuggestions, setRestockSuggestions] = useState<RestockSuggestion[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Map<number, RestockSuggestion>>(new Map());
  const [restockQuantities, setRestockQuantities] = useState<Map<number, number>>(new Map());
  const [restockCosts, setRestockCosts] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Search and filter states
  const [supplierSearch, setSupplierSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [supplierList, suggestions] = await Promise.all([
        supplierService.getSuppliers(),
        inventoryService.getRestockSuggestions()
      ]);
      setSuppliers(supplierList);
      setRestockSuggestions(suggestions);
    } catch (err: any) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
    );
  }, [suppliers, supplierSearch]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let filtered = restockSuggestions.filter(suggestion =>
      suggestion.product_name.toLowerCase().includes(productSearch.toLowerCase())
    );

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(suggestion => suggestion.priority === priorityFilter);
    }

    if (showSelectedOnly) {
      filtered = filtered.filter(suggestion => selectedProducts.has(suggestion.product_id));
    }

    return filtered;
  }, [restockSuggestions, productSearch, priorityFilter, showSelectedOnly, selectedProducts]);

  const toggleProductSelection = (suggestion: RestockSuggestion) => {
    const newSelected = new Map(selectedProducts);
    const newQuantities = new Map(restockQuantities);
    const newCosts = new Map(restockCosts);

    if (newSelected.has(suggestion.product_id)) {
      newSelected.delete(suggestion.product_id);
      newQuantities.delete(suggestion.product_id);
      newCosts.delete(suggestion.product_id);
    } else {
      newSelected.set(suggestion.product_id, suggestion);
      // Set default quantity to suggested quantity
      newQuantities.set(suggestion.product_id, suggestion.suggested_quantity);
      newCosts.set(suggestion.product_id, suggestion.last_cost_price || 0);
    }

    setSelectedProducts(newSelected);
    setRestockQuantities(newQuantities);
    setRestockCosts(newCosts);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const newQuantities = new Map(restockQuantities);
    newQuantities.set(productId, Math.max(0, quantity));
    setRestockQuantities(newQuantities);
  };

  const incrementQuantity = (productId: number) => {
    const current = restockQuantities.get(productId) || 0;
    updateQuantity(productId, current + 1);
  };

  const decrementQuantity = (productId: number) => {
    const current = restockQuantities.get(productId) || 0;
    updateQuantity(productId, Math.max(0, current - 1));
  };

  const updateCost = (productId: number, cost: number) => {
    const newCosts = new Map(restockCosts);
    newCosts.set(productId, Math.max(0, cost));
    setRestockCosts(newCosts);
  };

  const clearAllSelections = () => {
    setSelectedProducts(new Map());
    setRestockQuantities(new Map());
    setRestockCosts(new Map());
  };

  const handleBulkRestock = async () => {
    if (!selectedSupplier) {
      alert('Please select a supplier');
      return;
    }

    // Validate that all selected products have quantities > 0
    const invalidProducts = Array.from(selectedProducts.entries()).filter(([productId]) => {
      const quantity = restockQuantities.get(productId) || 0;
      return quantity <= 0;
    });

    if (invalidProducts.length > 0) {
      alert('Please enter restock quantities for all selected products');
      return;
    }

    if (selectedProducts.size === 0) {
      alert('Please select at least one product to restock');
      return;
    }

    try {
      setProcessing(true);
      const restockItems: BulkRestockItem[] = Array.from(selectedProducts.entries()).map(([productId, suggestion]) => ({
        productId,
        quantity: restockQuantities.get(productId) || 0,
        costPrice: restockCosts.get(productId) || (suggestion.last_cost_price || 0),
        batchNumber: `BULK-${Date.now()}`
      }));

      await supplierService.bulkRestockFromSupplier(selectedSupplier, restockItems);
      
      alert(`Successfully restocked ${restockItems.length} products`);
      
      // Reset form
      clearAllSelections();
      setSelectedSupplier(null);
      
      // Refresh data
      onRestockComplete();
      await loadData();
    } catch (err: any) {
      alert(`Failed to process bulk restock: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const calculateTotalCost = () => {
    let total = 0;
    selectedProducts.forEach((suggestion, productId) => {
      const quantity = restockQuantities.get(productId) || 0;
      const cost = restockCosts.get(productId) || (suggestion.last_cost_price || 0);
      total += quantity * cost;
    });
    return total;
  };

  const calculateTotalQuantity = () => {
    let total = 0;
    selectedProducts.forEach((_, productId) => {
      total += restockQuantities.get(productId) || 0;
    });
    return total;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      default: return '#16a34a';
    }
  };

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return 'out-of-stock';
    if (current <= min) return 'low-stock';
    return 'in-stock';
  };

  if (loading) {
    return (
      <div className="bulk-restock loading-state">
        <RefreshCw size={32} className="spin" />
        <h3>Loading restock data...</h3>
      </div>
    );
  }

  return (
    <div className="bulk-restock">
      {/* Header */}
      <div className="manager-header">
        <div className="header-content">
          <div className="header-text">
            <h2>
              <Package className="title-icon" />
              Bulk Restock Management
            </h2>
            <p>Restock multiple products from a single supplier in one operation</p>
          </div>
          <div className="header-actions">
            <button className="btn-refresh" onClick={loadData}>
              <RefreshCw size={16} />
              Refresh
            </button>
            {selectedProducts.size > 0 && (
              <button className="btn-bulk" onClick={handleBulkRestock} disabled={processing}>
                {processing ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    Restock {selectedProducts.size} Products
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bulk-layout">
        {/* Supplier Selection */}
        <div className="supplier-section">
          <div className="section-header">
            <h3>Select Supplier</h3>
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
              />
              {supplierSearch && (
                <button onClick={() => setSupplierSearch('')} className="clear-search">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="suppliers-list">
            {filteredSuppliers.map(supplier => (
              <div
                key={supplier.id}
                className={`supplier-item ${selectedSupplier === supplier.id ? 'selected' : ''}`}
                onClick={() => setSelectedSupplier(supplier.id)}
              >
                <div className="supplier-name">
                  {supplier.name}
                </div>
                {selectedSupplier === supplier.id && (
                  <div className="selected-indicator">✓</div>
                )}
              </div>
            ))}
            {filteredSuppliers.length === 0 && (
              <div className="empty-state">
                <Users size={32} />
                <h3>No suppliers found</h3>
                <p>Try adjusting your search terms</p>
              </div>
            )}
          </div>
        </div>

        {/* Products Selection */}
        <div className="products-section">
          <div className="section-header">
            <h3>Select Products to Restock</h3>
            <div className="products-controls">
              <div className="search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {productSearch && (
                  <button onClick={() => setProductSearch('')} className="clear-search">
                    <X size={14} />
                  </button>
                )}
              </div>
              
              <div className="filter-controls">
                <select 
                  value={priorityFilter} 
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={showSelectedOnly}
                    onChange={(e) => setShowSelectedOnly(e.target.checked)}
                  />
                  Show Selected Only
                </label>
              </div>
            </div>
          </div>

          <div className="products-list-container">
            {filteredProducts.map(suggestion => {
              const isSelected = selectedProducts.has(suggestion.product_id);
              const quantity = restockQuantities.get(suggestion.product_id) || 0;
              const stockStatus = getStockStatus(suggestion.current_quantity, suggestion.min_stock);
              
              return (
                <div
                  key={suggestion.product_id}
                  className={`product-item ${isSelected ? 'selected' : ''} ${stockStatus}`}
                >
                  <div className="product-main-info">
                    <div className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProductSelection(suggestion)}
                      />
                      <div className="checkmark"></div>
                    </div>
                    
                    <div className="product-details">
                      <div className="product-name">{suggestion.product_name}</div>
                      <div className="stock-info">
                        <span className={`stock-badge ${stockStatus}`}>
                          {suggestion.current_quantity} in stock
                        </span>
                        <span 
                          className="priority-dot"
                          style={{ backgroundColor: getPriorityColor(suggestion.priority) }}
                          title={suggestion.priority}
                        />
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="quantity-controls">
                      <div className="quantity-input-group">
                        <label>Quantity to Restock</label>
                        <div className="quantity-stepper">
                          <button 
                            type="button" 
                            className="quantity-btn"
                            onClick={() => decrementQuantity(suggestion.product_id)}
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => updateQuantity(suggestion.product_id, parseInt(e.target.value) || 0)}
                            min="0"
                            className="quantity-input"
                          />
                          <button 
                            type="button" 
                            className="quantity-btn"
                            onClick={() => incrementQuantity(suggestion.product_id)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="cost-input-group">
                        <label>Cost (UGX)</label>
                        <input
                          type="number"
                          value={restockCosts.get(suggestion.product_id) || ''}
                          onChange={(e) => updateCost(suggestion.product_id, parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="cost-input"
                        />
                      </div>
                      
                      <div className="line-total">
                        UGX {((restockQuantities.get(suggestion.product_id) || 0) * (restockCosts.get(suggestion.product_id) || 0)).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="empty-state">
                <Package size={32} />
                <h3>No products found</h3>
                <p>Try adjusting your search or filter criteria</p>
                {productSearch && (
                  <button 
                    onClick={() => setProductSearch('')}
                    className="btn-secondary"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Restock Summary */}
        <div className="summary-section">
          <div className="summary-header">
            <h3>Restock Summary</h3>
            {selectedProducts.size > 0 && (
              <button onClick={clearAllSelections} className="btn-clear">
                Clear All
              </button>
            )}
          </div>

          <div className="summary-content">
            <div className="summary-item">
              <span>Selected Supplier:</span>
              <span className={!selectedSupplier ? 'warning' : ''}>
                {selectedSupplier 
                  ? suppliers.find(s => s.id === selectedSupplier)?.name 
                  : 'None selected'}
              </span>
            </div>
            
            <div className="summary-item">
              <span>Products Selected:</span>
              <span>{selectedProducts.size}</span>
            </div>
            
            <div className="summary-item">
              <span>Total Quantity:</span>
              <span>{calculateTotalQuantity().toLocaleString()}</span>
            </div>
            
            <div className="products-breakdown">
              <h4>Selected Products:</h4>
              <div className="products-list">
                {Array.from(selectedProducts.entries()).map(([productId, suggestion]) => (
                  <div key={productId} className="product-line">
                    <span className="product-name">{suggestion.product_name}</span>
                    <span className="product-qty">
                      {restockQuantities.get(productId) || 0} × UGX {(restockCosts.get(productId) || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="summary-item total-cost">
              <span>Total Cost:</span>
              <span>UGX {calculateTotalCost().toLocaleString()}</span>
            </div>

            <button
              className="action primary bulk-restock-btn"
              onClick={handleBulkRestock}
              disabled={!selectedSupplier || selectedProducts.size === 0 || processing}
            >
              {processing ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  Processing...
                </>
              ) : (
                `Restock ${selectedProducts.size} Products`
              )}
            </button>

            {selectedProducts.size > 0 && (
              <div className="validation-note">
                * Please ensure all quantities are entered before proceeding
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkRestock;