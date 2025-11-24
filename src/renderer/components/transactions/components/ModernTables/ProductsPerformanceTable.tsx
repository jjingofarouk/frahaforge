import React, { useMemo, useState } from 'react';
import { Package, TrendingUp, TrendingDown } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { Box, Text, Badge, HStack, VStack, Progress } from '@chakra-ui/react';

interface ProductPerformance {
  id: number;
  name: string;
  category: string;
  sold: number;
  available: number;
  sales: number;
  turnoverRate?: number;
}

interface ProductsPerformanceTableProps {
  products: ProductPerformance[];
  categories: Category[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-UG').format(value);
};

export const ProductsPerformanceTable: React.FC<ProductsPerformanceTableProps> = ({
  products
}) => {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'sales', desc: true }]);

  const columns = useMemo<ColumnDef<ProductPerformance>[]>(() => [
    {
      accessorKey: 'name',
      header: 'PRODUCT',
      cell: (info) => (
        <HStack spacing={3}>
          <Box
            w={8}
            h={8}
            borderRadius="md"
            bg="blue.50"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Package size={16} color="#1e40af" />
          </Box>
          <VStack align="start" spacing={0}>
            <Text fontWeight="medium" color="gray.900" fontSize="sm" noOfLines={1}>
              {info.getValue() as string}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {info.row.original.category}
            </Text>
          </VStack>
        </HStack>
      ),
      size: 200,
    },
    {
      accessorKey: 'sold',
      header: 'SOLD',
      cell: (info) => (
        <Text fontWeight="medium" color="gray.900" fontSize="sm">
          {formatNumber(info.getValue() as number)}
        </Text>
      ),
      size: 100,
    },
    {
      accessorKey: 'available',
      header: 'STOCK',
      cell: (info) => {
        const available = info.getValue() as number;
        const isLowStock = available < 10;
        
        return (
          <Text 
            fontWeight="medium" 
            color={isLowStock ? "red.600" : "gray.900"}
            fontSize="sm"
          >
            {formatNumber(available)}
          </Text>
        );
      },
      size: 100,
    },
    {
      accessorKey: 'sales',
      header: 'REVENUE',
      cell: (info) => (
        <Text fontWeight="semibold" color="green.600" fontSize="sm">
          {formatCurrency(info.getValue() as number)}
        </Text>
      ),
      size: 120,
    },
    {
      id: 'performance',
      header: 'PERFORMANCE',
      cell: ({ row }) => {
        const product = row.original;
        const sales = product.sales;
        const sold = product.sold;
        
        let performance = 'Good';
        let color = 'green';
        let Icon = TrendingUp;
        
        if (sales < 100000 || sold < 10) {
          performance = 'Low';
          color = 'red';
          Icon = TrendingDown;
        } else if (sales < 500000 || sold < 50) {
          performance = 'Medium';
          color = 'orange';
        }
        
        return (
          <Badge 
            colorScheme={color}
            variant="subtle"
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="full"
          >
            <HStack spacing={1}>
              <Icon size={12} />
              <Text>{performance}</Text>
            </HStack>
          </Badge>
        );
      },
      size: 120,
    },
  ], []);

  const table = useReactTable({
    data: products,
    columns,
    state: { 
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 6,
      },
    },
  });

  // Calculate summary statistics
  const totalRevenue = products.reduce((sum, product) => sum + product.sales, 0);
  const totalSold = products.reduce((sum, product) => sum + product.sold, 0);
  const lowStockCount = products.filter(product => product.available < 10).length;

  return (
    <Box 
      bg="white" 
      borderRadius="xl" 
      boxShadow="sm" 
      border="1px solid" 
      borderColor="gray.200"
      p={6}
    >
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Text fontSize="lg" fontWeight="semibold" color="gray.800">
            Products Performance
          </Text>
          <Text fontSize="sm" color="gray.600">
            {products.length} products • {formatCurrency(totalRevenue)} total revenue
          </Text>
        </VStack>
        
        {lowStockCount > 0 && (
          <Badge colorScheme="red" variant="solid" px={3} py={1}>
            <Text fontSize="xs">{lowStockCount} low stock</Text>
          </Badge>
        )}
      </HStack>

      {/* Table */}
      <Box>
        {products.length > 0 ? (
          <>
            <Box overflow="auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th 
                          key={header.id} 
                          style={{ 
                            width: header.column.columnDef.size,
                            textAlign: 'left',
                            padding: '12px 16px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#6b7280',
                            borderBottom: '1px solid #e5e7eb',
                            backgroundColor: '#f9fafb'
                          }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr 
                      key={row.id} 
                      style={{ 
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background-color 0.2s'
                      }}
                      _hover={{ bg: 'gray.50' }}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td 
                          key={cell.id}
                          style={{ 
                            padding: '16px',
                            fontSize: '14px'
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            {/* Simple Pagination */}
            {table.getPageCount() > 1 && (
              <HStack justify="space-between" mt={4} pt={4} borderTop="1px solid" borderColor="gray.200">
                <Text fontSize="sm" color="gray.600">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </Text>
                <HStack spacing={2}>
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      cursor: table.getCanPreviousPage() ? 'pointer' : 'not-allowed',
                      opacity: table.getCanPreviousPage() ? 1 : 0.5
                    }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      cursor: table.getCanNextPage() ? 'pointer' : 'not-allowed',
                      opacity: table.getCanNextPage() ? 1 : 0.5
                    }}
                  >
                    Next
                  </button>
                </HStack>
              </HStack>
            )}
          </>
        ) : (
          <Box 
            textAlign="center" 
            py={12} 
            color="gray.500"
          >
            <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <Text fontSize="lg" fontWeight="medium" mb={2}>
              No Product Data
            </Text>
            <Text fontSize="sm">
              Product performance data will appear here
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};