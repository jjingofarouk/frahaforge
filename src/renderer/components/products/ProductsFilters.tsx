import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Download, Search, Sliders } from 'lucide-react';
import { ProductFilters, Category } from '../../types/products.types';
import './ProductsFilters.css';

interface ProductsFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  categories: Category[];
  onExportExcel: () => void;
  onExportPDF: () => void;
}

export const ProductsFilters: React.FC<ProductsFiltersProps> = ({
  filters,
  onFiltersChange,
  categories,
  onExportExcel,
  onExportPDF
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, searchTerm: value };
    onFiltersChange(newFilters);
  };

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const resetFilters: ProductFilters = {
      category: 'all',
      stockStatus: 'all',
      priceRange: '',
      sortBy: 'name-asc',
      lowStockOnly: false,
      expiredOnly: false,
      prescriptionOnly: false,
      controlledSubstances: false,
      requiresRefrigeration: false,
      searchTerm: ''
    };
    onFiltersChange(resetFilters);
  };

  return (
    <div className="products-filters">
      {/* Main Filter Bar */}
      <div className="filter-bar">
        <div className="filter-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search products by name, barcode, or description..."
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <motion.button
            className={`filter-btn ${isFiltersOpen ? 'active' : ''}`}
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sliders size={16} />
            Filters
          </motion.button>

          <motion.button
            className="filter-btn export-btn"
            onClick={onExportExcel}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download size={16} />
            Export
          </motion.button>
        </div>
      </div>

      {/* Advanced Filters Modal */}
      <AnimatePresence>
        {isFiltersOpen && (
          <>
            <div className="modal-backdrop" onClick={() => setIsFiltersOpen(false)} />
            <motion.div
              className="filters-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="modal-header">
                <div className="modal-title">
                  <Filter size={20} />
                  <h3>Advanced Filters</h3>
                </div>
                <button className="close-btn" onClick={() => setIsFiltersOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-content">
                <div className="filter-section">
                  <label className="section-label">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-section">
                  <label className="section-label">Stock Status</label>
                  <select
                    value={filters.stockStatus}
                    onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Stock</option>
                    <option value="in-stock">In Stock Only</option>
                    <option value="out-of-stock">Out of Stock</option>
                    <option value="low-stock">Low Stock Only</option>
                  </select>
                </div>

                <div className="filter-section">
                  <label className="section-label">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="filter-select"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                    <option value="stock-asc">Stock (Low to High)</option>
                    <option value="stock-desc">Stock (High to Low)</option>
                    <option value="profit-asc">Profit (Low to High)</option>
                    <option value="profit-desc">Profit (High to Low)</option>
                  </select>
                </div>

                <div className="filter-section">
                  <label className="section-label">Quick Filters</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.lowStockOnly}
                        onChange={(e) => handleFilterChange('lowStockOnly', e.target.checked)}
                      />
                      <span className="checkmark"></span>
                      Low Stock Only
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.expiredOnly}
                        onChange={(e) => handleFilterChange('expiredOnly', e.target.checked)}
                      />
                      <span className="checkmark"></span>
                      Expiring Soon
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.prescriptionOnly}
                        onChange={(e) => handleFilterChange('prescriptionOnly', e.target.checked)}
                      />
                      <span className="checkmark"></span>
                      Prescription Only
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.controlledSubstances}
                        onChange={(e) => handleFilterChange('controlledSubstances', e.target.checked)}
                      />
                      <span className="checkmark"></span>
                      Controlled Substances
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.requiresRefrigeration}
                        onChange={(e) => handleFilterChange('requiresRefrigeration', e.target.checked)}
                      />
                      <span className="checkmark"></span>
                      Requires Refrigeration
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="reset-btn" onClick={resetFilters}>
                  Reset Filters
                </button>
                <button className="apply-btn" onClick={() => setIsFiltersOpen(false)}>
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};