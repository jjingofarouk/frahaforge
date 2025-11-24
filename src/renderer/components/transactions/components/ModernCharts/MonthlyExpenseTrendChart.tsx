// MonthlyExpenseTrendChart.tsx
import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { Expense } from '../../../../services/accountsService';

interface MonthlyExpenseTrendChartProps {
  expenses: Expense[];
}

interface MonthlyData {
  month: string;
  amount: number;
  count: number;
  average: number;
}

const MonthlyExpenseTrendChart: React.FC<MonthlyExpenseTrendChartProps> = ({ expenses }) => {
  const processMonthlyData = (): MonthlyData[] => {
    const monthlyData: { [key: string]: { amount: number; count: number } } = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.expense_date);
      const monthKey = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { amount: 0, count: 0 };
      }
      monthlyData[monthKey].amount += expense.amount;
      monthlyData[monthKey].count += 1;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        amount: data.amount,
        count: data.count,
        average: data.count > 0 ? data.amount / data.count : 0
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  };

  const monthlyData = processMonthlyData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const MonthlyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box bg="white" p={3} borderRadius="md" boxShadow="lg" border="1px solid #e2e8f0">
          <Text fontWeight="bold" mb={2} color="#1e3a8a" fontSize="sm">
            {data.month}
          </Text>
          <Text color="#dc2626" fontSize="sm" mb={1}>
            Total: {formatCurrency(data.amount)}
          </Text>
          <Text color="#475569" fontSize="sm" mb={1}>
            Expenses: {data.count}
          </Text>
          <Text color="#059669" fontSize="sm">
            Average: {formatCurrency(data.average)}
          </Text>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box className="chart-card" p={6} borderRadius="xl" bg="white" boxShadow="sm" border="1px solid #E2E8F0">
      <Text fontSize="lg" fontWeight="semibold" mb={4} color="#dc2626">
        Monthly Expense Trend
      </Text>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#475569" fontSize={12} />
          <YAxis 
            tickFormatter={formatCurrency}
            stroke="#475569" 
            fontSize={12} 
          />
          <Tooltip content={<MonthlyTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#dc2626"
            fill="#dc2626"
            strokeWidth={2}
            fillOpacity={0.1}
          />
          <Line
            type="monotone"
            dataKey="average"
            stroke="#059669"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default MonthlyExpenseTrendChart;