// src/renderer/src/components/suppliers/SuppliersTable.tsx
import React, { useState, useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Users,
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  Eye,
  Edit3,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Supplier } from '../../services/supplierService';
import SupplierModal from './SuppliersModal';
import './SuppliersTable.css';

interface SuppliersTableProps {
  suppliers: Supplier[];
  loading: boolean;
  onSupplierUpdate: () => void;
}

const SuppliersTable: React.FC<SuppliersTableProps> = ({
  suppliers,
  loading,
  onSupplierUpdate,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');

  const getReliabilityClass = (score?: number) => {
    if (!score) return 'low';
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  const handleCreateSupplier = (): void => {
    setModalMode('create');
    setSelectedSupplier(null);
  };

  const handleEditSupplier = (supplier: Supplier): void => {
    setModalMode('edit');
    setSelectedSupplier(supplier);
  };

  const handleViewSupplier = (supplier: Supplier): void => {
    setModalMode('view');
    setSelectedSupplier(supplier);
  };

  const handleContactSupplier = (supplier: Supplier): void => {
    // This could open a contact modal or trigger phone/email
    console.log('Contact supplier:', supplier);
    // For now, just open in view mode
    handleViewSupplier(supplier);
  };

  const handleCloseModal = (): void => {
    setSelectedSupplier(null);
    setModalMode('view');
  };

  const handleSaveSupplier = (): void => {
    onSupplierUpdate();
    handleCloseModal();
  };

  const columnHelper = createColumnHelper<Supplier>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Supplier',
        size: 250,
        cell: info => {
          const supplier = info.row.original;
          const initials = supplier.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <div className="supplier-name-cell">
              <div className="supplier-avatar">
                <Users size={20} />
                <span className="avatar-initials">{initials}</span>
              </div>
              <div className="supplier-text">
                <div className="name-main">{supplier.name}</div>
                <div className="supplier-contact">
                  {supplier.contact_person && (
                    <span className="contact-item">
                      <User size={12} />
                      {supplier.contact_person}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      }),

      columnHelper.accessor('phone_number', {
        header: 'Phone',
        size: 150,
        cell: info => {
          const phone = info.getValue();
          if (!phone) return <span className="empty-field">—</span>;
          return (
            <div className="contact-info">
              <Phone size={14} />
              {phone}
            </div>
          );
        },
      }),

      columnHelper.accessor('email', {
        header: 'Email',
        size: 200,
        cell: info => {
          const email = info.getValue();
          if (!email) return <span className="empty-field">—</span>;
          return (
            <div className="contact-info">
              <Mail size={14} />
              {email}
            </div>
          );
        },
      }),

      columnHelper.accessor('total_products', {
        header: 'Products',
        size: 100,
        cell: info => {
          const count = info.getValue() || 0;
          return (
            <div className="product-count">
              {count}
            </div>
          );
        },
      }),

      columnHelper.accessor('unique_products_restocked', {
        header: 'Restocked',
        size: 110,
        cell: info => info.getValue() || 0,
      }),

      columnHelper.display({
        id: 'reliability',
        header: 'Reliability',
        size: 120,
        cell: info => {
          const score = info.row.original.reliability_score || 0;
          return (
            <span className={`reliability-badge ${getReliabilityClass(score)}`}>
              {score}%
            </span>
          );
        },
      }),

      columnHelper.accessor('last_restock_date', {
        header: 'Last Restock',
        size: 130,
        cell: info => {
          const date = info.getValue();
          if (!date) return <span className="last-restock">Never</span>;
          return new Date(date).toLocaleDateString();
        },
      }),

      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        size: 140,
        cell: info => {
          const supplier = info.row.original;
          return (
            <div className="action-buttons">
              <button
                className="btn-view"
                onClick={() => handleViewSupplier(supplier)}
                title="View Details"
              >
                <Eye size={16} />
              </button>
              <button
                className="btn-edit"
                onClick={() => handleEditSupplier(supplier)}
                title="Edit Supplier"
              >
                <Edit3 size={16} />
              </button>
              <button
                className="btn-contact"
                onClick={() => handleContactSupplier(supplier)}
                title="Contact Supplier"
              >
                <MessageSquare size={16} />
              </button>
            </div>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: suppliers,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
  });

  if (loading && suppliers.length === 0) {
    return (
      <div className="suppliers-table-modern">
        <div className="loading-state">
          <Users size={48} />
          <p>Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="suppliers-table-modern">
      {/* Header */}
      <div className="table-header">
        <div className="header-left">
          <Users size={32} />
          <h2>All Suppliers</h2>
          <span className="count">{suppliers.length} suppliers</span>
        </div>
        <div className="header-right">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>
          <button className="btn-add" onClick={handleCreateSupplier}>
            <Plus size={18} />
            Add Supplier
          </button>
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
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
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
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {suppliers.length === 0 && (
            <div className="empty-state">
              <Users size={64} />
              <h3>No suppliers found</h3>
              <p>Add your first supplier to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {suppliers.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              suppliers.length
            )}{' '}
            of {suppliers.length} suppliers
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
      {(selectedSupplier || modalMode === 'create') && (
        <SupplierModal
          supplier={modalMode === 'create' ? null : selectedSupplier}
          mode={modalMode}
          onClose={handleCloseModal}
          onSave={handleSaveSupplier}
        />
      )}
    </div>
  );
};

export default SuppliersTable;