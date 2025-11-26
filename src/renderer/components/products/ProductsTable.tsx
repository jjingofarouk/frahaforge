// src/renderer/src/components/products/ProductsTable.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Package,
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  Eye,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { inventoryService, Product } from '../../services/inventoryService';
import ProductModal from './ProductModal';
import './ProductsTable.css';

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  onProductUpdate: () => void;
}

const ProductsTable: React.FC<ProductsTableProps> = ({ products, loading, onProductUpdate }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  // Listen for switch to edit mode event
  useEffect(() => {
    const handleSwitchToEditMode = (event: CustomEvent) => {
      setSelectedProduct(event.detail);
      setModalMode('edit');
    };

    window.addEventListener('switchToEditMode' as any, handleSwitchToEditMode as EventListener);
    
    return () => {
      window.removeEventListener('switchToEditMode' as any, handleSwitchToEditMode as EventListener);
    };
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(products.map(p => p.category).filter(Boolean))];
  }, [products]);

  // Image URL generator
  const getProductImageUrl = (product: Product): string => {
    const id = product.id?.toString();
    if (!id) return '';
    const sanitizedName = product.name
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    const backendUrl = window.electron?.backend?.getBackendUrl?.() || 'http://192.168.1.3:3001';
    return `${backendUrl}/assets/product-images/${id}_${sanitizedName}.jpg`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const img = e.target as HTMLImageElement;
    img.style.display = 'none';
    const placeholder = img.nextElementSibling as HTMLElement;
    if (placeholder?.classList.contains('img-placeholder')) {
      placeholder.style.display = 'flex';
    }
  };

  const handleCreateProduct = (): void => {
    setModalMode('create');
    setSelectedProduct(null);
  };

  const handleEditProduct = (product: Product): void => {
    setModalMode('edit');
    setSelectedProduct(product);
  };

  const handleViewProduct = (product: Product): void => {
    setModalMode('view');
    setSelectedProduct(product);
  };

  const handleDeleteProduct = async (productId: number): Promise<void> => {
    if (!confirm('Delete this product permanently?')) return;
    try {
      await inventoryService.deleteProduct(productId);
      onProductUpdate();
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleCloseModal = (): void => {
    setSelectedProduct(null);
    setModalMode('view');
  };

  const handleSaveProduct = (): void => {
    onProductUpdate();
    handleCloseModal();
  };

  const getStockStatus = (product: Product): string => {
    if (product.quantity <= 0) return 'out-of-stock';
    if (product.quantity <= (product.min_stock || 0)) return 'low-stock';
    return 'adequate';
  };

  const getStockStatusText = (product: Product): string => {
    if (product.quantity <= 0) return 'Out of Stock';
    if (product.quantity <= (product.min_stock || 0)) return 'Low Stock';
    return 'Adequate';
  };

  const getStockStatusColor = (product: Product): string => {
    const status = getStockStatus(product);
    switch (status) {
      case 'out-of-stock': return '#DC2626';
      case 'low-stock': return '#D97706';
      default: return '#059669';
    }
  };

  // Filter products based on category and stock filters
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Apply stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(product => product.quantity <= (product.min_stock || 0));
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(product => product.quantity <= 0);
    } else if (stockFilter === 'adequate') {
      filtered = filtered.filter(product => product.quantity > (product.min_stock || 0));
    }

    return filtered;
  }, [products, selectedCategory, stockFilter]);

  const columnHelper = createColumnHelper<Product>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Product',
        size: 300,
        cell: info => {
          const product = info.row.original;
          const imageUrl = getProductImageUrl(product);
          const hasImage = !!product.id;

          return (
            <div className="product-name-cell">
              <div className="product-image-wrapper">
                {hasImage ? (
                  <>
                    <img src={imageUrl} alt={product.name} onError={handleImageError} loading="lazy" />
                    <div className="img-placeholder">
                      <Package size={20} />
                    </div>
                  </>
                ) : (
                  <div className="img-placeholder no-image">
                    <Package size={20} />
                  </div>
                )}
              </div>
              <div className="product-text">
                <div className="name-main">{product.name}</div>
                {product.description && <div className="product-desc">{product.description}</div>}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('barcode', {
        header: 'Barcode',
        size: 140,
        cell: info => info.getValue() || '—',
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        size: 160,
        cell: info => info.getValue() || 'Uncategorized',
      }),
      columnHelper.accessor('quantity', {
        header: 'Stock',
        size: 100,
        cell: info => {
          const product = info.row.original;
          const stockClass = product.quantity <= 0 ? 'stock-out' : 
                            product.quantity <= (product.min_stock || 0) ? 'stock-low' : 
                            'stock-adequate';
          return (
            <div className={`stock-number ${stockClass}`}>
              {product.quantity}
            </div>
          );
        },
      }),
      columnHelper.accessor('cost_price', {
        header: 'Cost Price',
        size: 130,
        cell: info => `UGX ${Number(info.getValue() || 0).toLocaleString()}`,
      }),
      columnHelper.accessor('price', {
        header: 'Selling Price',
        size: 140,
        cell: info => `UGX ${Number(info.getValue() || 0).toLocaleString()}`,
      }),
      columnHelper.display({
        id: 'profit_margin',
        header: 'Profit Margin',
        size: 140,
        cell: info => {
          const product = info.row.original;
          const costPrice = parseFloat(product.cost_price as any) || 0;
          const sellingPrice = parseFloat(product.price as any) || 0;
          const profitMargin = sellingPrice && costPrice ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0;
          
          return (
            <span className={`profit-margin ${profitMargin >= 0 ? 'positive' : 'negative'}`}>
              {profitMargin.toFixed(1)}%
            </span>
          );
        },
      }),
      columnHelper.accessor('supplier', {
        header: 'Supplier',
        size: 150,
        cell: info => info.getValue() || 'N/A',
      }),
      columnHelper.accessor('expiration_date', {
        header: 'Expiry Date',
        size: 130,
        cell: info => {
          const date = info.getValue();
          if (!date) return <span className="expiry-none">No expiry</span>;
          
          const expiryDate = new Date(date as string);
          const today = new Date();
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          let expiryClass = 'expiry-good';
          if (daysUntilExpiry < 0) {
            expiryClass = 'expiry-expired';
          } else if (daysUntilExpiry <= 30) {
            expiryClass = 'expiry-critical';
          } else if (daysUntilExpiry <= 90) {
            expiryClass = 'expiry-warning';
          }
          
          return (
            <span className={`expiry-date ${expiryClass}`}>
              {expiryDate.toLocaleDateString()}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        size: 200,
        cell: info => {
          const product = info.row.original;
          return (
            <div className="action-buttons">
              <button 
                className="btn-view" 
                onClick={() => handleViewProduct(product)} 
                title="View"
              >
                <Eye size={16} />
              </button>
              <button 
                className="btn-edit" 
                onClick={() => handleEditProduct(product)} 
                title="Edit"
              >
                <Edit3 size={16} />
              </button>
              <button 
                className="btn-delete" 
                onClick={() => handleDeleteProduct(product.id)} 
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filteredProducts,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  if (loading && products.length === 0) {
    return (
      <div className="products-table-modern">
        <div className="loading-state">
          <Package size={48} />
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="products-table-modern">
      {/* Header */}
      <div className="table-header">
        <div className="header-left">
          <Package size={32} />
          <h2>All Products</h2>
          <span className="count">{filteredProducts.length} products</span>
        </div>
        <div className="header-right">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>
          <button className="btn-add" onClick={handleCreateProduct}>
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="table-filters">
        <div className="filter-group">
          <label>Category</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Stock Status</label>
          <select 
            value={stockFilter} 
            onChange={(e) => setStockFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="adequate">Adequate Stock</option>
          </select>
        </div>

        <div className="filter-summary">
          {filteredProducts.length < products.length && (
            <span className="filter-notice">
              Showing {filteredProducts.length} of {products.length} products
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div className="table-container">
          <table className="modern-table">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                      className={header.column.getCanSort() ? 'sortable' : ''}
                    >
                      <div className="th-content">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <span className="sort-icon">
                            {header.column.getIsSorted() === 'asc' ? 
                              <ChevronUp size={14} /> : 
                              <ChevronDown size={14} />
                            }
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr 
                  key={row.id}
                  className={`row-${getStockStatus(row.original)}`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="empty-state">
              <Package size={64} />
              <h3>No products found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              filteredProducts.length
            )}{' '}
            of {filteredProducts.length} products
          </div>

          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              title="First page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              className="pagination-btn"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              title="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="page-number">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>

            <button
              className="pagination-btn"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              title="Next page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="pagination-btn"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              title="Last page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>

          <div className="page-size-selector">
            <label>Show</label>
            <select
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
            >
              {[25, 50, 100, 200].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
            <label>per page</label>
          </div>
        </div>
      )}

      {/* Modal */}
      {(selectedProduct || modalMode === 'create') && (
        <ProductModal
          product={modalMode === 'create' ? null : selectedProduct}
          mode={modalMode}
          onClose={handleCloseModal}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
};

export default ProductsTable;