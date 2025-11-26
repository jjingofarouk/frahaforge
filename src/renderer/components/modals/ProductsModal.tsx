// src/renderer/src/components/modals/ProductsModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Edit, Trash2, Loader, Eye, AlertTriangle, TrendingUp } from 'lucide-react';
import axios from 'axios';
import '../../../styles/ProductsModal.css';

interface Product {
  id: number;
  barcode: number;
  expirationDate: string;
  price: string;
  category: string;
  quantity: number;
  name: string;
  stock: number;
  minStock: string;
  img: string;
  costPrice?: string;
  taxRate?: string;
  supplier?: string;
  lastRestocked?: string;
}

interface Category {
  id: number;
  name: string;
}

interface ProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditProduct?: (product: Product) => void;
}

const ProductsModal: React.FC<ProductsModalProps> = ({ isOpen, onClose, onEditProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchCategories();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://192.168.1.3:3001/api/inventory/products');
      setProducts(response.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://192.168.1.3:3001/api/categories/all');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id.toString() === categoryId);
    return category ? category.name : 'Unknown';
  };

  const handleEdit = (product: Product) => {
    if (onEditProduct) {
      onEditProduct(product);
    } else {
      console.log('Edit product:', product);
      alert(`Editing product: ${product.name}`);
    }
  };

  const handleDelete = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`http://192.168.1.3:3001/api/inventory/product/${productId}`);
      
      // Update local state
      setProducts(prev => prev.filter(product => product.id !== productId));
      alert('Product deleted successfully!');
    } catch (err) {
      console.error('Failed to delete product:', err);
      setError('Failed to delete product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateProfitMargin = (product: Product) => {
    if (!product.costPrice) return null;
    const sellingPrice = parseFloat(product.price);
    const costPrice = parseFloat(product.costPrice);
    if (costPrice <= 0) return null;
    
    const profit = sellingPrice - costPrice;
    const margin = (profit / costPrice) * 100;
    return { profit, margin };
  };

  const isLowStock = (product: Product) => {
    const minStock = parseInt(product.minStock) || 1;
    return product.quantity <= minStock;
  };

  const isExpired = (product: Product) => {
    if (!product.expirationDate) return false;
    const expiryDate = new Date(product.expirationDate);
    const today = new Date();
    return expiryDate < today;
  };

  const isExpiringSoon = (product: Product) => {
    if (!product.expirationDate) return false;
    const expiryDate = new Date(product.expirationDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
  };

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.toString().includes(searchTerm);
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    const matchesStockFilter = !lowStockOnly || isLowStock(product);
    
    return matchesSearch && matchesCategory && matchesStockFilter;
  });

  const getStockStatus = (product: Product) => {
    if (isLowStock(product)) return 'low';
    if (product.quantity === 0) return 'out';
    return 'good';
  };

  const getExpiryStatus = (product: Product) => {
    if (isExpired(product)) return 'expired';
    if (isExpiringSoon(product)) return 'expiring';
    return 'good';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="products-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className="products-modal-content"
            initial={{ scale: 0.95, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="products-modal-header">
              <h4 className="products-modal-title">
                <Package className="products-modal-icon" size={24} />
                Pharmacy Stock ({filteredProducts.length} products)
              </h4>
              <motion.button 
                className="products-modal-close-btn" 
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="products-modal-icon" size={24} />
              </motion.button>
            </div>
            
            <div className="products-modal-body">
              {/* Filters and Search */}
              <div className="products-filters">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search by name or barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                
                <div className="filter-controls">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  
                  <label className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={lowStockOnly}
                      onChange={(e) => setLowStockOnly(e.target.checked)}
                    />
                    Show Low Stock Only
                  </label>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="loading-state">
                  <Loader size={32} className="spinner" />
                  <p>Loading products...</p>
                </div>
              ) : (
                <div className="products-table-container">
                  <table className="products-table">
                    <thead>
                      <tr className="table-header">
                        <th>Barcode</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Cost</th>
                        <th>Profit</th>
                        <th>Stock</th>
                        <th>Expiry</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => {
                          const profitData = calculateProfitMargin(product);
                          const stockStatus = getStockStatus(product);
                          const expiryStatus = getExpiryStatus(product);

                          return (
                            <tr key={product.id} className={`table-row ${stockStatus}-stock`}>
                              <td className="barcode">{product.barcode}</td>
                              <td className="product-name">
                                <div className="name-wrapper">
                                  {product.name}
                                  {product.img && (
                                    <span className="has-image-indicator" title="Has image">🖼️</span>
                                  )}
                                </div>
                              </td>
                              <td className="category">
                                {getCategoryName(product.category)}
                              </td>
                              <td className="price">
                                ${parseFloat(product.price).toFixed(2)}
                              </td>
                              <td className="cost">
                                {product.costPrice ? `$${parseFloat(product.costPrice).toFixed(2)}` : '-'}
                              </td>
                              <td className="profit">
                                {profitData ? (
                                  <div className="profit-info">
                                    <span className="profit-amount">
                                      ${profitData.profit.toFixed(2)}
                                    </span>
                                    <span className={`profit-margin ${profitData.margin >= 0 ? 'positive' : 'negative'}`}>
                                      ({profitData.margin.toFixed(1)}%)
                                    </span>
                                  </div>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="stock">
                                <div className="stock-info">
                                  <span className={`stock-quantity ${stockStatus}`}>
                                    {product.quantity}
                                  </span>
                                  {stockStatus === 'low' && (
                                    <AlertTriangle size={14} className="warning-icon" />
                                  )}
                                  {stockStatus === 'out' && (
                                    <X size={14} className="out-icon" />
                                  )}
                                </div>
                              </td>
                              <td className="expiry">
                                {product.expirationDate ? (
                                  <span className={`expiry-date ${expiryStatus}`}>
                                    {new Date(product.expirationDate).toLocaleDateString()}
                                    {expiryStatus === 'expiring' && (
                                      <AlertTriangle size={12} className="warning-icon" />
                                    )}
                                    {expiryStatus === 'expired' && (
                                      <X size={12} className="expired-icon" />
                                    )}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="status">
                                <div className="status-indicators">
                                  {stockStatus === 'low' && (
                                    <span className="status-badge low-stock" title="Low Stock">
                                      Low
                                    </span>
                                  )}
                                  {stockStatus === 'out' && (
                                    <span className="status-badge out-of-stock" title="Out of Stock">
                                      Out
                                    </span>
                                  )}
                                  {expiryStatus === 'expiring' && (
                                    <span className="status-badge expiring" title="Expiring Soon">
                                      Expiring
                                    </span>
                                  )}
                                  {expiryStatus === 'expired' && (
                                    <span className="status-badge expired" title="Expired">
                                      Expired
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="action-cell">
                                <div className="action-buttons">
                                  <motion.button
                                    className="action-btn view-btn"
                                    onClick={() => handleEdit(product)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="View/Edit Product"
                                  >
                                    <Eye size={14} />
                                  </motion.button>
                                  <motion.button
                                    className="action-btn edit-btn"
                                    onClick={() => handleEdit(product)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Edit Product"
                                  >
                                    <Edit size={14} />
                                  </motion.button>
                                  <motion.button
                                    className="action-btn delete-btn"
                                    onClick={() => handleDelete(product.id)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Delete Product"
                                  >
                                    <Trash2 size={14} />
                                  </motion.button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={10} className="no-data">
                            {searchTerm || selectedCategory !== 'all' || lowStockOnly
                              ? 'No products match your filters'
                              : 'No products available'
                            }
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary Stats */}
              {!loading && filteredProducts.length > 0 && (
                <div className="products-summary">
                  <div className="summary-item">
                    <span className="summary-label">Total Products:</span>
                    <span className="summary-value">{filteredProducts.length}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Low Stock:</span>
                    <span className="summary-value warning">
                      {filteredProducts.filter(p => isLowStock(p) && p.quantity > 0).length}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Out of Stock:</span>
                    <span className="summary-value danger">
                      {filteredProducts.filter(p => p.quantity === 0).length}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Expiring Soon:</span>
                    <span className="summary-value warning">
                      {filteredProducts.filter(p => isExpiringSoon(p)).length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductsModal;