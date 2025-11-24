// src/renderer/src/components/transactions/components/ModernTables/ModernTransactionsTable.tsx
import React, { useMemo } from 'react';
import {
  DataGrid,
  GridRowsProp,
  GridColDef,
  GridRenderCellParams,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
} from '@mui/x-data-grid';
import {
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  AccountCircle as UserIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  Typography,
  LinearProgress,
  alpha,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { format, parseISO, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { Transaction } from '../../../../services/transactionsService';
import { convertUTCToUgandaTime } from '../../../../src/utils/ugandaTime';
import './TransactionsTable.css';

interface ModernTransactionsTableProps {
  transactions: Transaction[];
  onViewTransaction: (transactionId: string) => void;
  getCustomerName: (customerId: number) => string;
  loading?: boolean;
}

// Create a Material-UI theme for Data Grid
const dataGridTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0d9488',
    },
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid',
          borderColor: '#e0e0e0',
          borderRadius: 8,
          '& .MuiDataGrid-cell': {
            py: 1.5,
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: alpha('#0d9488', 0.08),
            borderBottom: '2px solid #0d9488',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: alpha('#0d9488', 0.04),
            cursor: 'pointer',
          },
        },
      },
    },
  } as any,
});

// Helper functions with proper typing and null safety
const formatCurrency = (amount: number | string | undefined | null): string => {
  if (!amount && amount !== 0) return 'UGX 0';
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numValue)) return 'UGX 0';
  
  // Round to nearest 100
  const rounded = Math.round(Number(numValue) / 100) * 100;
  return `UGX ${rounded.toLocaleString('en-UG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// FIXED: Uganda timezone-aware date formatting
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    // Convert UTC to Uganda time for display
    const ugandaDate = convertUTCToUgandaTime(dateString);
    return format(ugandaDate, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    return '-';
  }
};

// FIXED: Add relative time indicator with Uganda timezone
const getDateWithRelativeIndicator = (dateString: string | null): { display: string; isRecent: boolean } => {
  if (!dateString) return { display: '-', isRecent: false };
  
  try {
    // Convert UTC to Uganda time for display and comparison
    const ugandaDate = convertUTCToUgandaTime(dateString);
    const display = format(ugandaDate, 'MMM dd, yyyy HH:mm');
    
    // Check if transaction is from today, yesterday, this week, etc. (in Uganda time)
    const isRecent = isToday(ugandaDate) || isYesterday(ugandaDate) || isThisWeek(ugandaDate);
    
    return { display, isRecent };
  } catch (error) {
    return { display: '-', isRecent: false };
  }
};

const getPaymentTypeInfo = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'cash':
      return { label: 'Cash', color: 'success' as const };
    case 'card':
      return { label: 'Card', color: 'primary' as const };
    case 'due':
      return { label: 'Credit', color: 'warning' as const };
    default:
      return { label: type || 'Unknown', color: 'default' as const };
  }
};

const getStatusInfo = (transaction: Transaction) => {
  const total = transaction.total || 0;
  const paid = transaction.paid || 0;
  const due = total - paid;
  if (due === 0) return { label: 'Paid', color: 'success' as const };
  if (paid > 0) return { label: 'Partial', color: 'warning' as const };
  return { label: 'Unpaid', color: 'error' as const };
};

// Custom Toolbar
function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport csvOptions={{ fileName: 'transactions-export' }} />
    </GridToolbarContainer>
  );
}

// Custom Loading Overlay
function CustomLoadingOverlay() {
  return (
    <Box sx={{ width: '100%', pt: 2 }}>
      <LinearProgress />
    </Box>
  );
}

// Custom No Rows Overlay
function CustomNoRowsOverlay() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        py: 8,
      }}
    >
      <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" color="text.secondary">
        No transactions found
      </Typography>
    </Box>
  );
}

export const ModernTransactionsTable: React.FC<ModernTransactionsTableProps> = ({
  transactions,
  onViewTransaction,
  getCustomerName,
  loading = false,
}) => {
  // Ensure all rows have unique IDs - use order_number as fallback for null IDs
  const rowsWithIds: GridRowsProp<Transaction> = useMemo(() => {
    return transactions.map((transaction, index) => ({
      ...transaction,
      // Use order_number as ID if id is null, otherwise use a combination to ensure uniqueness
      id: transaction.id || `order_${transaction.order_number}_${index}`
    }));
  }, [transactions]);

  const columns: GridColDef<Transaction>[] = useMemo(
    () => [
      {
        field: 'order_number',
        headerName: 'Invoice',
        width: 130,
        flex: 0.8,
        renderCell: (params: GridRenderCellParams<Transaction, string>) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon fontSize="small" color="action" />
            <Typography variant="body2" fontWeight={600}>
              #{params.value}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'created_at',
        headerName: 'Date & Time',
        width: 180,
        flex: 1.2,
        renderCell: (params: GridRenderCellParams<Transaction, string>) => {
          const { display, isRecent } = getDateWithRelativeIndicator(params.value);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon 
                fontSize="small" 
                color={isRecent ? "primary" : "action"} 
              />
              <Typography 
                variant="body2" 
                fontWeight={isRecent ? 600 : 400}
                color={isRecent ? "primary.main" : "text.primary"}
              >
                {display}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: 'customer',
        headerName: 'Customer',
        width: 200,
        flex: 1.5,
        renderCell: (params: GridRenderCellParams<Transaction, never>) => {
          const customerName = getCustomerName(params.row.customer_id || 0);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="body2" noWrap>
                {customerName}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: 'total',
        headerName: 'Total',
        width: 140,
        flex: 1,
        valueFormatter: (params) => formatCurrency(params.value as number),
        renderCell: (params: GridRenderCellParams<Transaction, number>) => (
          <Typography variant="body2" fontWeight={600}>
            {formatCurrency(params.value)}
          </Typography>
        ),
      },
      {
        field: 'payment_type',
        headerName: 'Payment',
        width: 140,
        flex: 1,
        renderCell: (params: GridRenderCellParams<Transaction, string>) => {
          const { label, color } = getPaymentTypeInfo(params.value || '');
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaymentIcon fontSize="small" color="action" />
              <Chip label={label} size="small" color={color} variant="outlined" />
            </Box>
          );
        },
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        flex: 0.8,
        renderCell: (params: GridRenderCellParams<Transaction, never>) => {
          const { label, color } = getStatusInfo(params.row);
          return (
            <Chip 
              label={label} 
              size="small" 
              color={color}
              variant="filled"
              sx={{ fontWeight: 600 }}
            />
          );
        },
      },
      {
        field: 'due_amount',
        headerName: 'Due',
        width: 140,
        flex: 1,
        valueGetter: (_, row) => {
          const total = row.total || 0;
          const paid = row.paid || 0;
          return total - paid;
        },
        valueFormatter: (params) => formatCurrency(params.value as number),
        renderCell: (params: GridRenderCellParams<Transaction, number>) => (
          <Typography 
            variant="body2" 
            fontWeight={600}
            color={params.value > 0 ? 'error.main' : 'success.main'}
          >
            {formatCurrency(params.value)}
          </Typography>
        ),
      },
      {
        field: 'user_name',
        headerName: 'Staff',
        width: 150,
        flex: 1,
        renderCell: (params: GridRenderCellParams<Transaction, string>) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UserIcon fontSize="small" color="action" />
            <Typography variant="body2" noWrap>
              {params.value || 'Unknown'}
            </Typography>
          </Box>
        ),
      },
    ],
    [getCustomerName]
  );

  // Calculate totals
  const totals = useMemo(() => {
    const totalSales = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalPaid = transactions.reduce((sum, t) => sum + (t.paid || 0), 0);
    const totalDue = totalSales - totalPaid;
    return { totalSales, totalPaid, totalDue };
  }, [transactions]);

  return (
    <ThemeProvider theme={dataGridTheme}>
      <Box
        sx={{
          height: 800,
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Totals Summary */}
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Total Sales
            </Typography>
            <Typography variant="h6" fontWeight={600} color="primary.main">
              {formatCurrency(totals.totalSales)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Total Paid
            </Typography>
            <Typography variant="h6" fontWeight={600} color="success.main">
              {formatCurrency(totals.totalPaid)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Total Due
            </Typography>
            <Typography variant="h6" fontWeight={600} color={totals.totalDue > 0 ? 'error.main' : 'success.main'}>
              {formatCurrency(totals.totalDue)}
            </Typography>
          </Box>
        </Box>

        <DataGrid
          rows={rowsWithIds}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50, 100]}
          pagination
          disableRowSelectionOnClick
          onRowClick={(params) => onViewTransaction(params.row.id.toString())}
          slots={{
            toolbar: CustomToolbar,
            loadingOverlay: CustomLoadingOverlay,
            noRowsOverlay: CustomNoRowsOverlay,
          }}
          sx={{
            '& .MuiDataGrid-virtualScroller': {
              minHeight: 400,
            },
          }}
        />
      </Box>
    </ThemeProvider>
  );
};