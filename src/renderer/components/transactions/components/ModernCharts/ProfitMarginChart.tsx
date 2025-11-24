// ProfitMarginChart.tsx
import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction } from '../../../../services/transactionsService';

interface ProfitMarginChartProps {
  transactions: Transaction[];
  products: any[];
}

interface MarginData {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

const ProfitMarginChart: React.FC<ProfitMarginChartProps> = ({ transactions, products }) => {
  const processMarginData = (): MarginData[] => {
    const dailyData: { [key: string]: { revenue: number; cost: number } } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, cost: 0 };
      }
      
      dailyData[date].revenue += transaction.total;
      
      // Calculate cost from transaction items
      let transactionCost = 0;
      if (transaction.items) {
        transaction.items.forEach(item => {
          const product = products.find(p => p.id === item.product_id);
          const costPrice = product?.cost_price || item.price * 0.6; // Fallback estimation
          transactionCost += costPrice * item.quantity;
        });
      } else {
        transactionCost = transaction.total * 0.6; // Fallback estimation
      }
      
      dailyData[date].cost += transactionCost;
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.revenue - data.cost,
        margin: data.revenue > 0 ? ((data.revenue - data.cost) / data.revenue) * 100 : 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const marginData = processMarginData();
  const chartColors = {
    revenue: '#1e3a8a',
    cost: '#dc2626',
    profit: '#059669',
    margin: '#7c3aed'
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const MarginTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box bg="white" p={3} borderRadius="md" boxShadow="lg" border="1px solid #e2e8f0">
          <Text fontWeight="bold" mb={2} color={chartColors.revenue} fontSize="sm">
            {data.date}
          </Text>
          <Text color={chartColors.revenue} fontSize="sm" mb={1}>
            Revenue: {formatCurrency(data.revenue)}
          </Text>
          <Text color={chartColors.cost} fontSize="sm" mb={1}>
            Cost: {formatCurrency(data.cost)}
          </Text>
          <Text color={chartColors.profit} fontSize="sm" mb={1}>
            Profit: {formatCurrency(data.profit)}
          </Text>
          <Text color={chartColors.margin} fontSize="sm">
            Margin: {data.margin.toFixed(1)}%
          </Text>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box className="chart-card" p={6} borderRadius="xl" bg="white" boxShadow="sm" border="1px solid #E2E8F0">
      <Text fontSize="lg" fontWeight="semibold" mb={4} color={chartColors.revenue}>
        Profit Margin Analysis
      </Text>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={marginData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#475569" fontSize={12} />
          <YAxis 
            yAxisId="left"
            tickFormatter={formatCurrency}
            stroke="#475569" 
            fontSize={12} 
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => `${value}%`}
            stroke="#475569" 
            fontSize={12} 
          />
          <Tooltip content={<MarginTooltip />} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            stroke={chartColors.revenue}
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="cost"
            stroke={chartColors.cost}
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="profit"
            stroke={chartColors.profit}
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="margin"
            stroke={chartColors.margin}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ProfitMarginChart;