// src/renderer/src/components/ProductsTable.tsx
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
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  LocalShipping as TruckIcon,
  Science as PillIcon,
  Shield as ShieldIcon,
  AcUnit as ThermometerIcon,
  Inventory2 as PackageIcon,
} from '@mui/icons-material';
import {
  Chip,
  Avatar,
  Box,
  Tooltip,
  IconButton,
  Stack,
  Typography,
  LinearProgress,
  alpha,
  ChipProps,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { StockProduct } from '../../services/stockService';

interface ProductsTableProps {
  products: StockProduct[];
  onEditProduct: (product: StockProduct) => void;
  onViewProduct: (product: StockProduct) => void;
  onDeleteProduct: (productId: string) => void;
  loading: boolean;
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
          },
        },
      },
    },
  } as any,
});

// Helper functions with proper typing and null safety
const formatPrice = (value: string | number | null | undefined): string => {
  if (!value && value !== 0) return 'UGX 0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num as number)) return 'UGX 0';
  
  // Round to nearest 100
  const rounded = Math.round(Number(num) / 100) * 100;
  return `UGX ${rounded.toLocaleString()}`;
};

const getProfitValue = (price: string | number, costPrice?: string | number): number | null => {
  if (!costPrice) return null;
  const selling = parseFloat(price as string) || 0;
  const cost = parseFloat(costPrice as string) || 0;
  if (cost === 0) return null;
  
  const profit = selling - cost;
  // Round profit to nearest 100
  return Math.round(profit / 100) * 100;
};

// Custom Toolbar
function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport csvOptions={{ fileName: 'products-export' }} />
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

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  loading,
  onEditProduct,
  onViewProduct,
  onDeleteProduct,
}) => {
  const rows: GridRowsProp<StockProduct> = products;

  const columns: GridColDef<StockProduct>[] = useMemo(
    () => [
      {
        field: 'img',
        headerName: '',
        width: 70,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<StockProduct, string>) => (
          <Avatar
            src={params.value || ''}
            alt={params.row.name}
            variant="rounded"
            sx={{ width: 40, height: 40 }}
          >
            <PackageIcon />
          </Avatar>
        ),
      },
      {
        field: 'name',
        headerName: 'Product Name',
        width: 250,
        renderCell: (params: GridRenderCellParams<StockProduct, string>) => {
          const product = params.row;
          return (
            <Box sx={{ py: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {product.name}
              </Typography>
              <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap" gap={0.5}>
                {product.prescription_required && (
                  <Chip icon={<PillIcon />} label="Rx" size="small" color="primary" />
                )}
                {product.is_controlled_substance && (
                  <Chip icon={<ShieldIcon />} label="Controlled" size="small" color="error" />
                )}
                {product.requires_refrigeration && (
                  <Chip icon={<ThermometerIcon />} label="Fridge" size="small" color="info" />
                )}
              </Stack>
            </Box>
          );
        },
      },
      {
        field: 'category',
        headerName: 'Category',
        width: 140,
        renderCell: (params: GridRenderCellParams<StockProduct, string>) => (
          <Chip
            label={params.value || 'Uncategorized'}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        ),
      },
      {
        field: 'quantity',
        headerName: 'Stock',
        width: 100,
        type: 'number',
        renderCell: (params: GridRenderCellParams<StockProduct, number>) => (
          <Typography variant="body2" fontWeight={600}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'price',
        headerName: 'Price',
        width: 130,
        valueFormatter: (params) => {
          if (params == null) return 'UGX 0';
          return formatPrice(params.value as string | number);
        },
      },
      {
        field: 'cost_price',
        headerName: 'Cost',
        width: 120,
        valueGetter: (_, row) => row.cost_price || null,
        valueFormatter: (params) => {
          if (params == null || params.value == null) return '-';
          return formatPrice(params.value);
        },
      },
      {
        field: 'profit',
        headerName: 'Profit',
        width: 120,
        sortable: false,
        renderCell: (params: GridRenderCellParams<StockProduct, never>) => {
          const product = params.row;
          const profitValue = getProfitValue(product.price, product.cost_price);
          
          if (!profitValue) return <Typography color="text.secondary">-</Typography>;
          
          return (
            <Typography 
              variant="body2" 
              fontWeight={600}
              color={profitValue >= 0 ? 'success.main' : 'error.main'}
            >
              {formatPrice(profitValue)}
            </Typography>
          );
        },
      },
      {
        field: 'supplier',
        headerName: 'Supplier',
        width: 160,
        renderCell: (params: GridRenderCellParams<StockProduct, string>) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <TruckIcon fontSize="small" color="action" />
            <Typography variant="body2" noWrap>
              {params.value || 'No Supplier'}
            </Typography>
          </Stack>
        ),
      },
      {
        field: 'expiration_date',
        headerName: 'Expiry Date',
        width: 120,
        valueFormatter: (params) => {
          if (params == null || params.value == null) return '-';
          return new Date(params.value as string).toLocaleDateString();
        },
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<StockProduct, never>) => {
          const product = params.row;
          return (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="View">
                <IconButton size="small" onClick={() => onViewProduct(product)}>
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton size="small" color="primary" onClick={() => onEditProduct(product)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDeleteProduct(product.id.toString())}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        },
      },
    ],
    [onEditProduct, onViewProduct, onDeleteProduct]
  );

  return (
    <ThemeProvider theme={dataGridTheme}>
      <Box
        sx={{
          height: 800,
          width: '100%',
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50, 100]}
          pagination
          disableRowSelectionOnClick
          slots={{
            toolbar: CustomToolbar,
            loadingOverlay: CustomLoadingOverlay,
          }}
          getRowId={(row) => row.id}
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