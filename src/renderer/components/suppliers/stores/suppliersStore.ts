// src/renderer/components/suppliers/stores/suppliersStore.ts
import { create } from 'zustand';
import { suppliersService, RecentRestock, ProductSupplierComparison, SupplierProductPortfolio, Supplier } from '../../../services/supplierService';

interface SuppliersStats {
  totalSuppliers: number;
  recentRestocks: number;
  averagePriceVariance: number;
  potentialSavings: number;
  totalUnitsRestocked: number;
  uniqueSuppliersUsed: number;
  betterPriceRestocks: number;
}

interface SuppliersState {
  // View state
  currentView: 'dashboard' | 'product-search' | 'supplier-search' | 'comparison' | 'portfolio';
  
  // Data
  recentRestocks: RecentRestock[];
  searchResults: any[];
  comparisonData: ProductSupplierComparison | null;
  portfolioData: SupplierProductPortfolio | null;
  allSuppliers: Supplier[];
  
  // Stats
  stats: SuppliersStats;
  
  // UI state
  searchQuery: string;
  selectedProductId: number | null;
  selectedSupplierId: number | null;
  isLoading: boolean;
  
  // Actions
  setView: (view: SuppliersState['currentView']) => void;
  setSearchQuery: (query: string) => void;
  setSelectedProduct: (productId: number | null) => void;
  setSelectedSupplier: (supplierId: number | null) => void;
  
  // Data actions
  loadRecentRestocks: () => Promise<void>;
  searchProducts: (query: string) => Promise<void>;
  searchSuppliers: (query: string) => Promise<void>;
  loadProductComparison: (productId: number) => Promise<void>;
  loadSupplierPortfolio: (supplierId: number) => Promise<void>;
  loadAllSuppliers: () => Promise<void>;
  
  // Stats calculation
  calculateStats: () => void;
  
  // Reset
  resetSearch: () => void;
}

const initialStats: SuppliersStats = {
  totalSuppliers: 0,
  recentRestocks: 0,
  averagePriceVariance: 0,
  potentialSavings: 0,
  totalUnitsRestocked: 0,
  uniqueSuppliersUsed: 0,
  betterPriceRestocks: 0
};

