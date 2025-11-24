import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Table } from '@tanstack/react-table';

interface ModernPaginationProps {
  table: Table<any>;
}

export const ModernPagination: React.FC<ModernPaginationProps> = ({ table }) => (
  <div className="modern-pagination">
    <div className="pagination-info">
      Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
      {Math.min(
        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
        table.getFilteredRowModel().rows.length
      )} of {table.getFilteredRowModel().rows.length}
    </div>
    
    <div className="pagination-controls">
      <button
        className="pagination-btn"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronLeft size={16} />
      </button>
      
      <div className="page-size">
        <select
          value={table.getState().pagination.pageSize}
          onChange={e => table.setPageSize(Number(e.target.value))}
          className="page-size-select"
        >
          {[5, 10, 20, 50, 100, 250, 500, 1000].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </select>
      </div>
      
      <button
        className="pagination-btn"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
);