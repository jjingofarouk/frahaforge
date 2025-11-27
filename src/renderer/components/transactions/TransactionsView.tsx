// src/renderer/src/components/transactions/TransactionsView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Switch, FormControl, FormControlLabel } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import ModernHeader from './components/ModernHeader/ModernHeader';
import { ModernTransactionsTable } from './components/ModernTables';
import { useTransactionsData } from './hooks/useTransactionsData';
import './TransactionsView.css';

interface ModernTransactionsViewProps {
  user: any;
  onViewTransaction: (transactionId: number) => void; // Changed from string to number
}

// Helper function to get today's Uganda date range as Date objects
const getTodayUgandaRange = (): { start: Date; end: Date } => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Create start of day in Uganda time (00:00:00 UTC+3)
  const start = new Date(todayStr + 'T00:00:00+03:00');
  // Create end of day in Uganda time (23:59:59 UTC+3)
  const end = new Date(todayStr + 'T23:59:59+03:00');
  
  return { start, end };
};

// Helper function to get Uganda start of day for a date
const getUgandaStartOfDay = (date: Date): Date => {
  const dateStr = date.toISOString().split('T')[0];
  return new Date(dateStr + 'T00:00:00+03:00');
};

// Helper function to get Uganda end of day for a date
const getUgandaEndOfDay = (date: Date): Date => {
  const dateStr = date.toISOString().split('T')[0];
  return new Date(dateStr + 'T23:59:59+03:00');
};

const TransactionsView: React.FC<ModernTransactionsViewProps> = ({
  user,
  onViewTransaction,
}) => {
  // Initialize with today's date range by default (Uganda timezone)
  const [dateRange, setDateRange] = useState(getTodayUgandaRange());
  
  // Use the hook with auto-refresh capability
  const { state, actions, data, autoRefreshEnabled, setAutoRefreshEnabled } = useTransactionsData();

  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    searchQuery: ''
  });

  // Effect to set today's date range when component mounts (Uganda timezone)
  useEffect(() => {
    const todayRange = getTodayUgandaRange();
    console.log('📅 Initializing with Uganda date range:', {
      start: todayRange.start,
      end: todayRange.end
    });
    setDateRange(todayRange);
    // Update the hook's date range via its action
    actions.setDateRange(todayRange);
  }, []);

  const handleSortChange = (newSortBy: string, newSortDirection: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
  };

  // Handle date range change from header
  const handleDateRangeChange = (newDateRange: { start: Date; end: Date }) => {
    console.log('📅 Date range changed in TransactionsView:', {
      newStart: newDateRange.start,
      newEnd: newDateRange.end
    });
    setDateRange(newDateRange);
    actions.setDateRange(newDateRange);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: { status?: string; paymentMethod?: string; searchQuery?: string }) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    if (!data.transactions || data.transactions.length === 0) return [];

    let filtered = data.transactions;

    // Apply search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(transaction =>
        transaction.customer_name?.toLowerCase().includes(query) ||
        transaction.user_name?.toLowerCase().includes(query) ||
        transaction.order_number?.toString().includes(query) ||
        transaction.payment_type?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(transaction => {
        const status = getStatusInfo(transaction);
        return status.label.toLowerCase() === filters.status.toLowerCase();
      });
    }

    // Apply payment method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter(transaction =>
        transaction.payment_type?.toLowerCase() === filters.paymentMethod.toLowerCase()
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a];
      let bValue: any = b[sortBy as keyof typeof b];

      // Handle customer name sorting
      if (sortBy === 'customer_name') {
        aValue = actions.getCustomerName(a.customer_id || 0);
        bValue = actions.getCustomerName(b.customer_id || 0);
      }
      
      // Handle status sorting
      if (sortBy === 'status') {
        aValue = getStatusInfo(a).label;
        bValue = getStatusInfo(b).label;
      }
      
      // Handle date sorting
      if (sortBy === 'created_at') {
        aValue = new Date(a.created_at || '').getTime();
        bValue = new Date(b.created_at || '').getTime();
      }

      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data.transactions, filters, sortBy, sortDirection, actions.getCustomerName]);

  // Helper function to get status info
  const getStatusInfo = (transaction: any) => {
    const total = transaction.total || 0;
    const paid = transaction.paid || 0;
    const due = total - paid;
    if (due === 0) return { label: 'Paid', color: 'success' };
    if (paid > 0) return { label: 'Partial', color: 'warning' };
    return { label: 'Unpaid', color: 'danger' };
  };

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', p: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Modern Header with Search and Filters */}
        <ModernHeader
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          onExport={actions.handleExport}
          transactionCount={filteredAndSortedTransactions.length}
          loading={state.loading}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          filters={filters}
          onFilterChange={handleFilterChange}
          onRefresh={actions.refreshData}
        />

        {/* Auto-refresh Control Bar */}
        <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, boxShadow: 1, border: 1, borderColor: 'grey.200' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredAndSortedTransactions.length} of {data.transactions.length} transactions
              {filters.searchQuery && ` for "${filters.searchQuery}"`}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* Auto-refresh Control */}
              <FormControl>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefreshEnabled}
                      onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Auto-refresh (30s)"
                />
              </FormControl>

            </Box>
          </Box>

          {/* Last Updated Info */}
          {state.lastUpdated && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Last updated: {new Date(state.lastUpdated).toLocaleTimeString()}
                {state.loading && ' (Refreshing...)'}
              </Typography>
            </Box>
          )}

          {/* Error Display */}
          {state.error && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="error">
                Error: {state.error}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Single Modern Transactions Table */}
        <Box>
          <ModernTransactionsTable
            transactions={filteredAndSortedTransactions}
            onViewTransaction={onViewTransaction}
            getCustomerName={actions.getCustomerName}
            loading={state.loading}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default TransactionsView;