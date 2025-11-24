// src/renderer/src/hooks/useProductsTable.tsx
import { useMemo, useState, useCallback } from 'react';
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { Product, Category, ProductFilters } from '../../types/products.types';

const columnHelper = createColumnHelper<Product>();

interface UseProductsTableProps {
  products: Product[];
  categories: Category[];
  filters: ProductFilters;
  onQuickStockUpdate?: (productId: number, newQuantity: number) => void;
  loadingProducts?: Set<number>;
}

export const useProductsTable = ({ 
  products, 
  categories, 
  filters,
  onQuickStockUpdate,
  loadingProducts = new Set()
}: UseProductsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [editingStock, setEditingStock] = useState<number | null>(null);
  const [tempStockValue, setTempStockValue] = useState<string>('');

  const calculateProfit = useCallback((product: Product) => {
    if (!product.costPrice) return null;
    
    // Handle nullable price - use 0 if price is null
    const sellingPrice = product.price ? parseFloat(product.price.toString()) : 0;
    const costPrice = parseFloat(product.costPrice.toString());
    
    if (costPrice <= 0) return null;
    
    const profit = sellingPrice - costPrice;
    const margin = (profit / costPrice) * 100;
    return { profit, margin };
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  }, []);

  const getCategoryName = useCallback((categoryId: string) => {
    const category = categories.find(cat => cat.id.toString() === categoryId);
    return category ? category.name : 'Unknown';
  }, [categories]);

  // Quick stock edit handlers
  const handleStockEditStart = useCallback((productId: number, currentQuantity: number) => {
    // Don't allow editing if already updating
    if (loadingProducts.has(productId)) return;
    
    setEditingStock(productId);
    setTempStockValue(currentQuantity.toString());
  }, [loadingProducts]);

  const handleStockEditChange = useCallback((value: string) => {
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      setTempStockValue(value);
    }
  }, []);

  const handleStockEditSave = useCallback((productId: number) => {
    const newQuantity = parseInt(tempStockValue) || 0;
    
    // Validate input
    if (newQuantity < 0) {
      alert('Stock quantity cannot be negative');
      return;
    }
    
    // Get current product to check if quantity changed
    const currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) {
      console.error('❌ Product not found:', productId);
      return;
    }
    
    // Don't do anything if quantity hasn't changed
    if (currentProduct.quantity === newQuantity) {
      console.log('🔄 No change in quantity, skipping update');
      setEditingStock(null);
      setTempStockValue('');
      return;
    }
    
    console.log('🚀 Quick stock edit - triggering immediate update:', { 
      productId, 
      oldQuantity: currentProduct.quantity,
      newQuantity 
    });
    
    // Close the edit UI immediately (this is key for fast UX)
    setEditingStock(null);
    setTempStockValue('');
    
    // Trigger the instant update (which handles state update + API call + rollback)
    if (onQuickStockUpdate) {
      onQuickStockUpdate(productId, newQuantity);
    }
  }, [tempStockValue, onQuickStockUpdate, products]);

  const handleStockEditCancel = useCallback(() => {
    setEditingStock(null);
    setTempStockValue('');
  }, []);

  // Keyboard shortcut handler for quick edits
  const handleStockKeyDown = useCallback((e: React.KeyboardEvent, productId: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleStockEditSave(productId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleStockEditCancel();
    }
  }, [handleStockEditSave, handleStockEditCancel]);

  const columns = useMemo(() => [
    columnHelper.accessor('barcode', {
      header: 'Barcode',
      cell: (info) => (
        <span className="barcode-cell">
          {info.getValue() || '-'}
        </span>
      ),
      size: 120,
    }),
    columnHelper.accessor('name', {
      header: 'Product Name',
      cell: (info) => (
        <div className="product-name-cell">
          <span className="product-name">{info.getValue()}</span>
          {info.row.original.img && (
            <span className="image-indicator" title="Has image">🖼️</span>
          )}
          {info.row.original.prescriptionRequired && (
            <span className="prescription-indicator" title="Prescription Required">💊</span>
          )}
          {info.row.original.isControlledSubstance && (
            <span className="controlled-indicator" title="Controlled Substance">🛡️</span>
          )}
          {info.row.original.requiresRefrigeration && (
            <span className="refrigeration-indicator" title="Requires Refrigeration">❄️</span>
          )}
        </div>
      ),
      size: 200,
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: (info) => getCategoryName(info.getValue()),
      size: 120,
    }),
    columnHelper.accessor('price', {
      header: 'Selling Price',
      cell: (info) => {
        const price = info.getValue();
        return price ? formatCurrency(parseFloat(price.toString())) : '-';
      },
      size: 130,
    }),
    columnHelper.accessor('costPrice', {
      header: 'Cost Price',
      cell: (info) => {
        const value = info.getValue();
        return value ? formatCurrency(parseFloat(value.toString())) : '-';
      },
      size: 130,
    }),
    columnHelper.accessor(row => row, {
      id: 'profit',
      header: 'Profit',
      cell: (info) => {
        const profitData = calculateProfit(info.getValue());
        return profitData ? (
          <div className="profit-cell">
            <div className="profit-amount">
              {formatCurrency(profitData.profit)}
            </div>
            <div className={`profit-margin ${profitData.margin >= 0 ? 'positive' : 'negative'}`}>
              ({profitData.margin.toFixed(1)}%)
            </div>
          </div>
        ) : '-';
      },
      size: 130,
    }),
    columnHelper.accessor('quantity', {
      header: 'Stock',
      cell: (info) => {
        const product = info.row.original;
        const quantity = info.getValue();
        const minStock = parseInt(product.minStock?.toString() || '1');
        const status = quantity === 0 ? 'out' : quantity <= minStock ? 'low' : 'good';
        const isEditing = editingStock === product.id;
        const isLoading = loadingProducts.has(product.id);

        if (isEditing) {
          return (
            <div className="stock-edit-cell">
              <input
                type="text"
                value={tempStockValue}
                onChange={(e) => handleStockEditChange(e.target.value)}
                className="stock-edit-input"
                onKeyDown={(e) => handleStockKeyDown(e, product.id)}
                onBlur={() => handleStockEditSave(product.id)}
                autoFocus
                placeholder="Enter quantity"
              />
              <div className="stock-edit-actions">
                <button 
                  onClick={() => handleStockEditSave(product.id)}
                  className="stock-save-btn"
                  title="Save (Enter)"
                >
                  ✓
                </button>
                <button 
                  onClick={handleStockEditCancel}
                  className="stock-cancel-btn"
                  title="Cancel (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        }
        
        if (isLoading) {
          return (
            <div className="stock-cell updating">
              <div className="updating-indicator">
                <div className="updating-spinner"></div>
                <span className="updating-text">Saving...</span>
              </div>
              <div className="stock-pending-value" title="New value being saved">
                {quantity}
              </div>
            </div>
          );
        }
        
        return (
          <div 
            className={`stock-cell ${status} ${onQuickStockUpdate ? 'editable' : ''}`}
            onClick={() => onQuickStockUpdate && handleStockEditStart(product.id, quantity)}
            title={onQuickStockUpdate ? "Click to edit stock" : ""}
          >
            <span className="stock-quantity">{quantity}</span>
            {status === 'low' && <span className="warning-icon">⚠️</span>}
            {status === 'out' && <span className="out-icon">❌</span>}
            {onQuickStockUpdate && <span className="edit-hint">✏️</span>}
          </div>
        );
      },
      size: 120,
    }),
    columnHelper.accessor('expirationDate', {
      header: 'Expiry Date',
      cell: (info) => {
        const expiryDate = info.getValue();
        if (!expiryDate) return '-';
        
        try {
          const date = new Date(expiryDate);
          const today = new Date();
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(today.getDate() + 30);
          
          const status = date < today ? 'expired' : date <= thirtyDaysFromNow ? 'expiring' : 'good';
          
          return (
            <div className={`expiry-cell ${status}`}>
              {date.toLocaleDateString()}
              {status === 'expiring' && <span className="warning-icon">⚠️</span>}
              {status === 'expired' && <span className="expired-icon">❌</span>}
            </div>
          );
        } catch (error) {
          return '-';
        }
      },
      size: 120,
    }),
    columnHelper.accessor('supplier', {
      header: 'Supplier',
      cell: (info) => info.getValue() || '-',
      size: 120,
    }),
    columnHelper.accessor('manufacturer', {
      header: 'Manufacturer',
      cell: (info) => info.getValue() || '-',
      size: 120,
    }),
    columnHelper.accessor('prescriptionRequired', {
      header: 'Prescription',
      cell: (info) => info.getValue() ? 'Yes' : 'No',
      size: 100,
    }),
    columnHelper.accessor('batchNumber', {
      header: 'Batch No.',
      cell: (info) => info.getValue() || '-',
      size: 110,
    }),
    columnHelper.accessor('lastRestocked', {
      header: 'Last Restocked',
      cell: (info) => {
        const value = info.getValue();
        if (!value) return '-';
        
        try {
          return new Date(value).toLocaleDateString();
        } catch (error) {
          return '-';
        }
      },
      size: 120,
    }),
  ], [
    getCategoryName, 
    formatCurrency, 
    calculateProfit, 
    editingStock, 
    tempStockValue, 
    loadingProducts,
    onQuickStockUpdate,
    handleStockEditStart,
    handleStockEditChange,
    handleStockEditSave,
    handleStockEditCancel,
    handleStockKeyDown,
    products
  ]);

  // CRITICAL: Use products directly without memoization to ensure updates flow through
  const table = useReactTable({
    data: products,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  const exportToExcel = useCallback(() => {
    console.log('Exporting to Excel...', products);
    alert('Excel export feature coming soon!');
  }, [products]);

  const exportToPDF = useCallback(() => {
    console.log('Exporting to PDF...', products);
    alert('PDF export feature coming soon!');
  }, [products]);

  return {
    table,
    exportToExcel,
    exportToPDF,
    editingStock,
    handleStockEditSave,
    handleStockEditCancel
  };
};