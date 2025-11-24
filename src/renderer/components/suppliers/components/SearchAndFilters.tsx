// Updated SearchAndFilters.tsx - Connected to Tabs
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Users, Lock } from 'lucide-react';
import { useSuppliersStore } from '../stores/suppliersStore';
import { suppliersService } from '../../../services/supplierService';
import './SearchAndFilters.css';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'supplier';
  icon: React.ReactNode;
  data?: any;
}

interface SearchAndFiltersProps {
  allowedSearchType: 'products' | 'suppliers' | 'both';
  currentView: string;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({ 
  allowedSearchType, 
  currentView 
}) => {
  const [searchType, setSearchType] = useState<'products' | 'suppliers'>('products');
  const [localQuery, setLocalQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const {
    searchQuery,
    searchProducts,
    searchSuppliers,
    resetSearch
  } = useSuppliersStore();

  // Auto-set search type based on current tab
  useEffect(() => {
    if (allowedSearchType === 'products') {
      setSearchType('products');
    } else if (allowedSearchType === 'suppliers') {
      setSearchType('suppliers');
    }
    // If 'both', keep the current searchType
  }, [allowedSearchType]);

  // Load real data for suggestions
  useEffect(() => {
    const loadRealSuggestions = async () => {
      if (!localQuery.trim() || localQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        let newSuggestions: SearchSuggestion[] = [];

        if (searchType === 'products') {
          const products = await suppliersService.searchProducts(localQuery, 5);
          newSuggestions = products.map((product: any) => ({
            id: `product_${product.id}`,
            text: product.name,
            type: 'product' as const,
            icon: <Package className="suggestion-icon" />,
            data: product
          }));
        } else {
          const suppliers = await suppliersService.searchSuppliers(localQuery, 5);
          newSuggestions = suppliers.map((supplier: any) => ({
            id: `supplier_${supplier.id}`,
            text: supplier.name,
            type: 'supplier' as const,
            icon: <Users className="suggestion-icon" />,
            data: supplier
          }));
        }

        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(loadRealSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [localQuery, searchType]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localQuery.trim()) return;

    if (searchType === 'products') {
      await searchProducts(localQuery);
    } else {
      await searchSuppliers(localQuery);
    }
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    resetSearch();
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setLocalQuery(suggestion.text);
    
    if (suggestion.type === 'product') {
      searchProducts(suggestion.text);
    } else {
      searchSuppliers(suggestion.text);
    }
    setShowSuggestions(false);
  };

  const handleSearchTypeChange = (type: 'products' | 'suppliers') => {
    // Only allow change if the type is allowed by current tab
    if (allowedSearchType === 'both' || allowedSearchType === type) {
      setSearchType(type);
      setSuggestions([]);
      if (localQuery.trim()) {
        if (type === 'products') {
          searchProducts(localQuery);
        } else {
          searchSuppliers(localQuery);
        }
      }
    }
  };

  const getSearchTypeButtonProps = (type: 'products' | 'suppliers') => {
    const isLocked = allowedSearchType !== 'both' && allowedSearchType !== type;
    const isActive = searchType === type;
    
    return {
      className: `search-type-button ${type} ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`,
      onClick: () => !isLocked && handleSearchTypeChange(type),
      disabled: isLocked,
      title: isLocked ? `Switch to "${currentView === 'dashboard' ? 'Recent Restocks' : currentView}" tab to search ${type}` : undefined
    };
  };

  return (
    <div className="search-filters-container">
      <div className="search-filters-layout" ref={searchRef}>
        {/* Search Type Toggle */}
        <div className="search-type-buttons">
          <button {...getSearchTypeButtonProps('products')}>
            <Package className="search-type-icon" />
            <span className="search-type-label">Products</span>
            {allowedSearchType !== 'both' && allowedSearchType !== 'products' && (
              <Lock className="lock-icon" />
            )}
          </button>
          <button {...getSearchTypeButtonProps('suppliers')}>
            <Users className="search-type-icon" />
            <span className="search-type-label">Suppliers</span>
            {allowedSearchType !== 'both' && allowedSearchType !== 'suppliers' && (
              <Lock className="lock-icon" />
            )}
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <Search className="search-icon" />
            
            <input
              type="text"
              value={localQuery}
              onChange={(e) => {
                setLocalQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={
                allowedSearchType === 'both' 
                  ? `Search ${searchType}...` 
                  : `Search ${allowedSearchType}...`
              }
              className="search-input"
            />
            
            {localQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="search-clear-button"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Search Suggestions */}
            {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
              <div className="search-suggestions">
                {isLoadingSuggestions ? (
                  <div className="suggestion-item">
                    <div className="suggestion-loading">Loading suggestions...</div>
                  </div>
                ) : (
                  suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion.icon}
                      <span className="suggestion-text">{suggestion.text}</span>
                      <span className={`suggestion-type ${suggestion.type}`}>
                        {suggestion.type}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            className="search-submit"
            disabled={!localQuery.trim()}
          >
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Active Search Info */}
      {searchQuery && currentView !== 'dashboard' && (
        <div className="active-search-indicator">
          <span className="search-type-badge">
            {searchType === 'products' ? '📦 Products' : '👥 Suppliers'}
          </span>
          <span>Results for "{searchQuery}"</span>
          <button
            onClick={resetSearch}
            className="clear-search-link"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilters;