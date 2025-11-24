import React, { useMemo, useState } from 'react';
import { FileText, User, AlertCircle } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { Box, Text, Badge, HStack, VStack } from '@chakra-ui/react';

interface CustomerDue {
  id: number;
  name: string;
  totalDue: number;
  lastTransaction: string;
  phone?: string;
  email?: string;
}

interface CustomerDuesTableProps {
  customersDue: CustomerDue[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const CustomerDuesTable: React.FC<CustomerDuesTableProps> = ({
  customersDue
}) => {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'totalDue', desc: true }]);

  const columns = useMemo<ColumnDef<CustomerDue>[]>(() => [
    {
      accessorKey: 'name',
      header: 'CUSTOMER',
      cell: (info) => (
        <HStack spacing={3}>
          <Box
            w={8}
            h={8}
            borderRadius="full"
            bg="blue.50"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <User size={16} color="#1e40af" />
          </Box>
          <VStack align="start" spacing={0}>
            <Text fontWeight="medium" color="gray.900" fontSize="sm">
              {info.getValue() as string}
            </Text>
            <Text fontSize="xs" color="gray.500">
              ID: {info.row.original.id}
            </Text>
          </VStack>
        </HStack>
      ),
      size: 200,
    },
    {
      accessorKey: 'totalDue',
      header: 'AMOUNT DUE',
      cell: (info) => {
        const amount = info.getValue() as number;
        const isOverdue = amount > 50000;
        
        return (
          <VStack align="start" spacing={0}>
            <Text 
              fontWeight="semibold" 
              color={isOverdue ? "red.600" : "orange.600"}
              fontSize="sm"
            >
              {formatCurrency(amount)}
            </Text>
            {isOverdue && (
              <Text fontSize="xs" color="red.500">
                Overdue
              </Text>
            )}
          </VStack>
        );
      },
      size: 150,
    },
    {
      accessorKey: 'lastTransaction',
      header: 'LAST TRANSACTION',
      cell: (info) => (
        <Text fontSize="sm" color="gray.600">
          {formatDate(info.getValue() as string)}
        </Text>
      ),
      size: 140,
    },
    {
      id: 'priority',
      header: 'PRIORITY',
      cell: ({ row }) => {
        const amount = row.original.totalDue;
        let priority = 'Low';
        let color = 'gray';
        
        if (amount > 100000) {
          priority = 'High';
          color = 'red';
        } else if (amount > 50000) {
          priority = 'Medium';
          color = 'orange';
        } else {
          priority = 'Low';
          color = 'green';
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
            {priority}
          </Badge>
        );
      },
      size: 100,
    },
  ], []);

  const table = useReactTable({
    data: customersDue,
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
  const totalDue = customersDue.reduce((sum, customer) => sum + customer.totalDue, 0);
  const highPriorityCount = customersDue.filter(customer => customer.totalDue > 100000).length;

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
            Customer Dues
          </Text>
          <Text fontSize="sm" color="gray.600">
            {customersDue.length} customers • {formatCurrency(totalDue)} total due
          </Text>
        </VStack>
        
        {highPriorityCount > 0 && (
          <Badge colorScheme="red" variant="solid" px={3} py={1}>
            <HStack spacing={1}>
              <AlertCircle size={14} />
              <Text fontSize="xs">{highPriorityCount} high priority</Text>
            </HStack>
          </Badge>
        )}
      </HStack>

      {/* Table */}
      <Box>
        {customersDue.length > 0 ? (
          <>
            <Box overflow="auto">
              <style>
                {`
                  .customer-dues-table tbody tr {
                    border-bottom: 1px solid #f3f4f6;
                    transition: background-color 0.2s;
                  }
                  .customer-dues-table tbody tr:hover {
                    background-color: #f9fafb;
                  }
                `}
              </style>
              <table className="customer-dues-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                    <tr key={row.id}>
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
            <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <Text fontSize="lg" fontWeight="medium" mb={2}>
              No Outstanding Dues
            </Text>
            <Text fontSize="sm">
              All customer accounts are settled
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};