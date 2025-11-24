// src/renderer/src/pages/ProductsPage.tsx (Updated)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { ModernChakraProvider } from './ChakraProvider';
import { ProductsTable } from './index';
import { ProductsSearch } from './index';
import { StockOverview } from './index';
import { LowStockModal } from './index';
import { ExpiryModal } from './index';
import { ProductModal } from './index';
import NewProduct from '../modals/NewProduct';
import { stockService, StockProduct, StockStats } from '../../services/stockService';
import './ProductsPage.css';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [stats, setStats] = useState<StockStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockProduct | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // ADD THIS: State for New Product modal
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  
  // Modal state for specific product types
  const [lowStockModalProducts, setLowStockModalProducts] = useState<StockProduct[]>([]);
  const [lowStockModalType, setLowStockModalType] = useState<'low-stock' | 'out-of-stock'>('low-stock');
  const [expiryModalProducts, setExpiryModalProducts] = useState<StockProduct[]>([]);
  const [expiryModalType, setExpiryModalType] = useState<'expiring-soon' | 'expired'>('expiring-soon');

  // Simple data loading
  const loadStockData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const [stockProducts, stockStats] = await Promise.all([
        stockService.getStockProducts(forceRefresh),
        stockService.getStockStats(forceRefresh)
      ]);
      
      setProducts(stockProducts);
      setStats(stockStats);
      setLastRefresh(new Date()); // Set refresh timestamp
    } catch (error) {
      console.error('Failed to load stock data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadStockData();
  }, [loadStockData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing stock data...');
      loadStockData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, loadStockData]);

  // Simple search - client side for instant results
  const searchedProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(query) ||
      (product.barcode?.toString().toLowerCase().includes(query)) ||
      (product.category?.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  // Calculate expiring and expired products
  const { expiringSoonProducts, expiredProducts } = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expiringSoon = products.filter(product => {
      if (!product.expiration_date) return false;
      const expDate = new Date(product.expiration_date);
      return expDate > today && expDate <= thirtyDaysFromNow;
    });

    const expired = products.filter(product => {
      if (!product.expiration_date) return false;
      const expDate = new Date(product.expiration_date);
      return expDate < today;
    });

    return { expiringSoonProducts: expiringSoon, expiredProducts: expired };
  }, [products]);

  // Calculate low stock products
  const { lowStockProducts, outOfStockProducts } = useMemo(() => {
    const lowStock = products.filter(product => {
      const minStock = parseInt(product.min_stock || '0') || 5;
      return product.quantity <= minStock && product.quantity > 0;
    });
    
    const outOfStock = products.filter(product => product.quantity === 0);

    return { lowStockProducts: lowStock, outOfStockProducts: outOfStock };
  }, [products]);

  // Modal handlers
  const handleOpenLowStockModal = useCallback((modalProducts: StockProduct[], stockType: 'low-stock' | 'out-of-stock') => {
    console.log(`Opening ${stockType} modal with ${modalProducts.length} products`);
    setLowStockModalProducts(modalProducts);
    setLowStockModalType(stockType);
    setIsLowStockModalOpen(true);
  }, []);

  const handleCloseLowStockModal = useCallback(() => {
    setIsLowStockModalOpen(false);
    setLowStockModalProducts([]);
  }, []);

  const handleOpenExpiryModal = useCallback((modalProducts: StockProduct[], expiryType: 'expiring-soon' | 'expired') => {
    console.log(`Opening ${expiryType} modal with ${modalProducts.length} products`);
    setExpiryModalProducts(modalProducts);
    setExpiryModalType(expiryType);
    setIsExpiryModalOpen(true);
  }, []);

  const handleCloseExpiryModal = useCallback(() => {
    setIsExpiryModalOpen(false);
    setExpiryModalProducts([]);
  }, []);

  // ADD THIS: New Product modal handlers
  const handleOpenNewProductModal = useCallback(() => {
    setIsNewProductModalOpen(true);
  }, []);

  const handleCloseNewProductModal = useCallback(() => {
    setIsNewProductModalOpen(false);
  }, []);

  const handleProductAdded = useCallback(() => {
    // Refresh the products list when a new product is added
    loadStockData(true);
  }, [loadStockData]);

  // Product action handlers
  const handleRefresh = () => loadStockData(true);
  
  // UPDATE THIS: Replace the alert with actual modal opening
  const handleAddProduct = () => {
    handleOpenNewProductModal();
  };

  const handleEditProduct = (product: StockProduct) => {
    console.log('Edit product:', product.name);
    setSelectedProduct(product);
  };

  const handleViewProduct = (product: StockProduct) => {
    console.log('View product:', product.name);
    setSelectedProduct(product);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await stockService.deleteProduct(parseInt(productId));
      await loadStockData(true); // Refresh after delete
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleSelectProduct = (product: StockProduct) => {
    setSelectedProduct(product);
  };

  const handleAutoRefreshToggle = (enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
  };

  const handleSaveProduct = async (product: StockProduct) => {
    try {
      // Implement product save logic here
      console.log('Saving product:', product);
      // For now, just refresh the data
      await loadStockData(true);
    } catch (error) {
      console.error('Failed to save product:', error);
      throw error;
    }
  };

  const handleRestockProduct = async (restockData: {
    productId: number;
    quantity: number;
    costPrice: string;
    supplierId: number;
    batchNumber?: string;
  }) => {
    try {
      // Implement restock logic here
      console.log('Restocking product:', restockData);
      // For now, just refresh the data
      await loadStockData(true);
    } catch (error) {
      console.error('Failed to restock product:', error);
      throw error;
    }
  };

  return (
    <ModernChakraProvider>
      <div className="products-container">
        {/* Stock Overview with ALL required props including auto-refresh */}
        <StockOverview
          products={searchedProducts}
          stats={stats}
          onRefresh={handleRefresh}
          onAddProduct={handleAddProduct} // This now opens the modal
          loading={loading}
          onOpenLowStockModal={handleOpenLowStockModal}
          onOpenExpiryModal={handleOpenExpiryModal}
          expiringSoonProducts={expiringSoonProducts}
          expiredProducts={expiredProducts}
          autoRefreshEnabled={autoRefreshEnabled}
          onAutoRefreshToggle={handleAutoRefreshToggle}
          lastRefresh={lastRefresh}
        />

        {/* Search */}
        <ProductsSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Products Table with ALL required props */}
        <ProductsTable
          products={searchedProducts}
          onEditProduct={handleEditProduct}
          onViewProduct={handleViewProduct}
          onDeleteProduct={handleDeleteProduct}
          loading={loading && products.length === 0}
        />

        {/* Modals */}
        <LowStockModal
          isOpen={isLowStockModalOpen}
          onClose={handleCloseLowStockModal}
          products={lowStockModalProducts}
          stockType={lowStockModalType}
          onSelectProduct={handleSelectProduct}
        />

        <ExpiryModal
          isOpen={isExpiryModalOpen}
          onClose={handleCloseExpiryModal}
          products={expiryModalProducts}
          expiryType={expiryModalType}
          onSelectProduct={handleSelectProduct}
        />

        <ProductModal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
          onSave={handleSaveProduct}
          onRestock={handleRestockProduct}
          mode={selectedProduct ? 'edit' : 'view'}
          loading={loading}
        />

        {/* ADD THIS: New Product Modal */}
        <NewProduct
          isOpen={isNewProductModalOpen}
          onClose={handleCloseNewProductModal}
          onProductAdded={handleProductAdded}
        />
      </div>
    </ModernChakraProvider>
  );
};

export { ProductsPage };