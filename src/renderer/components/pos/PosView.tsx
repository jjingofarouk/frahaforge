// src/renderer/src/components/pos/PosView.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { User } from '../../types/user.types';
import { PosCart } from './PosCart/PosCart';
import PosProducts from './PosProducts';
import PosSearch from './PosSearch';
import ProductFilters from './ProductFilters';
import ProductDetailsOverlay from './ProductDetailsOverlay';
import { usePosStore } from '../../src/stores/posStore';
import { useGlobalPosStore, useCustomerManager, useAutoSyncCustomers } from '../../src/stores/globalPosStore';
import { CartItem, Product, ProductFiltersState, PaymentData, Customer } from '../../src/types/pos.types';
import { customersService } from '../../services/customerService';
import { RefreshIndicator } from './RefreshIndicator';
import { useDebounce } from './useDebounce';
import { measurePerformance } from './performance';
import './PosView.css';

interface PosViewProps {
  user: User;
  onOpenNewCustomer: () => void;
  onOpenPayment: () => void;
  onOpenHoldOrders: () => void;
  onCartUpdate: (cartData: {
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    discount: number;
    customer?: string;
    customerData?: Customer;
  }) => void;
}

const PosView: React.FC<PosViewProps> = React.memo(({
  user,
  onOpenNewCustomer,
  onOpenPayment,
  onOpenHoldOrders,
  onCartUpdate,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDetailsOpen, setProductDetailsOpen] = useState(false);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [productFilters, setProductFilters] = useState<ProductFiltersState>({
    category: 'all',
    stockStatus: 'all',
    priceRange: '',
    sortBy: 'name-asc',
    lowStockOnly: false,
    expiredOnly: false,
  });

  // Global store
  const {
    products: globalProducts,
    customers: globalCustomers,
    categories: globalCategories,
    loading: globalLoading,
    errors: globalErrors,
  } = useGlobalPosStore();

  // Customer manager for creating/updating customers
  const { createAndAddCustomer } = useCustomerManager();

  // Auto-sync customers on component mount
  useAutoSyncCustomers(true);

  // Local POS store
  const {
    cart,
    discount,
    isDiscountPercentage,
    searchQuery,
    barcodeInput,
    selectedCategory,
    selectedCustomer,
    setSearchQuery,
    setBarcodeInput,
    setSelectedCategory,
    setSelectedCustomer,
    setCustomers,
    setDiscount,
    setIsDiscountPercentage,
    handleBarcodeSubmit,
    handleAddToCart,
    handleRemoveItem,
    handleQuantityChange,
    handleDiscountChange,
    toggleDiscountType,
    handleCancel,
    handlePrint,
    isLowStock,
  } = usePosStore();

  // Handle payment completion with data refresh
  const handlePaymentCompleteWithRefresh = useCallback((paymentData: PaymentData) => {
    console.log('💳 PosView: Payment completed with refresh', paymentData);
    
    // Data refresh is handled automatically by GlobalPosDataManager
    if (paymentData.success) {
      console.log('✅ PosView: Payment processed successfully');
    }
  }, []);

  // Debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, 150);

  // Sync global customers to local store
  useEffect(() => {
    setCustomers(globalCustomers);
  }, [globalCustomers, setCustomers]);

  // Cart calculations (TAX = 0)
  const { totalItems, subtotal, discountAmount, tax, grossPrice } = useMemo(() => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => {
      const price = parseFloat(item.price?.toString() || '0');
      return sum + (price * item.quantity);
    }, 0);

    const discountAmount = isDiscountPercentage ? (subtotal * discount) / 100 : discount;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const tax = 0;
    const grossPrice = Math.max(0, taxableAmount);

    return { totalItems, subtotal, discountAmount, tax, grossPrice };
  }, [cart, discount, isDiscountPercentage]);

  // Safe customer lookup with numeric IDs
  const selectedCust = useMemo(() => {
    if (!selectedCustomer) return undefined;
    
    // Convert selectedCustomer (string) to number for lookup
    const customerId = parseInt(selectedCustomer, 10);
    if (isNaN(customerId)) return undefined;
    
    return globalCustomers.find(c => c?.id === customerId);
  }, [globalCustomers, selectedCustomer]);

  // Handlers
  const handleCreateNewCustomer = useCallback(async (customerData: any) => {
    try {
      console.log('🔄 Creating new customer from POS...', customerData);
      const newCustomer = await createAndAddCustomer(customerData);
      if (newCustomer?.id) {
        // ✅ Convert numeric ID to string for UI state
        const customerId = newCustomer.id.toString();
        setSelectedCustomer(customerId);
        console.log('✅ New customer created and immediately available:', newCustomer);
        
        // ✅ Force refresh the search to include the new customer
        if (searchQuery.trim()) {
          const results = await customersService.searchCustomers(searchQuery);
          console.log('🔍 Search results refreshed with new customer');
        }
      }
      return { customer: newCustomer };
    } catch (error) {
      console.error('❌ Failed to create customer:', error);
      throw error;
    }
  }, [setSelectedCustomer, createAndAddCustomer, searchQuery]);

  // Handle customer change with string IDs (for UI state)
  const handleCustomerChange = useCallback((customerId: string) => {
    console.log('👤 Customer selected:', customerId);
    setSelectedCustomer(customerId || '');
  }, [setSelectedCustomer]);

  const handleOpenNewCustomerModal = useCallback(() => {
    console.log('📝 Opening new customer modal');
    onOpenNewCustomer();
  }, [onOpenNewCustomer]);

  const handleOpenHoldOrder = useCallback(() => {
    console.log('⏸️ Opening hold orders');
    onOpenHoldOrders();
  }, [onOpenHoldOrders]);

  const handlePrintReceipt = useCallback(() => {
    if (cart.length === 0) return;
    console.log('🖨️ Printing receipt');
    handlePrint();
  }, [cart.length, handlePrint]);

  const handleCancelTransaction = useCallback(() => {
    console.log('❌ Canceling transaction');
    handleCancel();
  }, [handleCancel]);

  const safeToString = (value: any): string => {
    if (value == null) return '';
    return String(value);
  };

  const safeToNumber = (value: any): number => {
    if (value == null) return 0;
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? 0 : parsed;
  };

  // Product filtering & sorting
  const { filteredAndSortedProducts, activeFilterCount } = useMemo(() => {
    const filterProducts = () => {
      if (
        debouncedSearchQuery === '' &&
        selectedCategory === 'all' &&
        productFilters.stockStatus === 'all' &&
        productFilters.priceRange === '' &&
        !productFilters.lowStockOnly &&
        !productFilters.expiredOnly &&
        productFilters.sortBy === 'name-asc'
      ) {
        return { filteredAndSortedProducts: globalProducts, activeFilterCount: 0 };
      }

      const filtered = globalProducts.filter(product => {
        if (!product) return false;

        const matchesSearch = debouncedSearchQuery === '' ||
          (product.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
          safeToString(product.id).includes(debouncedSearchQuery);

        if (!matchesSearch) return false;

        if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;

        if (productFilters.stockStatus !== 'all') {
          const qty = safeToNumber(product.quantity);
          const low = isLowStock(product);
          if (productFilters.stockStatus === 'in-stock' && qty <= 0) return false;
          if (productFilters.stockStatus === 'out-of-stock' && qty > 0) return false;
          if (productFilters.stockStatus === 'low-stock' && !low) return false;
        }

        if (productFilters.priceRange) {
          const [minStr, maxStr] = productFilters.priceRange.split('-');
          const min = minStr ? parseFloat(minStr) : 0;
          const max = maxStr ? parseFloat(maxStr) : Infinity;
          const price = safeToNumber(product.price);
          if (price < min || price > max) return false;
        }

        if (productFilters.lowStockOnly && !isLowStock(product)) return false;

        if (productFilters.expiredOnly && product.expirationDate) {
          if (new Date(product.expirationDate) >= new Date()) return false;
        }

        return true;
      });

      let sorted = filtered;
      if (productFilters.sortBy !== 'name-asc' && filtered.length > 1) {
        sorted = [...filtered].sort((a, b) => {
          const an = a.name || '', bn = b.name || '';
          const ap = safeToNumber(a.price), bp = safeToNumber(b.price);
          const aq = safeToNumber(a.quantity), bq = safeToNumber(b.quantity);
          const ab = safeToNumber(a.barcode), bb = safeToNumber(b.barcode);

          switch (productFilters.sortBy) {
            case 'name-desc': return bn.localeCompare(an);
            case 'price-asc': return ap - bp;
            case 'price-desc': return bp - ap;
            case 'stock-asc': return aq - bq;
            case 'stock-desc': return bq - aq;
            case 'barcode-asc': return ab - bb;
            case 'expiry-asc':
              if (!a.expirationDate && !b.expirationDate) return 0;
              if (!a.expirationDate) return 1;
              if (!b.expirationDate) return -1;
              return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
            case 'expiry-desc':
              if (!a.expirationDate && !b.expirationDate) return 0;
              if (!a.expirationDate) return 1;
              if (!b.expirationDate) return -1;
              return new Date(b.expirationDate).getTime() - new Date(a.expirationDate).getTime();
            default: return an.localeCompare(bn);
          }
        });
      }

      const activeCount = Object.values(productFilters).filter(v => {
        if (typeof v === 'boolean') return v;
        if (typeof v === 'string') return v !== 'all' && v !== 'name-asc' && v !== '';
        return false;
      }).length;

      return { filteredAndSortedProducts: sorted, activeFilterCount: activeCount };
    };

    return measurePerformance('Product Filtering', filterProducts);
  }, [globalProducts, debouncedSearchQuery, selectedCategory, productFilters, isLowStock]);

  // Update parent with cart data
  useEffect(() => {
    onCartUpdate({
      items: cart,
      subtotal,
      tax,
      total: grossPrice,
      discount: discountAmount,
      customer: selectedCustomer || undefined,
      customerData: selectedCust || undefined,
    });
  }, [cart, subtotal, tax, grossPrice, discountAmount, selectedCustomer, selectedCust, onCartUpdate]);

  // Product details
  const handleViewProduct = useCallback((product: Product) => {
    console.log('👀 Viewing product:', product.name);
    setSelectedProduct(product);
    setProductDetailsOpen(true);
  }, []);

  const handleCloseProductDetails = useCallback(() => {
    console.log('❌ Closing product details');
    setProductDetailsOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleAddToCartFromDetails = useCallback((product: Product) => {
    console.log('🛒 Adding product to cart from details:', product.name);
    handleAddToCart(product);
    handleCloseProductDetails();
  }, [handleAddToCart, handleCloseProductDetails]);

  const isLoading = Object.values(globalLoading).some(Boolean);
  const error = Object.values(globalErrors).find(Boolean) || null;

  return (
    <div className="pos-view-container">
      <RefreshIndicator />
      
      {error && (
        <motion.div
          className="pos-error-alert"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <AlertTriangle size={16} />
          {error}
        </motion.div>
      )}

      <div className="pos-grid">
        <motion.div
          className="pos-section pos-product-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <PosSearch
            searchQuery={searchQuery}
            barcodeInput={barcodeInput}
            selectedCategory={selectedCategory}
            categories={globalCategories}
            scanning={false}
            onSearchChange={setSearchQuery}
            onBarcodeChange={setBarcodeInput}
            onCategoryChange={setSelectedCategory}
            onBarcodeSubmit={handleBarcodeSubmit}
            onOpenFilters={() => setFiltersModalOpen(true)}
            activeFilterCount={activeFilterCount}
          />
          <PosProducts
            products={filteredAndSortedProducts}
            loading={isLoading}
            categories={globalCategories}
            onAddToCart={handleAddToCart}
            onViewProduct={handleViewProduct}
            isLowStock={isLowStock}
          />
        </motion.div>

        <motion.div
          className="pos-section pos-cart-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <PosCart
            cart={cart}
            customers={globalCustomers}
            selectedCustomer={selectedCustomer || ''}
            discount={discount}
            isDiscountPercentage={isDiscountPercentage}
            taxRate={0}
            totalItems={totalItems}
            subtotal={subtotal}
            discountAmount={discountAmount}
            tax={tax}
            grossPrice={grossPrice}
            selectedCust={selectedCust}
            products={globalProducts}
            user={user}
            onCustomerChange={handleCustomerChange}
            onOpenNewCustomer={handleOpenNewCustomerModal}
            onRemoveItem={handleRemoveItem}
            onQuantityChange={handleQuantityChange}
            onDiscountChange={handleDiscountChange}
            onToggleDiscountType={toggleDiscountType}
            onCancel={handleCancelTransaction}
            onHoldOrder={handleOpenHoldOrder}
            onOpenPayment={onOpenPayment}
            onPrint={handlePrintReceipt}
            onPaymentComplete={handlePaymentCompleteWithRefresh}
          />
        </motion.div>
      </div>

      <ProductFilters
        filters={productFilters}
        onFiltersChange={setProductFilters}
        categories={globalCategories}
        isOpen={filtersModalOpen}
        onClose={() => setFiltersModalOpen(false)}
      />

      <ProductDetailsOverlay
        product={selectedProduct}
        categories={globalCategories}
        isOpen={productDetailsOpen}
        onClose={handleCloseProductDetails}
        onAddToCart={handleAddToCartFromDetails}
      />
    </div>
  );
});

PosView.displayName = 'PosView';
export default PosView;