// ExpenseAnalysisChart.tsx
import React from 'react';
import { Box, Text, HStack, VStack, Badge } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Expense } from '../../../../services/accountsService';

interface ExpenseAnalysisChartProps {
  expenses: Expense[];
}

interface ExpenseChartData {
  category: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

const ExpenseAnalysisChart: React.FC<ExpenseAnalysisChartProps> = ({ expenses }) => {
  const processExpenseData = (): ExpenseChartData[] => {
    const categoryData: { [key: string]: { amount: number; count: number } } = {};
    
    expenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      if (!categoryData[category]) {
        categoryData[category] = { amount: 0, count: 0 };
      }
      categoryData[category].amount += expense.amount;
      categoryData[category].count += 1;
    });

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const colors = [
      '#1e3a8a', '#0d9488', '#059669', '#d97706', '#dc2626',
      '#7c3aed', '#0891b2', '#475569', '#ea580c', '#e11d48'
    ];

    return Object.entries(categoryData)
      .map(([category, data], index) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 categories
  };

  const expenseData = processExpenseData();
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const ExpenseTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box bg="white" p={3} borderRadius="md" boxShadow="lg" border="1px solid #e2e8f0">
          <Text fontWeight="bold" mb={2} color="#1e3a8a" fontSize="sm">
            {data.category}
          </Text>
          <Text color="#475569" fontSize="sm" mb={1}>
            Amount: {formatCurrency(data.amount)}
          </Text>
          <Text color="#475569" fontSize="sm" mb={1}>
            Expenses: {data.count}
          </Text>
          <Text color="#475569" fontSize="sm">
            Percentage: {data.percentage.toFixed(1)}%
          </Text>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box className="chart-card" p={6} borderRadius="xl" bg="white" boxShadow="sm" border="1px solid #E2E8F0">
      <VStack align="start" spacing={3} mb={4}>
        <Text fontSize="lg" fontWeight="semibold" color="#1e3a8a">
          Expense Analysis by Category
        </Text>
        <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
          Total: {formatCurrency(totalExpenses)} • {expenses.length} expenses
        </Badge>
      </VStack>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={expenseData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="category" 
            stroke="#475569" 
            fontSize={11} 
            angle={-45} 
            textAnchor="end" 
            height={60} 
          />
          <YAxis 
            tickFormatter={formatCurrency}
            stroke="#475569" 
            fontSize={12} 
          />
          <Tooltip content={<ExpenseTooltip />} />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {expenseData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ExpenseAnalysisChart; 