// src/renderer/src/hooks/useProductsData.tsx - OPTIMIZED
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getCategories, deleteProduct } from '../../services/api';
import { Product, Category, ProductFilters, ProductStats } from '../../types/products.types';
import inventoryService from '../../services/inventoryService';

export const useProductsData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [rawProducts, setRawProducts] = useState<Product[]>([]); // Store unfiltered products
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<ProductFilters>({
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
  });

  const fetchProducts = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching products from API...');
      
      // Get products immediately without complex processing
      const fetchedProducts = await inventoryService.getProducts(forceRefresh);
      
      // Set raw products first for immediate display
      setRawProducts(fetchedProducts);
      setProducts(fetchedProducts); // Initial unfiltered products
      
      console.log(`✅ Loaded ${fetchedProducts.length} raw products`);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await getCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchProducts();
      // Load categories in background
      setTimeout(() => {
        fetchCategories();
      }, 1000);
    };
    loadData();
  }, [fetchProducts, fetchCategories]);

  // SIMPLIFIED FILTERING - Only apply when needed
  const filteredProducts = useMemo(() => {
    // If no filters are active, return raw products immediately
    const isDefaultFilters = 
      filters.category === 'all' &&
      filters.stockStatus === 'all' &&
      !filters.lowStockOnly &&
      !filters.expiredOnly &&
      !filters.prescriptionOnly &&
      !filters.controlledSubstances &&
      !filters.requiresRefrigeration &&
      !filters.searchTerm &&
      filters.sortBy === 'name-asc';

    if (isDefaultFilters) {
      return rawProducts;
    }

    let filtered = rawProducts;

    // Apply filters only if they're different from default
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Simple stock status filter
    if (filters.stockStatus === 'out-of-stock') {
      filtered = filtered.filter(product => product.quantity === 0);
    } else if (filters.stockStatus === 'low-stock') {
      filtered = filtered.filter(product => product.quantity > 0 && product.quantity <= 10);
    } else if (filters.stockStatus === 'in-stock') {
      filtered = filtered.filter(product => product.quantity > 0);
    }

    // Simple sorting without heavy calculations
    filtered = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'quantity-asc':
          return a.quantity - b.quantity;
        case 'quantity-desc':
          return b.quantity - a.quantity;
        default:
          return 0;
      }
    });

    return filtered;
  }, [rawProducts, filters]);

  // LAZY STATS CALCULATION - Calculate in background
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0,
    totalInventoryValue: 0,
    totalCostValue: 0,
    totalPotentialProfit: 0,
    prescriptionProducts: 0,
    controlledSubstances: 0,
    productsWithCostPrice: 0
  });

  useEffect(() => {
    // Calculate stats in background after products are displayed
    if (rawProducts.length > 0) {
      setTimeout(() => {
        const totalProducts = rawProducts.length;
        const lowStockCount = rawProducts.filter(p => p.quantity > 0 && p.quantity <= 10).length;
        const outOfStockCount = rawProducts.filter(p => p.quantity === 0).length;
        
        // Simplified calculations
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        const expiringSoonCount = rawProducts.filter(product => {
          if (!product.expirationDate) return false;
          const expDate = new Date(product.expirationDate);
          return expDate > today && expDate <= thirtyDaysFromNow;
        }).length;

        const expiredCount = rawProducts.filter(product => {
          if (!product.expirationDate) return false;
          const expDate = new Date(product.expirationDate);
          return expDate < today;
        }).length;

        const newStats: ProductStats = {
          totalProducts,
          lowStockCount,
          outOfStockCount,
          expiringSoonCount,
          expiredCount,
          totalInventoryValue: 0, // Calculate later
          totalCostValue: 0,
          totalPotentialProfit: 0,
          prescriptionProducts: rawProducts.filter(p => p.prescriptionRequired).length,
          controlledSubstances: rawProducts.filter(p => p.isControlledSubstance).length,
          productsWithCostPrice: rawProducts.filter(p => p.costPrice).length
        };

        setStats(newStats);
      }, 1000);
    }
  }, [rawProducts]);

  // Update products when filters change (non-blocking)
  useEffect(() => {
    setProducts(filteredProducts);
  }, [filteredProducts]);

  // Rest of your functions remain the same...
  const handleEditProduct = useCallback((updatedProduct: Product) => {
    setRawProducts(prev => prev.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    ));
  }, []);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const productIdNum = parseInt(productId);
      await deleteProduct(productIdNum);
      
      setRawProducts(prev => prev.filter(product => product.id.toString() !== productId));
      alert('Product deleted successfully!');
    } catch (err) {
      console.error('Failed to delete product:', err);
      setError('Failed to delete product. Please try again.');
      fetchProducts(true);
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  const handleFiltersChange = useCallback((newFilters: ProductFilters) => {
    setFilters(newFilters);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchProducts(true);
    setTimeout(() => {
      fetchCategories();
    }, 500);
  }, [fetchProducts, fetchCategories]);

  return {
    products, // This now updates immediately
    categories,
    loading,
    error,
    filters,
    stats,
    handleFiltersChange,
    handleRefresh,
    handleEditProduct,
    handleDeleteProduct,
  };
};