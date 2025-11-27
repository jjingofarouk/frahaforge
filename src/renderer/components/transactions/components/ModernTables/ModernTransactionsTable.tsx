// src/renderer/src/components/transactions/components/ModernTables/ModernTransactionsTable.tsx
import React, { useState, useMemo } from 'react';
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
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Calendar,
  User,
  Users,
  Receipt,
} from 'lucide-react';
import { Transaction } from '../../../../services/transactionsService';
import { formatCurrency } from '../../../../src/utils/ugandaTime';
import './TransactionsTable.css';

interface ModernTransactionsTableProps {
  transactions: Transaction[];
  onViewTransaction: (transactionId: number) => void;
  getCustomerName: (customerId: number) => string;
  loading?: boolean;
}

export const ModernTransactionsTable: React.FC<ModernTransactionsTableProps> = ({
  transactions,
  onViewTransaction,
  getCustomerName,
  loading = false,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Get unique payment types and statuses
  const paymentTypes = useMemo(() => {
    return [...new Set(transactions.map(t => t.payment_type).filter(Boolean))];
  }, [transactions]);

  const statusTypes = useMemo(() => {
    return ['all', 'paid', 'partial', 'unpaid'];
  }, []);

  const getStatusInfo = (transaction: Transaction) => {
    const total = transaction.total || 0;
    const paid = transaction.paid || 0;
    const due = total - paid;
    
    if (due === 0) return { label: 'Paid', class: 'status-paid' };
    if (paid > 0) return { label: 'Partial', class: 'status-partial' };
    return { label: 'Unpaid', class: 'status-unpaid' };
  };

  const getPaymentTypeInfo = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'cash':
        return { label: 'Cash', class: 'payment-cash' };
      case 'card':
        return { label: 'Card', class: 'payment-card' };
      case 'due':
        return { label: 'Credit', class: 'payment-due' };
      case 'mobile':
        return { label: 'Mobile', class: 'payment-mobile' };
      default:
        return { label: type || 'Unknown', class: 'payment-unknown' };
    }
  };

  // Format date for display (date only, no time)
  const formatDateDisplay = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-UG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Helper function to check if transaction date matches the date filter
  const matchesDateFilter = (transactionDate: string): boolean => {
    if (!dateFilter) return true;
    
    try {
      const transactionDateObj = new Date(transactionDate);
      const filterDateObj = new Date(dateFilter);
      
      // Compare dates (ignoring time)
      return transactionDateObj.toDateString() === filterDateObj.toDateString();
    } catch (error) {
      console.error('Error parsing date:', error);
      return false;
    }
  };

  // Filter transactions based on payment type, status, and date filters
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply payment type filter
    if (selectedPaymentType !== 'all') {
      filtered = filtered.filter(transaction => 
        transaction.payment_type?.toLowerCase() === selectedPaymentType.toLowerCase()
      );
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(transaction => {
        const statusInfo = getStatusInfo(transaction);
        return statusInfo.label.toLowerCase() === selectedStatus.toLowerCase();
      });
    }

    // Apply strict date filter
    if (dateFilter) {
      filtered = filtered.filter(transaction => 
        matchesDateFilter(transaction.created_at)
      );
    }

    return filtered;
  }, [transactions, selectedPaymentType, selectedStatus, dateFilter]);

  const columnHelper = createColumnHelper<Transaction>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('order_number', {
        header: 'Invoice',
        size: 130,
        cell: info => (
          <div className="invoice-cell">
            <Receipt size={18} className="invoice-icon" />
            <div className="invoice-text">
              <div className="invoice-number">#{info.getValue()}</div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('created_at', {
        header: 'Date',
        size: 120,
        cell: info => {
          const dateDisplay = formatDateDisplay(info.getValue());
          return (
            <div className="date-cell">
              <Calendar size={18} className="date-icon" />
              <div className="date-text">
                <div className="date-display">{dateDisplay}</div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('customer_name', {
        header: 'Customer',
        size: 180,
        cell: info => {
          const customerName = info.getValue() || 'Walk-in Customer';
          return (
            <div className="customer-cell">
              <User size={18} className="customer-icon" />
              <div className="customer-text">
                <div className="customer-name">{customerName}</div>
              </div>
            </div>
          );
        },
      }),
columnHelper.accessor('total', {
  header: 'Total',
  size: 140,
  cell: info => (
    <div className="amount-cell total-amount column-total">
      {formatCurrency(info.getValue())}
    </div>
  ),
}),
      columnHelper.accessor('paid', {
        header: 'Paid',
        size: 140,
        cell: info => (
          <div className="amount-cell paid-amount">
            {formatCurrency(info.getValue())}
          </div>
        ),
      }),
      columnHelper.display({
        id: 'due_amount',
        header: 'Due',
        size: 140,
        cell: info => {
          const transaction = info.row.original;
          const due = (transaction.total || 0) - (transaction.paid || 0);
          return (
            <div className={`amount-cell due-amount ${due > 0 ? 'has-due' : 'no-due'}`}>
              {formatCurrency(due)}
            </div>
          );
        },
      }),
      columnHelper.accessor('payment_type', {
        header: 'Payment',
        size: 120,
        cell: info => {
          const { label, class: className } = getPaymentTypeInfo(info.getValue() || '');
          return (
            <div className="payment-cell">
              <span className={`payment-badge ${className}`}>
                {label}
              </span>
            </div>
          );
        },
      }),
columnHelper.display({
  id: 'status',
  header: 'Status',
  size: 100,
  cell: info => {
    const { label, class: className } = getStatusInfo(info.row.original);
    return (
      <span className={`status-indicator ${className}`}>
        {label}
      </span>
    );
  },
}),
      columnHelper.accessor('user_name', {
        header: 'Staff',
        size: 120,
        cell: info => (
          <div className="staff-cell">
            <Users size={18} className="staff-icon" />
            <div className="staff-text">
              {info.getValue() || 'Unknown'}
            </div>
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filteredTransactions,
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

  // Calculate totals
  const totals = useMemo(() => {
    const totalSales = filteredTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalPaid = filteredTransactions.reduce((sum, t) => sum + (t.paid || 0), 0);
    const totalDue = totalSales - totalPaid;
    const transactionCount = filteredTransactions.length;
    
    return { totalSales, totalPaid, totalDue, transactionCount };
  }, [filteredTransactions]);

  const handleExport = () => {
    // Simple CSV export implementation
    const headers = ['Invoice', 'Date', 'Customer', 'Total', 'Paid', 'Due', 'Payment', 'Status', 'Staff'];
    const csvData = filteredTransactions.map(transaction => [
      `#${transaction.order_number}`,
      formatDateDisplay(transaction.created_at),
      transaction.customer_name,
      transaction.total,
      transaction.paid,
      (transaction.total || 0) - (transaction.paid || 0),
      transaction.payment_type,
      getStatusInfo(transaction).label,
      transaction.user_name
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="transactions-table-modern">
        <div className="loading-state">
          <Receipt size={48} />
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-table-modern">

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-label">Total Sales</div>
          <div className="summary-value sales-total">{formatCurrency(totals.totalSales)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Paid</div>
          <div className="summary-value paid-total">{formatCurrency(totals.totalPaid)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Due</div>
          <div className="summary-value due-total">{formatCurrency(totals.totalDue)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Transactions</div>
          <div className="summary-value count-total">{totals.transactionCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="table-filters">
        <div className="filter-group">
          <label>Payment Type</label>
          <select 
            value={selectedPaymentType} 
            onChange={(e) => setSelectedPaymentType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Payment Types</option>
            {paymentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            {statusTypes.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select"
          />
        </div>

        <div className="filter-summary">
          {filteredTransactions.length < transactions.length && (
            <span className="filter-notice">
              Showing {filteredTransactions.length} of {transactions.length} transactions
              {dateFilter && ` for ${new Date(dateFilter).toLocaleDateString()}`}
            </span>
          )}
          {dateFilter && (
            <button 
              className="clear-date-filter"
              onClick={() => setDateFilter('')}
            >
              Clear date filter
            </button>
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
                  className="transaction-row"
                  onClick={() => onViewTransaction(row.original.id)}
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

          {filteredTransactions.length === 0 && (
            <div className="empty-state">
              <Receipt size={64} />
              <h3>No transactions found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredTransactions.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              filteredTransactions.length
            )}{' '}
            of {filteredTransactions.length} transactions
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
    </div>
  );
};

export default ModernTransactionsTable;