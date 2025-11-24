// ProductsSearch.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import './ProductsSearch.css';

interface ProductsSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export const ProductsSearch: React.FC<ProductsSearchProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = "Search products by name, barcode, or supplier..."
}) => {
  return (
    <div className="products-search-container">
      <div className="products-search-content">
        {/* Search Input */}
        <div className="products-search-input-container">
          <Search size={18} className="products-search-icon" />
          <input
            type="text"
            className="products-search-input"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductsSearch;