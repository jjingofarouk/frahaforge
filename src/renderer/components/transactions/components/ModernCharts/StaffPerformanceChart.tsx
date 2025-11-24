// StaffPerformanceChart.tsx
import React from 'react';
import { Box, Text, HStack, VStack, Progress, Badge } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction } from '../../../../services/transactionsService';

interface StaffPerformanceChartProps {
  transactions: Transaction[];
}

interface StaffData {
  name: string;
  sales: number;
  transactions: number;
  avgTransaction: number;
  efficiency: number;
  prescriptionRate: number;
}

const StaffPerformanceChart: React.FC<StaffPerformanceChartProps> = ({ transactions }) => {
  const processStaffData = (): StaffData[] => {
    const staffStats: { [key: string]: { 
      sales: number; 
      transactions: number; 
      prescriptionCount: number;
    } } = {};

    // Calculate staff performance metrics
    transactions.forEach(transaction => {
      const staffName = transaction.user_name || 'Unknown';
      if (!staffStats[staffName]) {
        staffStats[staffName] = { sales: 0, transactions: 0, prescriptionCount: 0 };
      }
      
      staffStats[staffName].sales += transaction.total;
      staffStats[staffName].transactions += 1;
      
      // Check for prescription items (simplified logic)
      if (transaction.items?.some((item: any) => 
        item.product_name?.toLowerCase().includes('prescription') || 
        item.category?.toLowerCase().includes('prescription')
      )) {
        staffStats[staffName].prescriptionCount += 1;
      }
    });

    // Calculate additional metrics
    const maxSales = Math.max(...Object.values(staffStats).map(s => s.sales));
    
    return Object.entries(staffStats)
      .map(([name, stats]) => ({
        name: name.length > 12 ? name.substring(0, 12) + '...' : name,
        sales: stats.sales,
        transactions: stats.transactions,
        avgTransaction: stats.transactions > 0 ? stats.sales / stats.transactions : 0,
        efficiency: maxSales > 0 ? (stats.sales / maxSales) * 100 : 0,
        prescriptionRate: stats.transactions > 0 ? (stats.prescriptionCount / stats.transactions) * 100 : 0
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8); // Top 8 performers
  };

  const staffData = processStaffData();
  const chartColors = {
    sales: '#1e3a8a',
    transactions: '#0d9488',
    avgTransaction: '#7c3aed'
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const StaffTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box bg="white" p={3} borderRadius="md" boxShadow="lg" border="1px solid #e2e8f0">
          <Text fontWeight="bold" mb={2} color="#1e3a8a" fontSize="sm">
            {data.name}
          </Text>
          <Text color={chartColors.sales} fontSize="sm" mb={1}>
            Total Sales: {formatCurrency(data.sales)}
          </Text>
          <Text color={chartColors.transactions} fontSize="sm" mb={1}>
            Transactions: {data.transactions}
          </Text>
          <Text color={chartColors.avgTransaction} fontSize="sm" mb={1}>
            Avg. Transaction: {formatCurrency(data.avgTransaction)}
          </Text>
          <Text color="#475569" fontSize="sm" mb={1}>
            Efficiency: {data.efficiency.toFixed(1)}%
          </Text>
          <Text color="#475569" fontSize="sm">
            Prescription Rate: {data.prescriptionRate.toFixed(1)}%
          </Text>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box className="chart-card" p={6} borderRadius="xl" bg="white" boxShadow="sm" border="1px solid #E2E8F0">
      <Text fontSize="lg" fontWeight="semibold" mb={4} color="#1e3a8a">
        Staff Performance Metrics
      </Text>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={staffData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            stroke="#475569" 
            fontSize={11} 
            angle={-45} 
            textAnchor="end" 
            height={60}
          />
          <YAxis 
            yAxisId="left"
            tickFormatter={formatCurrency}
            stroke="#475569" 
            fontSize={12} 
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#475569" 
            fontSize={12} 
          />
          <Tooltip content={<StaffTooltip />} />
          <Legend />
          <Bar 
            yAxisId="left"
            dataKey="sales" 
            fill={chartColors.sales} 
            radius={[4, 4, 0, 0]}
            name="Total Sales"
          />
          <Bar 
            yAxisId="right"
            dataKey="transactions" 
            fill={chartColors.transactions} 
            radius={[4, 4, 0, 0]}
            name="Transactions"
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Performance Summary */}
      <VStack mt={4} spacing={2} align="start">
        <Text fontSize="sm" fontWeight="medium" color="#475569">
          Performance Summary:
        </Text>
        {staffData.slice(0, 3).map((staff, index) => (
          <HStack key={staff.name} width="100%" spacing={3}>
            <Text fontSize="xs" width="100px" isTruncated>
              {index + 1}. {staff.name}
            </Text>
            <Progress 
              value={staff.efficiency} 
              size="sm" 
              width="100%" 
              colorScheme={
                staff.efficiency > 80 ? 'green' : 
                staff.efficiency > 60 ? 'orange' : 'red'
              }
            />
            <Text fontSize="xs" width="50px" textAlign="right">
              {staff.efficiency.toFixed(0)}%
            </Text>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
};

export default StaffPerformanceChart;