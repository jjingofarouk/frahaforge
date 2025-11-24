// ExpiryAlertChart.tsx
import React from 'react';
import { Box, Text, HStack, VStack, Badge } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ExpiryAlertChartProps {
  products: any[];
}

interface ExpiryData {
  name: string;
  count: number;
  value: number;
  urgency: 'high' | 'medium' | 'low';
  daysUntilExpiry: number;
}

const ExpiryAlertChart: React.FC<ExpiryAlertChartProps> = ({ products }) => {
  const processExpiryData = (): ExpiryData[] => {
    const now = new Date();
    const expiryRanges: { [key: string]: { count: number; value: number; maxDays: number; urgency: 'high' | 'medium' | 'low' } } = {
      'Expired': { count: 0, value: 0, maxDays: 0, urgency: 'high' },
      '0-30 days': { count: 0, value: 0, maxDays: 30, urgency: 'high' },
      '31-90 days': { count: 0, value: 0, maxDays: 90, urgency: 'medium' },
      '91-180 days': { count: 0, value: 0, maxDays: 180, urgency: 'low' },
      '180+ days': { count: 0, value: 0, maxDays: Infinity, urgency: 'low' }
    };

    products.forEach(product => {
      if (product.expiration_date && product.expiration_date !== '') {
        const expiryDate = new Date(product.expiration_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const productValue = (product.cost_price || product.price * 0.6) * product.stock;

        if (daysUntilExpiry < 0) {
          expiryRanges['Expired'].count += 1;
          expiryRanges['Expired'].value += productValue;
        } else if (daysUntilExpiry <= 30) {
          expiryRanges['0-30 days'].count += 1;
          expiryRanges['0-30 days'].value += productValue;
        } else if (daysUntilExpiry <= 90) {
          expiryRanges['31-90 days'].count += 1;
          expiryRanges['31-90 days'].value += productValue;
        } else if (daysUntilExpiry <= 180) {
          expiryRanges['91-180 days'].count += 1;
          expiryRanges['91-180 days'].value += productValue;
        } else {
          expiryRanges['180+ days'].count += 1;
          expiryRanges['180+ days'].value += productValue;
        }
      }
    });

    return Object.entries(expiryRanges)
      .map(([name, data]) => ({
        name,
        count: data.count,
        value: data.value,
        urgency: data.urgency,
        daysUntilExpiry: data.maxDays
      }))
      .filter(item => item.count > 0);
  };

  const expiryData = processExpiryData();
  const chartColors = {
    high: '#dc2626',
    medium: '#d97706',
    low: '#059669'
  };

  const getColor = (urgency: 'high' | 'medium' | 'low') => {
    return chartColors[urgency];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const ExpiryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box bg="white" p={3} borderRadius="md" boxShadow="lg" border="1px solid #e2e8f0">
          <Text fontWeight="bold" mb={2} color="#1e3a8a" fontSize="sm">
            {data.name}
          </Text>
          <Text color="#475569" fontSize="sm" mb={1}>
            Products: {data.count}
          </Text>
          <Text color="#475569" fontSize="sm" mb={1}>
            Inventory Value: {formatCurrency(data.value)}
          </Text>
          <Badge 
            colorScheme={data.urgency === 'high' ? 'red' : data.urgency === 'medium' ? 'orange' : 'green'}
            fontSize="xs"
          >
            {data.urgency.toUpperCase()} PRIORITY
          </Badge>
        </Box>
      );
    }
    return null;
  };

  const totalExpiringSoon = expiryData
    .filter(item => item.urgency === 'high')
    .reduce((sum, item) => sum + item.count, 0);

  return (
    <Box className="chart-card" p={6} borderRadius="xl" bg="white" boxShadow="sm" border="1px solid #E2E8F0">
      <VStack align="start" spacing={3} mb={4}>
        <Text fontSize="lg" fontWeight="semibold" color="#1e3a8a">
          Medication Expiry Alerts
        </Text>
        {totalExpiringSoon > 0 && (
          <Badge colorScheme="red" fontSize="sm" px={3} py={1}>
            ⚠️ {totalExpiringSoon} products expiring soon
          </Badge>
        )}
      </VStack>
      
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={expiryData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#475569" fontSize={11} angle={-45} textAnchor="end" height={60} />
          <YAxis stroke="#475569" fontSize={12} />
          <Tooltip content={<ExpiryTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {expiryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.urgency)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ExpiryAlertChart;