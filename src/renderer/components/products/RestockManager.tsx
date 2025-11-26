// src/renderer/src/components/products/RestockManager.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Truck,
  AlertTriangle,
  Zap,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  X,
  ChevronRight,
  Clock,
  DollarSign,
  Box,
  ArrowUpRight,
} from 'lucide-react';
import { inventoryService, RestockSuggestion, SupplierPerformance } from '../../services/inventoryService';
import { supplierService } from '../../services/supplierService';
import './RestockManager.css';

interface RestockManagerProps {
  onRestockComplete: () => void;
}

const RestockManager: React.FC<RestockManagerProps> = ({ onRestockComplete }) => {
  const [suggestions, setSuggestions] = useState<RestockSuggestion[]>([]);
  const [supplierPerformance, setSupplierPerformance] = useState<SupplierPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [bulkRestockMode, setBulkRestockMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [restockSuggestions, supplierPerf] = await Promise.all([
        inventoryService.getRestockSuggestions(),
        inventoryService.getSupplierPerformance(),
      ]);
      setSuggestions(restockSuggestions);
      setSupplierPerformance(supplierPerf);
    } catch (err: any) {
      console.error('Failed to load restock data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    newSelected.has(productId) ? newSelected.delete(productId) : newSelected.add(productId);
    setSelectedProducts(newSelected);
  };

  const handleBulkRestock = async (supplierId: number) => {
    try {
      const restockItems = suggestions
        .filter(s => selectedProducts.has(s.product_id))
        .map(s => ({
          productId: s.product_id,
          quantity: s.suggested_quantity,
          costPrice: s.suggested_cost_price || s.last_cost_price || 0,
          batchNumber: `BULK-${Date.now()}`,
        }));

      await supplierService.bulkRestockFromSupplier(supplierId, restockItems);
      alert(`Successfully restocked ${restockItems.length} products`);
      setSelectedProducts(new Set());
      setBulkRestockMode(false);
      onRestockComplete();
      loadData();
    } catch (err: any) {
      alert(`Failed to restock: ${err.message}`);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="icon" size={22} />;
      case 'high':     return <Zap          className="icon" size={22} />;
      case 'medium':   return <Clock        className="icon" size={22} />;
      default:         return <TrendingUp   className="icon" size={22} />;
    }
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'UGX 0';
    return `UGX ${value.toLocaleString()}`;
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '0';
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div className="restock-manager">
        <div className="loading-state">
          <RefreshCw className="spin" size={40} />
          <p>Loading smart restock suggestions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="restock-manager">
        <motion.div className="manager-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="header-content">
            <h2>
              <Package className="title-icon" size={32} />
              Smart Restock Suggestions
            </h2>
            <div className="header-actions">
              {selectedProducts.size > 0 && (
                <motion.button
                  className="btn-bulk"
                  onClick={() => setBulkRestockMode(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Truck size={18} />
                  Bulk Restock ({selectedProducts.size})
                </motion.button>
              )}
              <motion.button
                className="btn-refresh"
                onClick={loadData}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <RefreshCw size={18} />
                Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="suggestions-grid">
          {suggestions.map((suggestion, index) => (
            <motion.article
              key={suggestion.product_id}
              className="suggestion-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8 }}
            >
              <header className="card-header">
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(suggestion.product_id)}
                    onChange={() => toggleProductSelection(suggestion.product_id)}
                  />
                  <span className="checkmark" />
                </label>
                {getPriorityIcon(suggestion.priority)}
                <h3>{suggestion.product_name}</h3>
              </header>

              <div className="card-body">
                <div className="metrics-grid">
                  <div className="metric">
                    <span className="label">Current Stock</span>
                    <strong className={`value ${suggestion.current_quantity <= 10 ? 'low' : ''}`}>
                      {formatNumber(suggestion.current_quantity)}
                    </strong>
                  </div>
                  <div className="metric">
                    <span className="label">Suggested Qty</span>
                    <strong className="value highlight">
                      <ArrowUpRight size={16} />
                      {formatNumber(suggestion.suggested_quantity)}
                    </strong>
                  </div>
                  <div className="metric">
                    <span className="label">Last 30 Days Sold</span>
                    <strong className="value">{formatNumber(suggestion.sold_last_30_days)}</strong>
                  </div>
                  <div className="metric">
                    <span className="label">Est. Cost</span>
                    <strong className="value price">
                      <DollarSign size={16} />
                      {formatCurrency(suggestion.suggested_cost_price || suggestion.last_cost_price)}
                    </strong>
                  </div>
                </div>

                <div className="supplier-tag">
                  <Truck size={14} />
                  {suggestion.suggested_supplier || 'No supplier assigned'}
                </div>
              </div>

              <footer className="card-actions">
                <motion.button className="action primary" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Box size={16} />
                  Quick Restock
                </motion.button>
                <motion.button className="action secondary" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  Compare Suppliers
                  <ChevronRight size={16} />
                </motion.button>
              </footer>
            </motion.article>
          ))}
        </div>

        {suggestions.length === 0 && (
          <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CheckCircle2 size={64} />
            <h3>All products are well-stocked</h3>
            <p>No restock suggestions needed at this time.</p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {bulkRestockMode && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBulkRestockMode(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>
                  <Truck size={24} />
                  Bulk Restock ({selectedProducts.size} items)
                </h3>
                <button className="close-btn" onClick={() => setBulkRestockMode(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="supplier-options">
                {supplierPerformance.map(supplier => (
                  <motion.div
                    key={supplier.supplier_id}
                    className="supplier-card"
                    whileHover={{ x: 8 }}
                    onClick={() => handleBulkRestock(supplier.supplier_id)}
                  >
                    <div className="supplier-info">
                      <h4>{supplier.supplier_name}</h4>
                      <div className="stats">
                        <span>
                          <DollarSign size={14} />
                          Avg: {formatCurrency(supplier.average_cost_price)}
                        </span>
                        <span>
                          <Package size={14} />
                          {supplier.unique_products_supplied} products
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={20} />
                  </motion.div>
                ))}
              </div>

              <button className="cancel-btn" onClick={() => setBulkRestockMode(false)}>
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RestockManager;