export const useSuppliersStore = create<SuppliersState>((set, get) => ({
  // Initial state
  currentView: 'dashboard',
  recentRestocks: [],
  searchResults: [],
  comparisonData: null,
  portfolioData: null,
  allSuppliers: [],
  stats: initialStats,
  searchQuery: '',
  selectedProductId: null,
  selectedSupplierId: null,
  isLoading: false,

  // Actions
  setView: (view) => set({ currentView: view }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setSelectedProduct: (productId) => {
    set({ selectedProductId: productId });
    if (productId) {
      get().loadProductComparison(productId);
      set({ currentView: 'comparison' });
    }
  },
  
  setSelectedSupplier: (supplierId) => {
    set({ selectedSupplierId: supplierId });
    if (supplierId) {
      get().loadSupplierPortfolio(supplierId);
      set({ currentView: 'portfolio' });
    }
  },

  // Data actions
  loadRecentRestocks: async () => {
    set({ isLoading: true });
    try {
      console.log('🔄 Loading recent restocks from API...');
      const restocks = await suppliersService.getRecentRestocks(50, true); // Force refresh, get more items
      console.log('✅ Recent restocks loaded:', restocks.length, 'items');
      
      // Sort by date, most recent first
      const sortedRestocks = restocks.sort((a, b) => 
        new Date(b.restock_date).getTime() - new Date(a.restock_date).getTime()
      );
      
      set({ 
        recentRestocks: sortedRestocks, 
        isLoading: false 
      });
      get().calculateStats();
    } catch (error) {
      console.error('❌ Failed to load recent restocks:', error);
      set({ isLoading: false });
    }
  },

  searchProducts: async (query: string) => {
    if (!query.trim()) return;
    
    set({ isLoading: true, searchQuery: query });
    try {
      const results = await suppliersService.searchProducts(query);
      set({ 
        searchResults: results, 
        currentView: 'product-search',
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to search products:', error);
      set({ isLoading: false });
    }
  },

  searchSuppliers: async (query: string) => {
    if (!query.trim()) return;
    
    set({ isLoading: true, searchQuery: query });
    try {
      const results = await suppliersService.searchSuppliers(query);
      set({ 
        searchResults: results, 
        currentView: 'supplier-search',
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to search suppliers:', error);
      set({ isLoading: false });
    }
  },

  loadProductComparison: async (productId: number) => {
    set({ isLoading: true });
    try {
      const comparison = await suppliersService.getProductSupplierComparison(productId);
      set({ 
        comparisonData: comparison, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to load product comparison:', error);
      set({ isLoading: false });
    }
  },

  loadSupplierPortfolio: async (supplierId: number) => {
    set({ isLoading: true });
    try {
      const portfolio = await suppliersService.getSupplierPortfolio(supplierId);
      set({ 
        portfolioData: portfolio, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to load supplier portfolio:', error);
      set({ isLoading: false });
    }
  },

  loadAllSuppliers: async () => {
    set({ isLoading: true });
    try {
      console.log('🔄 Loading all suppliers from API...');
      const suppliers = await suppliersService.getSuppliers();
      console.log('✅ Suppliers loaded:', suppliers.length, 'suppliers');
      
      set({ 
        allSuppliers: suppliers, 
        isLoading: false 
      });
      get().calculateStats();
    } catch (error) {
      console.error('Failed to load suppliers:', error);
      set({ isLoading: false });
    }
  },

  // Stats calculation
  calculateStats: () => {
    const state = get();
    const { recentRestocks, allSuppliers } = state;

    console.log('📊 Calculating stats from:', {
      restocksCount: recentRestocks.length,
      suppliersCount: allSuppliers.length
    });

    // Calculate better price restocks
    const betterPriceRestocks = recentRestocks.filter(restock => {
      if (!restock.current_cost_price || !restock.cost_price) return false;
      return restock.cost_price < restock.current_cost_price;
    }).length;

    // Calculate total units restocked
    const totalUnitsRestocked = recentRestocks.reduce((sum, restock) => 
      sum + (restock.quantity || 0), 0
    );

    // Calculate unique suppliers used in recent restocks
    const uniqueSuppliersUsed = new Set(recentRestocks.map(restock => restock.supplier_id)).size;

    // Calculate average price variance (simplified)
    const priceVariances = recentRestocks
      .filter(restock => restock.current_cost_price && restock.cost_price)
      .map(restock => {
        const currentPrice = restock.current_cost_price || 0;
        const restockPrice = restock.cost_price || 0;
        return Math.abs((restockPrice - currentPrice) / currentPrice) * 100;
      });

    const averagePriceVariance = priceVariances.length > 0 
      ? priceVariances.reduce((sum, variance) => sum + variance, 0) / priceVariances.length
      : 0;

    // Calculate potential savings (simplified)
    const potentialSavings = recentRestocks
      .filter(restock => restock.current_cost_price && restock.cost_price)
      .reduce((total, restock) => {
        const currentPrice = restock.current_cost_price || 0;
        const restockPrice = restock.cost_price || 0;
        if (restockPrice < currentPrice) {
          return total + ((currentPrice - restockPrice) * (restock.quantity || 0));
        }
        return total;
      }, 0);

    const stats: SuppliersStats = {
      totalSuppliers: allSuppliers.length,
      recentRestocks: recentRestocks.length,
      averagePriceVariance: averagePriceVariance,
      potentialSavings: potentialSavings,
      totalUnitsRestocked: totalUnitsRestocked,
      uniqueSuppliersUsed: uniqueSuppliersUsed,
      betterPriceRestocks: betterPriceRestocks
    };

    console.log('📈 Stats calculated:', stats);
    set({ stats });
  },

  resetSearch: () => {
    set({ 
      searchQuery: '',
      searchResults: [],
      currentView: 'dashboard'
    });
  }
}));