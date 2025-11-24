// src/renderer/src/components/ModernHeader/ModernHeader.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  subMonths,
  isSameDay,
  isSameWeek,
  isSameMonth,
  parseISO 
} from 'date-fns';
import { Download, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, X, RefreshCw, BarChart3 } from 'lucide-react';
import { 
  getUgandaStartOfDay, 
  getUgandaEndOfDay, 
  formatDateForUgandaAPI,
  getTodayUgandaRange,
  getUgandaDateRange
} from '../../../../src/utils/ugandaTime';
import './ModernHeader.css';

interface ModernHeaderProps {
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (dateRange: { start: Date; end: Date }) => void;
  onExport: (filters: ExportFilters) => void;
  transactionCount: number;
  loading: boolean;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
  filters: {
    status?: string;
    paymentMethod?: string;
    searchQuery?: string;
  };
  onFilterChange: (filters: { status?: string; paymentMethod?: string; searchQuery?: string }) => void;
  onRefresh?: () => void;
}

export interface ExportFilters {
  startDate: string;
  endDate: string;
  status?: string;
  paymentMethod?: string;
  searchQuery?: string;
}

const ModernHeader: React.FC<ModernHeaderProps> = ({
  dateRange,
  onDateRangeChange,
  onExport,
  transactionCount,
  loading,
  sortBy,
  sortDirection,
  onSortChange,
  filters = {},
  onFilterChange = () => {},
  onRefresh
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(filters.searchQuery || '');
  const [isBlinking, setIsBlinking] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Blinking animation for real-time indicator
  useEffect(() => {
    if (lastRefresh) {
      setIsBlinking(true);
      const timer = setTimeout(() => setIsBlinking(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastRefresh]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchQuery !== filters.searchQuery) {
        onFilterChange({ ...filters, searchQuery: localSearchQuery });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, filters, onFilterChange]);

  // FIXED: Uganda timezone date formatting for input fields
  const formatDateForInput = (date: Date): string => {
    return formatDateForUgandaAPI(date);
  };

  // FIXED: Handle date input changes with Uganda timezone
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    
    // Get the Uganda date range for the selected date
    const ugandaRange = getUgandaDateRange(e.target.value, e.target.value);
    const newStart = ugandaRange.start;
    const newEnd = isSameDay(dateRange.start, dateRange.end) 
      ? ugandaRange.end
      : dateRange.end;
    
    console.log('🟢 Start date changed:', {
      selected: e.target.value,
      ugandaStart: newStart,
      ugandaEnd: newEnd
    });
    
    onDateRangeChange({ start: newStart, end: newEnd });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    
    // Get the Uganda date range for the selected date
    const ugandaRange = getUgandaDateRange(e.target.value, e.target.value);
    const newEnd = ugandaRange.end;
    const newStart = isSameDay(dateRange.start, dateRange.end)
      ? ugandaRange.start
      : dateRange.start;
    
    console.log('🔴 End date changed:', {
      selected: e.target.value,
      ugandaStart: newStart,
      ugandaEnd: newEnd
    });
    
    onDateRangeChange({ start: newStart, end: newEnd });
  };

  // Handle filter changes
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value || undefined;
    onFilterChange({ ...filters, status });
  };

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const paymentMethod = e.target.value || undefined;
    onFilterChange({ ...filters, paymentMethod });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setLocalSearchQuery('');
    onFilterChange({});
  };

  // FIXED: Uganda timezone date range functions
  const getTodayRange = (): { start: Date; end: Date } => {
    return getTodayUgandaRange();
  };

  const getThisWeekRange = (): { start: Date; end: Date } => {
    const now = new Date();
    const ugandaNow = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    return {
      start: getUgandaStartOfDay(startOfWeek(ugandaNow, { weekStartsOn: 1 })),
      end: getUgandaEndOfDay(endOfWeek(ugandaNow, { weekStartsOn: 1 }))
    };
  };

  const getThisMonthRange = (): { start: Date; end: Date } => {
    const now = new Date();
    const ugandaNow = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    return {
      start: getUgandaStartOfDay(startOfMonth(ugandaNow)),
      end: getUgandaEndOfDay(endOfMonth(ugandaNow))
    };
  };

  const getLastThreeMonthsRange = (): { start: Date; end: Date } => {
    const now = new Date();
    const ugandaNow = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const threeMonthsAgo = subMonths(ugandaNow, 2);
    return {
      start: getUgandaStartOfDay(startOfMonth(threeMonthsAgo)),
      end: getUgandaEndOfDay(endOfMonth(ugandaNow))
    };
  };

  // Quick date range handlers
  const applyToday = () => {
    const todayRange = getTodayRange();
    console.log('📅 Applying today range:', {
      start: todayRange.start,
      end: todayRange.end,
      startFormatted: formatDateForUgandaAPI(todayRange.start),
      endFormatted: formatDateForUgandaAPI(todayRange.end)
    });
    onDateRangeChange(todayRange);
    setLastRefresh(new Date());
  };

  const applyThisWeek = () => {
    const weekRange = getThisWeekRange();
    console.log('📅 Applying this week range:', {
      start: weekRange.start,
      end: weekRange.end,
      startFormatted: formatDateForUgandaAPI(weekRange.start),
      endFormatted: formatDateForUgandaAPI(weekRange.end)
    });
    onDateRangeChange(weekRange);
    setLastRefresh(new Date());
  };

  const applyThisMonth = () => {
    const monthRange = getThisMonthRange();
    console.log('📅 Applying this month range:', {
      start: monthRange.start,
      end: monthRange.end,
      startFormatted: formatDateForUgandaAPI(monthRange.start),
      endFormatted: formatDateForUgandaAPI(monthRange.end)
    });
    onDateRangeChange(monthRange);
    setLastRefresh(new Date());
  };

  const applyLastThreeMonths = () => {
    const threeMonthsRange = getLastThreeMonthsRange();
    console.log('📅 Applying last 3 months range:', {
      start: threeMonthsRange.start,
      end: threeMonthsRange.end,
      startFormatted: formatDateForUgandaAPI(threeMonthsRange.start),
      endFormatted: formatDateForUgandaAPI(threeMonthsRange.end)
    });
    onDateRangeChange(threeMonthsRange);
    setLastRefresh(new Date());
  };

  // Format date for display - FIXED: Show Uganda timezone dates
  const formatDisplayDate = (): string => {
    const isSameDayRange = isSameDay(dateRange.start, dateRange.end);
    
    // Convert UTC dates back to Uganda time for display
    const ugandaStart = new Date(dateRange.start.getTime() + (3 * 60 * 60 * 1000));
    const ugandaEnd = new Date(dateRange.end.getTime() + (3 * 60 * 60 * 1000));
    
    if (isSameDayRange) {
      return format(ugandaStart, 'MMM dd, yyyy');
    } else {
      return `${format(ugandaStart, 'MMM dd')} - ${format(ugandaEnd, 'MMM dd, yyyy')}`;
    }
  };

  // Handle sort change
  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      onSortChange(newSortBy, newDirection);
    } else {
      onSortChange(newSortBy, 'desc');
    }
  };

  // Get sort icon for a column
  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown size={14} />;
    }
    return sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  // Handle export with current filters
  const handleExport = () => {
    const exportFilters: ExportFilters = {
      startDate: formatDateForUgandaAPI(dateRange.start),
      endDate: formatDateForUgandaAPI(dateRange.end),
      status: filters.status,
      paymentMethod: filters.paymentMethod,
      searchQuery: filters.searchQuery
    };
    console.log('📤 Exporting with filters:', exportFilters);
    onExport(exportFilters);
  };

  // Handle refresh
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    setLastRefresh(new Date());
  };

  // Check if any filters are active
  const hasActiveFilters = filters.status || filters.paymentMethod || filters.searchQuery;

  // FIXED: Proper date range comparison using Uganda timezone
  const isTodayActive = () => {
    const todayRange = getTodayRange();
    return isSameDay(dateRange.start, todayRange.start) && 
           isSameDay(dateRange.end, todayRange.end);
  };

  const isThisWeekActive = () => {
    const weekRange = getThisWeekRange();
    return isSameDay(dateRange.start, weekRange.start) && 
           isSameDay(dateRange.end, weekRange.end);
  };

  const isThisMonthActive = () => {
    const monthRange = getThisMonthRange();
    return isSameDay(dateRange.start, monthRange.start) && 
           isSameDay(dateRange.end, monthRange.end);
  };

  const isLastThreeMonthsActive = () => {
    const threeMonthsRange = getLastThreeMonthsRange();
    return isSameDay(dateRange.start, threeMonthsRange.start) && 
           isSameDay(dateRange.end, threeMonthsRange.end);
  };

  // Check if it's a single day
  const isSingleDay = isSameDay(dateRange.start, dateRange.end);

  return (
    <motion.div
      className="modern-header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="modern-header__content">
        <div className="modern-header__title">
          <h1>Transactions Dashboard</h1>
          {lastRefresh && (
            <div className="last-refresh-container">
              <span className={`last-refresh ${isBlinking ? 'blinking' : ''}`}>
                Last updated: {format(lastRefresh, 'HH:mm:ss')}
              </span>
              <span className="realtime-indicator">• Live</span>
            </div>
          )}
        </div>
        
        <div className="modern-header__actions">
          <motion.button
            className="modern-refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Refresh Transaction Data"
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </motion.button>
          <motion.button
            className="modern-export-btn"
            onClick={handleExport}
            disabled={loading || transactionCount === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download size={18} />
            Export CSV
          </motion.button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="modern-search-container">
        <Search size={18} className="modern-search-icon" />
        <input
          type="text"
          placeholder="Search by customer name, staff member, invoice number..."
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          className="modern-search-input"
        />
      </div>

      {/* Filters Section */}
      <div className="modern-filters-section">
        <div className="modern-filters-main">
          <div className="modern-filters-row">
            {/* Date Range - FIXED: Show single date label when it's the same day */}
            <div className="modern-filter-group">
              <label className="modern-filter-label">
                {isSingleDay ? 'Date' : 'Date Range'}
              </label>
              <div className="modern-date-range">
                <input
                  type="date"
                  value={formatDateForInput(dateRange.start)}
                  onChange={handleStartDateChange}
                  className="modern-date-input"
                  disabled={loading}
                />
                {!isSingleDay && (
                  <>
                    <span className="modern-date-separator">to</span>
                    <input
                      type="date"
                      value={formatDateForInput(dateRange.end)}
                      onChange={handleEndDateChange}
                      className="modern-date-input"
                      disabled={loading}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Payment Method Filter */}
            <div className="modern-filter-group">
              <label className="modern-filter-label">Payment Method</label>
              <select 
                className="modern-select"
                disabled={loading}
                value={filters.paymentMethod || ''}
                onChange={handlePaymentMethodChange}
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="due">Credit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="modern-sort-controls">
          <label className="modern-filter-label">Sort By</label>
          <div className="modern-sort-row">
            <select 
              className="modern-select"
              disabled={loading}
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="created_at">Date & Time</option>
              <option value="order_number">Invoice Number</option>
              <option value="total">Total Amount</option>
              <option value="customer_name">Customer</option>
              <option value="payment_type">Payment Method</option>
              <option value="status">Status</option>
              <option value="user_name">Cashier</option>
            </select>
            
            <button
              className="modern-sort-button"
              onClick={() => handleSortChange(sortBy)}
              disabled={loading}
            >
              {getSortIcon(sortBy)}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Date Presets and Active Filters */}
      <div className="modern-quick-presets">
        <span className="modern-preset-label">Quick ranges:</span>
        <button
          className={`modern-preset-button ${isTodayActive() ? 'active' : ''}`}
          onClick={applyToday}
          disabled={loading}
        >
          <Calendar size={14} />
          Today
        </button>
        <button
          className={`modern-preset-button ${isThisWeekActive() ? 'active' : ''}`}
          onClick={applyThisWeek}
          disabled={loading}
        >
          This Week
        </button>
        <button
          className={`modern-preset-button ${isThisMonthActive() ? 'active' : ''}`}
          onClick={applyThisMonth}
          disabled={loading}
        >
          This Month
        </button>
        <button
          className={`modern-preset-button ${isLastThreeMonthsActive() ? 'active' : ''}`}
          onClick={applyLastThreeMonths}
          disabled={loading}
        >
          Last 3 Months
        </button>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="modern-active-filters">
            <Filter size={14} />
            <span className="modern-filter-indicator">Active filters:</span>
            {filters.searchQuery && (
              <span className="modern-filter-badge">
                Search: "{filters.searchQuery}"
              </span>
            )}
            {filters.status && (
              <span className="modern-filter-badge">
                Status: {filters.status}
              </span>
            )}
            {filters.paymentMethod && (
              <span className="modern-filter-badge">
                Payment: {filters.paymentMethod}
              </span>
            )}
            <button
              className="modern-clear-filters"
              onClick={clearAllFilters}
            >
              <X size={12} />
              Clear all
            </button>
          </div>
        )}

        {/* Current Sort Indicator */}
        {sortBy && (
          <div className="modern-sort-indicator">
            <span>Sorted by:</span>
            <span className="modern-sort-value">
              {sortBy.replace('_', ' ')} ({sortDirection === 'asc' ? 'A-Z' : 'Z-A'})
            </span>
          </div>
        )}
      </div>

      {/* Transaction Count - FIXED: Show proper date display */}
      <div className="modern-transaction-count">
        <BarChart3 size={16} />
        <span>
          {loading ? 'Loading transactions...' : `${transactionCount} transactions • ${formatDisplayDate()}`}
        </span>
      </div>
    </motion.div>
  );
};

export default ModernHeader;