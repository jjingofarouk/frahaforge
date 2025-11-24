// src/renderer/src/components/pos/PosSearch.tsx
import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Barcode, Filter, Search } from 'lucide-react';
import { Category } from '../../src/types/pos.types';
import './PosSearch.css';

interface PosSearchProps {
  searchQuery: string;
  barcodeInput: string;
  selectedCategory: string;
  categories: Category[];
  scanning: boolean;
  activeFilterCount: number;
  onSearchChange: (query: string) => void;
  onBarcodeChange: (input: string) => void;
  onCategoryChange: (category: string) => void;
  onBarcodeSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onOpenFilters: () => void;
  placeholder?: string;
  showCategoryFilter?: boolean;
  showBarcodeInput?: boolean;
}

const PosSearch: React.FC<PosSearchProps> = memo(({
  searchQuery,
  barcodeInput,
  selectedCategory,
  categories,
  scanning,
  activeFilterCount,
  onSearchChange,
  onBarcodeChange,
  onCategoryChange,
  onBarcodeSubmit,
  onOpenFilters,
  placeholder = "Search products...",
  showCategoryFilter = true,
  showBarcodeInput = false,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    onSearchChange(value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Category changed to:', e.target.value);
    onCategoryChange(e.target.value);
  };

  return (
    <div className="pos-search-header">
      <div className="pos-search-grid">
        {/* Search Input */}
        <div className="pos-search-input-wrapper">
          <Search size={18} className="pos-search-icon" />
          <input
            type="text"
            className="pos-search-input"
            placeholder={placeholder}
            value={localSearch}
            onChange={handleSearchChange}
          />
        </div>

        {/* Category Filter */}
        {showCategoryFilter && (
          <select
            className="pos-category-select"
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        )}

        {/* Filter Button */}
        <motion.button
          className="pos-filter-button"
          onClick={onOpenFilters}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Filter size={18} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <motion.span 
              className="pos-filter-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              {activeFilterCount}
            </motion.span>
          )}
        </motion.button>
      </div>
    </div>
  );
});

PosSearch.displayName = 'PosSearch';

export default PosSearch;