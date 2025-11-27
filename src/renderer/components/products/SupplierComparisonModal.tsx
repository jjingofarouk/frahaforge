// src/renderer/src/components/common/SupplierComparisonModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingDown,
  Award,
  Star,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import './SupplierComparisonModal.css';

interface Supplier {
  supplier_id: number;
  supplier_name: string;
  average_cost_price: number;
  best_price: number;
  total_restocks: number;
}

interface ProductInfo {
  current_supplier: string;
  current_supplier_id: number;
  current_cost_price: number;
}

interface ComparisonData {
  product: ProductInfo;
  supplier_comparison: Supplier[];
}

interface SupplierComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  loading: boolean;
  data: ComparisonData | null;
  onSwitchSupplier: (supplierId: number, supplierName: string) => void;
}

const SupplierComparisonModal: React.FC<SupplierComparisonModalProps> = ({
  isOpen,
  onClose,
  productName,
  loading,
  data,
  onSwitchSupplier,
}) => {
  const getBestPriceSupplier = () => {
    if (!data) return null;
    return data.supplier_comparison.reduce((best, curr) =>
      curr.average_cost_price < best.average_cost_price ? curr : best
    );
  };

  const getMostReliableSupplier = () => {
    if (!data) return null;
    return data.supplier_comparison.reduce((best, curr) =>
      curr.total_restocks > best.total_restocks ? curr : best
    );
  };

  const formatCurrency = (value: number) =>
    `UGX ${value.toLocaleString()}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-content supplier-comparison-modal"
            initial={{ scale: 0.92, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <h3>
                <TrendingDown size={24} />
                Supplier Comparison — {productName}
              </h3>
              <button className="close-btn" onClick={onClose} aria-label="Close">
                <X size={22} />
              </button>
            </div>

            <div className="modal-body">
              {loading ? (
                <div className="loading-state">
                  <RefreshCw className="spin" size={36} />
                  <p>Loading supplier data...</p>
                </div>
              ) : !data || data.supplier_comparison.length === 0 ? (
                <div className="empty-state">
                  <AlertTriangle size={48} />
                  <h4>No supplier data available</h4>
                  <p>This product has no alternative suppliers.</p>
                </div>
              ) : (
                <>
                  {/* Recommendations */}
                  <div className="recommendations-grid">
                    {getBestPriceSupplier() && (
                      <div className="recommendation-card best-price">
                        <Award size={22} />
                        <div className="content">
                          <h4>Best Price</h4>
                          <strong>{getBestPriceSupplier()!.supplier_name}</strong>
                          <p>{formatCurrency(getBestPriceSupplier()!.average_cost_price)}</p>
                          <button
                            className="btn-switch"
                            onClick={() =>
                              onSwitchSupplier(
                                getBestPriceSupplier()!.supplier_id,
                                getBestPriceSupplier()!.supplier_name
                              )
                            }
                          >
                            Switch to This Supplier
                          </button>
                        </div>
                      </div>
                    )}

                    {getMostReliableSupplier() && (
                      <div className="recommendation-card most-reliable">
                        <Star size={22} />
                        <div className="content">
                          <h4>Most Reliable</h4>
                          <strong>{getMostReliableSupplier()!.supplier_name}</strong>
                          <p>{getMostReliableSupplier()!.total_restocks} successful restocks</p>
                          <button
                            className="btn-switch"
                            onClick={() =>
                              onSwitchSupplier(
                                getMostReliableSupplier()!.supplier_id,
                                getMostReliableSupplier()!.supplier_name
                              )
                            }
                          >
                            Switch to This Supplier
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Current Supplier */}
                  <div className="current-supplier-section">
                    <h4>Current Supplier</h4>
                    <div className="current-supplier-info">
                      <div>
                        <strong>{data.product.current_supplier}</strong>
                        <span className="current-badge">Active</span>
                      </div>
                      <span className="price">
                        {formatCurrency(data.product.current_cost_price)}
                      </span>
                    </div>
                  </div>

                  {/* Full Comparison Table */}
                  <div className="comparison-table-section">
                    <h4>All Available Suppliers</h4>
                    <div className="table-wrapper">
                      <table className="comparison-table">
                        <thead>
                          <tr>
                            <th>Supplier</th>
                            <th>Avg Cost</th>
                            <th>Best Price</th>
                            <th>Restocks</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.supplier_comparison.map((supplier) => (
                            <tr
                              key={supplier.supplier_id}
                              className={
                                supplier.supplier_id === data.product.current_supplier_id
                                  ? 'current-row'
                                  : ''
                              }
                            >
                              <td>
                                <strong>{supplier.supplier_name}</strong>
                                {supplier.supplier_id === data.product.current_supplier_id && (
                                  <span className="current-badge">Current</span>
                                )}
                              </td>
                              <td>{formatCurrency(supplier.average_cost_price)}</td>
                              <td className="highlight-price">
                                {formatCurrency(supplier.best_price)}
                              </td>
                              <td>{supplier.total_restocks}</td>
                              <td>
                                <button
                                  className="btn-switch small"
                                  onClick={() =>
                                    onSwitchSupplier(supplier.supplier_id, supplier.supplier_name)
                                  }
                                  disabled={supplier.supplier_id === data.product.current_supplier_id}
                                >
                                  {supplier.supplier_id === data.product.current_supplier_id
                                    ? 'Current'
                                    : 'Switch'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SupplierComparisonModal;