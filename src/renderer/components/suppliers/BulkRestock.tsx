// src/renderer/src/components/suppliers/BulkRestock.tsx
import React, { useState, useEffect } from 'react';
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
      newQuantities.set(suggestion.product_id, suggestion.suggested_quantity);
      newCosts.set(suggestion.product_id, suggestion.last_cost_price);
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

  const updateCost = (productId: number, cost: number) => {
    const newCosts = new Map(restockCosts);
    newCosts.set(productId, Math.max(0, cost));
    setRestockCosts(newCosts);
  };

  const handleBulkRestock = async () => {
    if (!selectedSupplier || selectedProducts.size === 0) {
      alert('Please select a supplier and at least one product');
      return;
    }

    try {
      setProcessing(true);
      const restockItems: BulkRestockItem[] = Array.from(selectedProducts.entries()).map(([productId, suggestion]) => ({
        productId,
        quantity: restockQuantities.get(productId) || suggestion.suggested_quantity,
        costPrice: restockCosts.get(productId) || suggestion.last_cost_price,
        batchNumber: `BULK-${Date.now()}`
      }));

      await supplierService.bulkRestockFromSupplier(selectedSupplier, restockItems);
      
      alert(`Successfully restocked ${restockItems.length} products`);
      
      // Reset form
      setSelectedProducts(new Map());
      setSelectedSupplier(null);
      setRestockQuantities(new Map());
      setRestockCosts(new Map());
      
      onRestockComplete();
      loadData();
    } catch (err: any) {
      alert(`Failed to process bulk restock: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const calculateTotalCost = () => {
    let total = 0;
    selectedProducts.forEach((suggestion, productId) => {
      const quantity = restockQuantities.get(productId) || suggestion.suggested_quantity;
      const cost = restockCosts.get(productId) || suggestion.last_cost_price;
      total += quantity * cost;
    });
    return total;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'priority-critical';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  if (loading) {
    return <div className="bulk-restock loading">Loading restock data...</div>;
  }

  return (
    <div className="bulk-restock">
      <div className="bulk-header">
        <h2>Bulk Restock Management</h2>
        <p>Restock multiple products from a single supplier in one operation</p>
      </div>

      <div className="bulk-layout">
        <div className="supplier-selection">
          <h3>Select Supplier</h3>
          <div className="suppliers-grid">
            {suppliers.map(supplier => (
              <div
                key={supplier.id}
                className={`supplier-card ${selectedSupplier === supplier.id ? 'selected' : ''}`}
                onClick={() => setSelectedSupplier(supplier.id)}
              >
                <h4>{supplier.name}</h4>
                <div className="supplier-stats">
                  <span>Products: {supplier.total_products || 0}</span>
                  <span>Restocked: {supplier.unique_products_restocked || 0}</span>
                  {supplier.last_restock_date && (
                    <span>Last: {new Date(supplier.last_restock_date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="products-selection">
          <h3>Select Products to Restock</h3>
          <div className="products-grid">
            {restockSuggestions.map(suggestion => (
              <div
                key={suggestion.product_id}
                className={`product-card ${getPriorityColor(suggestion.priority)} ${
                  selectedProducts.has(suggestion.product_id) ? 'selected' : ''
                }`}
              >
                <div className="product-header">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(suggestion.product_id)}
                    onChange={() => toggleProductSelection(suggestion)}
                  />
                  <h4>{suggestion.product_name}</h4>
                  <span className="priority-badge">{suggestion.priority}</span>
                </div>

                <div className="product-details">
                  <div className="detail-row">
                    <span>Current Stock:</span>
                    <span>{suggestion.current_quantity}</span>
                  </div>
                  <div className="detail-row">
                    <span>Min Stock:</span>
                    <span>{suggestion.min_stock}</span>
                  </div>
                  <div className="detail-row">
                    <span>Suggested Qty:</span>
                    <span>{suggestion.suggested_quantity}</span>
                  </div>
                  <div className="detail-row">
                    <span>Last Cost:</span>
                    <span>UGX {suggestion.last_cost_price.toLocaleString()}</span>
                  </div>
                </div>

                {selectedProducts.has(suggestion.product_id) && (
                  <div className="restock-controls">
                    <div className="control-group">
                      <label>Restock Quantity:</label>
                      <input
                        type="number"
                        value={restockQuantities.get(suggestion.product_id) || suggestion.suggested_quantity}
                        onChange={(e) => updateQuantity(suggestion.product_id, parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </div>
                    <div className="control-group">
                      <label>Cost Price (UGX):</label>
                      <input
                        type="number"
                        value={restockCosts.get(suggestion.product_id) || suggestion.last_cost_price}
                        onChange={(e) => updateCost(suggestion.product_id, parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="restock-summary">
          <h3>Restock Summary</h3>
          <div className="summary-content">
            <div className="summary-item">
              <span>Selected Supplier:</span>
              <span>
                {selectedSupplier 
                  ? suppliers.find(s => s.id === selectedSupplier)?.name 
                  : 'None selected'}
              </span>
            </div>
            <div className="summary-item">
              <span>Products to Restock:</span>
              <span>{selectedProducts.size}</span>
            </div>
            <div className="summary-item">
              <span>Total Quantity:</span>
              <span>
                {Array.from(selectedProducts.entries()).reduce((total, [productId]) => {
                  return total + (restockQuantities.get(productId) || 
                    selectedProducts.get(productId)?.suggested_quantity || 0);
                }, 0)}
              </span>
            </div>
            <div className="summary-item total-cost">
              <span>Total Cost:</span>
              <span>UGX {calculateTotalCost().toLocaleString()}</span>
            </div>

            <button
              className="btn-primary bulk-restock-btn"
              onClick={handleBulkRestock}
              disabled={!selectedSupplier || selectedProducts.size === 0 || processing}
            >
              {processing ? 'Processing...' : `Restock ${selectedProducts.size} Products`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkRestock;