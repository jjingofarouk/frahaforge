// ExpensePaymentMethodsChart.tsx
import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Expense } from '../../../../services/accountsService';

interface ExpensePaymentMethodsChartProps {
  expenses: Expense[];
}

interface PaymentMethodData {
  name: string;
  value: number;
  amount: number;
  percentage: number;
  [key: string]: any;
}

const ExpensePaymentMethodsChart: React.FC<ExpensePaymentMethodsChartProps> = ({ expenses }) => {
  const processPaymentData = (): PaymentMethodData[] => {
    const paymentMethods: { [key: string]: { count: number; amount: number } } = {};
    
    expenses.forEach(expense => {
      const method = expense.payment_method || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].amount += expense.amount;
    });

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return Object.entries(paymentMethods)
      .map(([name, data]) => ({
        name,
        value: data.count,
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const paymentData = processPaymentData();
  const pieColors = ['#1e3a8a', '#0d9488', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const PaymentTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box bg="white" p={3} borderRadius="md" boxShadow="lg" border="1px solid #e2e8f0">
          <Text fontWeight="bold" mb={2} color="#1e3a8a" fontSize="sm">
            {data.name}
          </Text>
          <Text color="#475569" fontSize="sm" mb={1}>
            Expenses: {data.value}
          </Text>
          <Text color="#475569" fontSize="sm" mb={1}>
            Amount: {formatCurrency(data.amount)}
          </Text>
          <Text color="#475569" fontSize="sm">
            Percentage: {data.percentage.toFixed(1)}%
          </Text>
        </Box>
      );
    }
    return null;
  };

  // FIXED: Use the correct Recharts label function signature
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props;
    
    // Only show label if percentage is greater than 5%
    if ((percent * 100) <= 5) return null;

    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#475569"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
      >
        {name}: {(percent * 100).toFixed(1)}%
      </text>
    );
  };

  return (
    <Box className="chart-card" p={6} borderRadius="xl" bg="white" boxShadow="sm" border="1px solid #E2E8F0">
      <Text fontSize="lg" fontWeight="semibold" mb={4} color="#1e3a8a">
        Expense Payment Methods
      </Text>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={paymentData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            dataKey="amount"
          >
            {paymentData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
          <Tooltip content={<PaymentTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ExpensePaymentMethodsChart;