// ModernCharts.tsx
import React from 'react';
import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Transaction } from '../../../../services/transactionsService';
import {
  ProfitMarginChart,
  StaffPerformanceChart,
  ExpenseAnalysisChart,
  MonthlyExpenseTrendChart,
  ExpensePaymentMethodsChart
} from './';

// === CHART DATA INTERFACES ===
interface ChartData {
  date: string;
  sales: number;
  [key: string]: any;
}

interface PaymentChartData {
  name: string;
  value: number;
  amount?: number;
  [key: string]: any;
}

interface CategoryChartData {
  name: string;
  sales: number;
  abbreviatedName?: string;
  [key: string]: any;
}

interface ProfitData {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  [key: string]: any;
}

interface CashierData {
  name: string;
  sales: number;
  transactions: number;
  avgTransaction: number;
  [key: string]: any;
}

interface ModernChartsProps {
  salesData: ChartData[];
  paymentData: PaymentChartData[];
  categoryData: CategoryChartData[];
  topCustomersData: any[];
  hourlyData: any[];
  profitData: any[];
  inventoryData: any[];
  cashierData: any[];
  transactions: Transaction[];
  products: any[];
  customersDue: any[];
  expenses: any[];
}

const ModernCharts: React.FC<ModernChartsProps> = ({
  salesData,
  paymentData,
  categoryData,
  topCustomersData,
  hourlyData,
  profitData,
  inventoryData,
  cashierData,
  transactions,
  products,
  customersDue,
  expenses = [],
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-UG').format(value);
  };

  // Professional color palette
  const chartColors = {
    navy: '#1e3a8a',
    teal: '#0d9488',
    slate: '#475569',
    emerald: '#059669',
    amber: '#d97706',
    rose: '#e11d48',
    indigo: '#4f46e5',
    purple: '#7c3aed',
    cyan: '#0891b2',
    orange: '#ea580c'
  };

  const barColors = [
    chartColors.navy,
    chartColors.teal,
    chartColors.emerald,
    chartColors.indigo,
    chartColors.amber,
    chartColors.purple,
    chartColors.cyan,
    chartColors.rose
  ];

  const pieColors = [
    chartColors.navy,
    chartColors.teal,
    chartColors.emerald,
    chartColors.amber,
    chartColors.indigo,
    chartColors.rose,
    chartColors.purple,
    chartColors.cyan
  ];

  // === DATA PROCESSING FUNCTIONS ===
  const processRealSalesData = (transactions: Transaction[]): ChartData[] => {
    const dailySales: { [key: string]: number } = {};
    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      dailySales[date] = (dailySales[date] || 0) + transaction.total;
    });
    return Object.entries(dailySales)
      .map(([date, sales]) => ({ date, sales }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const processRealPaymentData = (transactions: Transaction[]): PaymentChartData[] => {
    const paymentMethods: { [key: string]: { count: number; amount: number } } = {};
    transactions.forEach(transaction => {
      const method = transaction.payment_type || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].amount += transaction.total;
    });
    return Object.entries(paymentMethods).map(([name, data]) => ({
      name,
      value: data.count,
      amount: data.amount
    }));
  };

  const processRealCategoryData = (transactions: Transaction[]): CategoryChartData[] => {
    const categories: { [key: string]: number } = {};
    transactions.forEach(transaction => {
      const category = 'General';
      categories[category] = (categories[category] || 0) + transaction.total;
    });
    return Object.entries(categories).map(([name, sales]) => ({
      name,
      sales,
      abbreviatedName: abbreviateCategoryName(name)
    }));
  };

  const processRealProfitData = (transactions: Transaction[]): ProfitData[] => {
    const dailyProfits: { [key: string]: { revenue: number; cost: number; profit: number } } = {};
    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      if (!dailyProfits[date]) {
        dailyProfits[date] = { revenue: 0, cost: 0, profit: 0 };
      }
      const estimatedCost = transaction.total * 0.6;
      dailyProfits[date].revenue += transaction.total;
      dailyProfits[date].cost += estimatedCost;
      dailyProfits[date].profit += transaction.total - estimatedCost;
    });
    return Object.entries(dailyProfits)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.profit
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const processRealCashierData = (transactions: Transaction[]): CashierData[] => {
    const cashierStats: { [key: string]: { sales: number; transactions: number } } = {};
    transactions.forEach(transaction => {
      const cashier = transaction.user_name || 'Unknown';
      if (!cashierStats[cashier]) {
        cashierStats[cashier] = { sales: 0, transactions: 0 };
      }
      cashierStats[cashier].sales += transaction.total;
      cashierStats[cashier].transactions += 1;
    });
    return Object.entries(cashierStats)
      .map(([name, data]) => ({
        name,
        sales: data.sales,
        transactions: data.transactions,
        avgTransaction: data.transactions > 0 ? data.sales / data.transactions : 0
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8);
  };

  const abbreviateCategoryName = (name: string): string => {
    const abbreviations: { [key: string]: string } = {
      'uncategorized': 'UC',
      'first aid': 'FA',
      'pharmaceuticals': 'PHARM',
      'medicines': 'MED',
      'prescription': 'RX',
      'over the counter': 'OTC',
      'healthcare': 'HC',
      'personal care': 'PC',
      'vitamins': 'VIT',
      'supplements': 'SUPP',
      'medical equipment': 'EQUIP',
      'baby care': 'BABY',
      'skincare': 'SKIN',
      'cosmetics': 'COS',
      'general': 'GEN'
    };
    const lowerName = name.toLowerCase().trim();
    return abbreviations[lowerName] ||
      name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 4) ||
      name.substring(0, 3).toUpperCase();
  };

  // === PROCESS REAL DATA ===
  const realSalesData = processRealSalesData(transactions);
  const realPaymentData = processRealPaymentData(transactions);
  const realCategoryData = processRealCategoryData(transactions);
  const realProfitData = processRealProfitData(transactions);
  const realCashierData = processRealCashierData(transactions);

  const abbreviatedCategoryData = realCategoryData.map(item => ({
    ...item,
    abbreviatedName: abbreviateCategoryName(item.name)
  }));

  // === TOOLTIP COMPONENTS ===
  const SalesTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box bg="white" p={3} borderRadius="md" boxShadow="lg" border="1px solid #cbd5e0">
          <Text fontWeight="bold" mb={2} color={chartColors.navy} fontSize="sm">
            {payload[0].payload.date}
          </Text>
          <Text color={chartColors.slate} fontSize="sm">
            Sales: {formatCurrency(payload[0].value)}
          </Text>
        </Box>
      );
    }
    return null;
  };

  const ProfitTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box bg="white" p={3} borderRadius="md" boxShadow="lg" border="1px solid #cbd5e0">
          <Text fontWeight="bold" mb={2} color={chartColors.navy} fontSize="sm">
            {data.date}
          </Text>
          <Text color={chartColors.emerald} fontSize="sm" mb={1}>
            Profit: {formatCurrency(data.profit)}
          </Text>
          <Text color={chartColors.slate} fontSize="sm" mb={1}>
            Revenue: {formatCurrency(data.revenue)}
          </Text>
          <Text color={chartColors.rose} fontSize="sm">
            Cost: {formatCurrency(data.cost)}
          </Text>
        </Box>
      );
    }
    return null;
  };

  const CategoryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const fullCategoryName = realCategoryData.find(item =>
        abbreviateCategoryName(item.name) === label
      )?.name || label;
      return (
        <Box bg="white" p={3} borderRadius="md" boxShadow="lg" border="1px solid #cbd5e0">
          <Text fontWeight="bold" mb={2} color={chartColors.navy} fontSize="sm">
            {fullCategoryName}
          </Text>
          <Text color={chartColors.slate} fontSize="sm">
            Sales: {formatCurrency(payload[0].value)}
          </Text>
        </Box>
      );
    }
    return null;
  };

  const PaymentTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = realPaymentData.reduce((sum, item) => sum + item.value, 0);
      const percent = total > 0 ? (data.value / total) * 100 : 0;
      return (
        <Box bg="white" p={3} borderRadius="md" boxShadow="lg" border="1px solid #cbd5e0">
          <Text fontWeight="bold" mb={2} color={chartColors.navy} fontSize="sm">
            {data.name}
          </Text>
          <Text color={chartColors.slate} fontSize="sm" mb={1}>
            Transactions: {formatNumber(data.value)}
          </Text>
          <Text color={chartColors.slate} fontSize="sm" mb={1}>
            Amount: {formatCurrency(data.amount || 0)}
          </Text>
          <Text color={chartColors.slate} fontSize="sm">
            Percentage: {percent.toFixed(1)}%
          </Text>
        </Box>
      );
    }
    return null;
  };

  const CashierTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box bg="white" p={3} borderRadius="md" boxShadow="lg" border="1px solid #cbd5e0">
          <Text fontWeight="bold" mb={2} color={chartColors.navy} fontSize="sm">
            {data.name}
          </Text>
          <Text color={chartColors.slate} fontSize="sm" mb={1}>
            Sales: {formatCurrency(data.sales)}
          </Text>
          <Text color={chartColors.slate} fontSize="sm" mb={1}>
            Transactions: {formatNumber(data.transactions)}
          </Text>
          <Text color={chartColors.slate} fontSize="sm">
            Avg. Transaction: {formatCurrency(data.avgTransaction)}
          </Text>
        </Box>
      );
    }
    return null;
  };

  // === CUSTOM PIE LABEL COMPONENT ===
  const renderPieLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, name, value } = props;
    const total = realPaymentData.reduce((sum, item) => sum + item.value, 0);
    const percent = total > 0 ? (value / total) * 100 : 0;
    
    // Only show label if percentage is greater than 5%
    if (percent <= 5) return null;

    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={chartColors.slate}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
      >
        {name}
      </text>
    );
  };

  // === EMPTY STATE ===
  if (transactions.length === 0 && expenses.length === 0) {
    return (
      <Box className="chart-card" p={6} borderRadius="xl" bg="white" boxShadow="sm" border="1px solid #E2E8F0">
        <Text textAlign="center" color={chartColors.slate}>
          No data available for the selected period.
        </Text>
      </Box>
    );
  }

  // === RENDER CHARTS ===
  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
      {/* SALES & REVENUE CHARTS */}
      
      {/* Sales Trend Chart */}
      <Box className="chart-card" p={6} borderRadius="xl" bg="white" boxShadow="sm" border="1px solid #E2E8F0">
        <Text fontSize="lg" fontWeight="semibold" mb={4} color={chartColors.navy}>
          Sales Trend
        </Text>
        <Box className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={realSalesData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <XAxis dataKey="date" stroke={chartColors.slate} fontSize={12} />
              <YAxis tickFormatter={formatCurrency} stroke={chartColors.slate} fontSize={12} width={80} />
              <Tooltip content={<SalesTooltip />} />
              <Area
                type="monotone"
                dataKey="sales"
                stroke={chartColors.navy}
                fill={chartColors.navy}
                strokeWidth={2}
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Daily Profits Chart */}
      <Box className="chart-card" p={6} borderRadius="xl" bg="white" boxShadow="sm" border="1px solid #E2E8F0">
        <Text fontSize="lg" fontWeight="semibold" mb={4} color={chartColors.emerald}>
          Daily Profits
        </Text>
        <Box className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={realProfitData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <XAxis dataKey="date" stroke={chartColors.slate} fontSize={12} />
              <YAxis tickFormatter={formatCurrency} stroke={chartColors.slate} fontSize={12} width={80} />
              <Tooltip content={<ProfitTooltip />} />
              <Bar dataKey="profit" fill={chartColors.emerald} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Profit Margin Analysis */}
      <ProfitMarginChart transactions={transactions} products={products} />

      {/* EXPENSE CHARTS - Only show if we have expense data */}
      {expenses.length > 0 && (
        <>
          <ExpenseAnalysisChart expenses={expenses} />
          <MonthlyExpenseTrendChart expenses={expenses} />
        </>
      )}

      {/* Payment Methods Chart */}
      <Box className="chart-card" p={6} borderRadius="xl" bg="white" boxShadow="sm" border="1px solid #E2E8F0">
        <Text fontSize="lg" fontWeight="semibold" mb={4} color={chartColors.indigo}>
          Payment Methods
        </Text>
        <Box className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Pie
                data={realPaymentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderPieLabel}
                outerRadius={90}
                dataKey="value"
              >
                {realPaymentData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<PaymentTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Expense Payment Methods - Only show if we have expense data */}
      {expenses.length > 0 && (
        <ExpensePaymentMethodsChart expenses={expenses} />
      )}

      {/* Staff Performance Chart */}
      <StaffPerformanceChart transactions={transactions} />

      {/* Most Selling Categories Chart */}
      {abbreviatedCategoryData.length > 0 && (
        <Box className="chart-card" p={6} borderRadius="xl" bg="white" boxShadow="sm" border="1px solid #E2E8F0">
          <Text fontSize="lg" fontWeight="semibold" mb={4} color={chartColors.teal}>
            Sales by Category
          </Text>
          <Box className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={abbreviatedCategoryData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <XAxis
                  dataKey="abbreviatedName"
                  angle={0}
                  textAnchor="middle"
                  height={60}
                  interval={0}
                  fontSize={11}
                  stroke={chartColors.slate}
                />
                <YAxis tickFormatter={formatCurrency} stroke={chartColors.slate} fontSize={12} width={80} />
                <Tooltip content={<CategoryTooltip />} />
                <Bar dataKey="sales" fill={chartColors.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}
    </SimpleGrid>
  );
};

export default ModernCharts;