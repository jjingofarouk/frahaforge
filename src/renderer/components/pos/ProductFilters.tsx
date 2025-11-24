// src/renderer/src/components/pos/ProductFilters.tsx
import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Calendar, DollarSign, Package, Zap, Clock } from 'lucide-react';
import { Category } from '../../src/types/pos.types';
import './ProductFilters.css';

interface ProductFiltersProps {
  filters: {
    category: string;
    stockStatus: string;
    priceRange: string;
    sortBy: string;
    lowStockOnly: boolean;
    expiredOnly: boolean;
  };
  onFiltersChange: (filters: any) => void;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = memo(({
  filters,
  onFiltersChange,
  categories,
  isOpen,
  onClose
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split('-');
        setPriceRange({ min, max });
      } else {
        setPriceRange({ min: '', max: '' });
      }
    }
  }, [isOpen, filters]);

  const handleApplyFilters = () => {
    const priceRangeValue = priceRange.min && priceRange.max ? `${priceRange.min}-${priceRange.max}` : '';
    onFiltersChange({ ...localFilters, priceRange: priceRangeValue });
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters = {
      category: 'all',
      stockStatus: 'all',
      priceRange: '',
      sortBy: 'name-asc',
      lowStockOnly: false,
      expiredOnly: false
    };
    setLocalFilters(resetFilters);
    setPriceRange({ min: '', max: '' });
    onFiltersChange(resetFilters);
    onClose();
  };

  const quickPriceRanges = [
    { label: 'Under 10K', min: '0', max: '10000' },
    { label: '10K - 30K', min: '10000', max: '30000' },
    { label: '30K - 50K', min: '30000', max: '50000' },
    { label: '50K - 100K', min: '50000', max: '100000' },
    { label: 'Over 100K', min: '100000', max: '' }
  ];

  const applyQuickPriceRange = (min: string, max: string) => {
    setPriceRange({ min, max });
  };

  // Safe category ID conversion
  const safeCategoryId = (category: Category): string => {
    if (!category || category.id === undefined || category.id === null) {
      return '';
    }
    return category.id.toString();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="pos-filters-backdrop" 
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          
          <motion.div
            className="pos-filters-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="pos-filters-header">
              <div className="pos-filters-title">
                <Filter size={20} />
                <h3>Advanced Product Filters</h3>
              </div>
              <button className="pos-filters-close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="pos-filters-content">
              {/* Quick Price Filters */}
              <div className="pos-filter-section">
                <h4 className="pos-filter-section-title">
                  <DollarSign size={16} />
                  Quick Price Filters
                </h4>
                <div className="pos-quick-filters-grid">
                  {quickPriceRanges.map((range) => (
                    <button
                      key={range.label}
                      className={`pos-quick-filter-btn ${
                        priceRange.min === range.min && priceRange.max === range.max ? 'active' : ''
                      }`}
                      onClick={() => applyQuickPriceRange(range.min, range.max)}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Price Range */}
              <div className="pos-filter-section">
                <h4 className="pos-filter-section-title">Custom Price Range (UGX)</h4>
                <div className="pos-price-range-inputs">
                  <input
                    type="number"
                    placeholder="Min price"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="pos-price-input"
                  />
                  <span className="pos-price-range-separator">to</span>
                  <input
                    type="number"
                    placeholder="Max price"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="pos-price-input"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="pos-filter-section">
                <h4 className="pos-filter-section-title">
                  <Package size={16} />
                  Category
                </h4>
                <select
                  value={localFilters.category}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="pos-filter-select"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={safeCategoryId(category)} value={safeCategoryId(category)}>
                      {category.name || 'Unnamed Category'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Status */}
              <div className="pos-filter-section">
                <h4 className="pos-filter-section-title">Stock Status</h4>
                <div className="pos-radio-group">
                  {[
                    { value: 'all', label: 'All Stock' },
                    { value: 'in-stock', label: 'In Stock Only' },
                    { value: 'out-of-stock', label: 'Out of Stock' },
                    { value: 'low-stock', label: 'Low Stock Only' }
                  ].map((option) => (
                    <label key={option.value} className="pos-radio-label">
                      <input
                        type="radio"
                        value={option.value}
                        checked={localFilters.stockStatus === option.value}
                        onChange={(e) => setLocalFilters(prev => ({ ...prev, stockStatus: e.target.value }))}
                      />
                      <span className="pos-radio-custom"></span>
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div className="pos-filter-section">
                <h4 className="pos-filter-section-title">
                  <Zap size={16} />
                  Sort By
                </h4>
                <select
                  value={localFilters.sortBy}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="pos-filter-select"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                  <option value="stock-asc">Stock (Low to High)</option>
                  <option value="stock-desc">Stock (High to Low)</option>
                  <option value="expiry-asc">Expiry Date (Soonest)</option>
                  <option value="expiry-desc">Expiry Date (Farthest)</option>
                  <option value="barcode-asc">Barcode</option>
                </select>
              </div>

              {/* Quick Filters (Toggles) */}
              <div className="pos-filter-section">
                <h4 className="pos-filter-section-title">
                  <Clock size={16} />
                  Quick Filters
                </h4>
                <div className="pos-toggle-group">
                  {[
                    { key: 'lowStockOnly', label: 'Low Stock Only' },
                    { key: 'expiredOnly', label: 'Expiring Soon' }
                  ].map((toggle) => (
                    <label key={toggle.key} className="pos-toggle-label">
                      <input
                        type="checkbox"
                        checked={localFilters[toggle.key as keyof typeof localFilters] as boolean}
                        onChange={(e) => setLocalFilters(prev => ({ ...prev, [toggle.key]: e.target.checked }))}
                      />
                      <span className="pos-toggle-custom"></span>
                      {toggle.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pos-filters-footer">
              <button className="pos-filters-reset-btn" onClick={handleResetFilters}>
                Reset All
              </button>
              <button className="pos-filters-apply-btn" onClick={handleApplyFilters}>
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

ProductFilters.displayName = 'ProductFilters';

export default ProductFilters;