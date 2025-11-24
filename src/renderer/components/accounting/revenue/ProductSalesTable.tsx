import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  createColumnHelper,
  SortingState,
  ColumnDef,
} from '@tanstack/react-table';
import {
  ArrowUpDown, ArrowUp, ArrowDown, Package, TrendingUp, DollarSign, 
  ShoppingCart, BarChart3
} from 'lucide-react';
import './ProductSalesTable.css';

interface ProductSalesData {
  productName: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  transactionCount: number;
  averagePrice: number;
}

interface ProductSalesTableProps {
  productSales: ProductSalesData[];
  loading: boolean;
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends unknown, TValue> {
    width?: string;
  }
}

const columnHelper = createColumnHelper<ProductSalesData>();

const formatCurrency = (amount: number): string => {
  return `UGX ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
};

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const getPerformanceInfo = (revenue: number, average: number) => {
  const percentage = average > 0 ? (revenue / average) * 100 : 0;
  
  if (percentage >= 200) return { level: 'excellent', label: 'Excellent', color: '#059669' };
  if (percentage >= 150) return { level: 'very-good', label: 'Very Good', color: '#10b981' };
  if (percentage >= 100) return { level: 'good', label: 'Good', color: '#84cc16' };
  if (percentage >= 50) return { level: 'average', label: 'Average', color: '#eab308' };
  return { level: 'low', label: 'Low', color: '#dc2626' };
};

interface VirtualRowProps {
  row: any;
  index: number;
}

const VirtualRow: React.FC<VirtualRowProps> = ({ row, index }) => {
  return (
    <div className={`psp-virtual-row ${index % 2 === 0 ? 'psp-virtual-row-even' : 'psp-virtual-row-odd'}`}>
      {row.getVisibleCells().map((cell: any) => (
        <div
          key={cell.id}
          className="psp-virtual-cell"
          style={{ 
            width: cell.column.columnDef.meta?.width || 'auto',
            flexGrow: cell.column.columnDef.meta?.width ? 0 : 1,
            flexShrink: 0
          }}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </div>
      ))}
    </div>
  );
};

export const ProductSalesTable: React.FC<ProductSalesTableProps> = ({
  productSales,
  loading,
}) => {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'totalRevenue', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const tableBodyRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const ROW_HEIGHT = 60;
  const OVERSCAN = 10;

  const SortIcon = ({ isSorted }: { isSorted: false | 'asc' | 'desc' }) => {
    if (!isSorted) return <ArrowUpDown size={12} className="psp-sort-icon" />;
    return isSorted === 'asc'
      ? <ArrowUp size={12} className="psp-sort-icon active" />
      : <ArrowDown size={12} className="psp-sort-icon active" />;
  };

  const averageRevenue = useMemo(() => {
    if (productSales.length === 0) return 0;
    return productSales.reduce((sum, product) => sum + product.totalRevenue, 0) / productSales.length;
  }, [productSales]);

  const columns = useMemo((): ColumnDef<ProductSalesData, any>[] => [
    columnHelper.accessor('productName', {
      header: 'Product Name',
      enableSorting: true,
      meta: {
        width: '30%'
      },
      cell: (info) => {
        const product = info.row.original;
        return (
          <div className="psp-product-cell">
            <div className="psp-product-icon">
              <Package size={14} />
            </div>
            <div className="psp-product-info">
              <span className="psp-product-name" title={product.productName}>
                {product.productName}
              </span>
              <span className="psp-product-category">
                {product.category || 'Uncategorized'}
              </span>
            </div>
          </div>
        );
      },
    }),

    columnHelper.accessor('category', {
      header: 'Category',
      enableSorting: true,
      meta: {
        width: '12%'
      },
      cell: (info) => (
        <span className="psp-category-tag">
          {info.getValue() || 'Uncategorized'}
        </span>
      ),
    }),

    columnHelper.accessor('totalQuantity', {
      header: 'Units Sold',
      enableSorting: true,
      meta: {
        width: '12%'
      },
      cell: (info) => (
        <div className="psp-quantity-cell">
          <div className="psp-quantity-value">{formatNumber(info.getValue())}</div>
          <div className="psp-quantity-bar">
            <div 
              className="psp-quantity-fill"
              style={{ 
                width: `${Math.min((info.getValue() / Math.max(...productSales.map(p => p.totalQuantity))) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      ),
    }),

    columnHelper.accessor('totalRevenue', {
      header: 'Total Revenue',
      enableSorting: true,
      meta: {
        width: '15%'
      },
      cell: (info) => (
        <div className="psp-revenue-cell">
          <DollarSign size={12} className="psp-revenue-icon" />
          <span className="psp-revenue-value">{formatCurrency(info.getValue())}</span>
        </div>
      ),
    }),

    columnHelper.accessor('averagePrice', {
      header: 'Avg Price',
      enableSorting: true,
      meta: {
        width: '12%'
      },
      cell: (info) => (
        <span className="psp-avg-price">{formatCurrency(info.getValue())}</span>
      ),
    }),

    columnHelper.accessor('transactionCount', {
      header: 'Sales',
      enableSorting: true,
      meta: {
        width: '9%'
      },
      cell: (info) => (
        <div className="psp-sales-cell">
          <ShoppingCart size={12} className="psp-sales-icon" />
          <span className="psp-sales-count">{formatNumber(info.getValue())}</span>
        </div>
      ),
    }),

    columnHelper.display({
      id: 'performance',
      header: 'Performance',
      enableSorting: false,
      meta: {
        width: '10%'
      },
      cell: ({ row }) => {
        const performance = getPerformanceInfo(row.original.totalRevenue, averageRevenue);
        return (
          <div 
            className="psp-performance-indicator"
            style={{
              backgroundColor: performance.color,
              color: 'white'
            }}
          >
            <TrendingUp size={12} className="psp-performance-icon" />
            <span className="psp-performance-label">{performance.label}</span>
          </div>
        );
      },
    }),

  ], [productSales, averageRevenue]);

  const table = useReactTable({
    data: productSales,
    columns,
    state: { 
      sorting, 
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;

  const handleBodyScroll = useCallback(() => {
    if (!tableBodyRef.current) return;
    
    const { scrollTop, clientHeight } = tableBodyRef.current;
    
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const end = Math.min(rows.length, Math.ceil((scrollTop + clientHeight) / ROW_HEIGHT) + OVERSCAN);
    setVisibleRange({ start, end });
  }, [rows.length]);

  useEffect(() => {
    const el = tableBodyRef.current;
    if (!el) return;
    handleBodyScroll();
    el.addEventListener('scroll', handleBodyScroll);
    return () => el.removeEventListener('scroll', handleBodyScroll);
  }, [handleBodyScroll]);

  useEffect(() => {
    if (tableBodyRef.current) tableBodyRef.current.scrollTop = 0;
  }, [sorting, pagination.pageIndex]);

  if (loading) {
    return (
      <div className="psp-loading">
        <div className="psp-loading-spinner"></div>
        <span>Loading product sales data...</span>
      </div>
    );
  }

  const visibleRows = rows.slice(visibleRange.start, visibleRange.end);
  const offsetY = visibleRange.start * ROW_HEIGHT;
  const totalHeight = rows.length * ROW_HEIGHT;

  return (
    <div className="psp-container">
      <div className="psp-table-header">
        {table.getHeaderGroups().map(headerGroup => (
          <div key={headerGroup.id} className="psp-header-row">
            {headerGroup.headers.map(header => (
              <div
                key={header.id}
                className="psp-header-cell"
                style={{ 
                  width: header.column.columnDef.meta?.width || 'auto',
                  flexGrow: header.column.columnDef.meta?.width ? 0 : 1,
                  flexShrink: 0
                }}
                onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
              >
                <div className="psp-header-content">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getCanSort() && <SortIcon isSorted={header.column.getIsSorted()} />}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="psp-table-body" ref={tableBodyRef}>
        {rows.length === 0 ? (
          <div className="psp-empty-state">
            <BarChart3 size={48} className="psp-empty-icon" />
            <div className="psp-empty-text">No product sales data</div>
            <div className="psp-empty-subtext">No sales recorded for the selected period</div>
          </div>
        ) : (
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleRows.map((row, idx) => (
                <VirtualRow key={row.id} row={row} index={visibleRange.start + idx} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="psp-pagination">
        <div className="psp-pagination-info">
          Showing {rows.length} of {productSales.length} products
        </div>
        <div className="psp-pagination-controls">
          <button 
            className="psp-pagination-btn" 
            onClick={() => { 
              table.previousPage(); 
              if (tableBodyRef.current) tableBodyRef.current.scrollTop = 0; 
            }} 
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <span className="psp-page-info">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button 
            className="psp-pagination-btn" 
            onClick={() => { 
              table.nextPage(); 
              if (tableBodyRef.current) tableBodyRef.current.scrollTop = 0; 
            }} 
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
          <select
            className="psp-page-size-select"
            value={table.getState().pagination.pageSize}
            onChange={e => { 
              table.setPageSize(Number(e.target.value)); 
              if (tableBodyRef.current) tableBodyRef.current.scrollTop = 0; 
            }}
          >
            {[50, 100, 200].map(size => (
              <option key={size} value={size}>Show {size}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};