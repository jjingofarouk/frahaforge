// CustomerSegmentsChart.tsx
import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface CustomerSegmentsChartProps {
  customers: any[];
  transactions: any[];
}

interface SegmentData {
  subject: string;
  VIP: number;
  Regular: number;
  New: number;
  fullMark: number;
}

const CustomerSegmentsChart: React.FC<CustomerSegmentsChartProps> = ({ customers, transactions }) => {
  const processSegmentData = (): SegmentData[] => {
    // Calculate metrics by customer segment
    const segmentMetrics: { [key: string]: { totalSpent: number; orderCount: number; avgOrder: number } } = {
      'vip': { totalSpent: 0, orderCount: 0, avgOrder: 0 },
      'regular': { totalSpent: 0, orderCount: 0, avgOrder: 0 },
      'new': { totalSpent: 0, orderCount: 0, avgOrder: 0 }
    };

    // Process customer data
    customers.forEach(customer => {
      const segment = customer.segment?.toLowerCase() || 'new';
      if (segmentMetrics[segment]) {
        segmentMetrics[segment].totalSpent += customer.total_spent || 0;
        segmentMetrics[segment].orderCount += customer.total_orders || 0;
      }
    });

    // Calculate averages
    Object.keys(segmentMetrics).forEach(segment => {
      if (segmentMetrics[segment].orderCount > 0) {
        segmentMetrics[segment].avgOrder = segmentMetrics[segment].totalSpent / segmentMetrics[segment].orderCount;
      }
    });

    // Normalize for radar chart (0-100 scale)
    const maxSpent = Math.max(...Object.values(segmentMetrics).map(m => m.totalSpent));
    const maxOrders = Math.max(...Object.values(segmentMetrics).map(m => m.orderCount));
    const maxAvg = Math.max(...Object.values(segmentMetrics).map(m => m.avgOrder));

    return [
      {
        subject: 'Total Spent',
        VIP: maxSpent > 0 ? (segmentMetrics['vip'].totalSpent / maxSpent) * 100 : 0,
        Regular: maxSpent > 0 ? (segmentMetrics['regular'].totalSpent / maxSpent) * 100 : 0,
        New: maxSpent > 0 ? (segmentMetrics['new'].totalSpent / maxSpent) * 100 : 0,
        fullMark: 100
      },
      {
        subject: 'Order Count',
        VIP: maxOrders > 0 ? (segmentMetrics['vip'].orderCount / maxOrders) * 100 : 0,
        Regular: maxOrders > 0 ? (segmentMetrics['regular'].orderCount / maxOrders) * 100 : 0,
        New: maxOrders > 0 ? (segmentMetrics['new'].orderCount / maxOrders) * 100 : 0,
        fullMark: 100
      },
      {
        subject: 'Avg Order',
        VIP: maxAvg > 0 ? (segmentMetrics['vip'].avgOrder / maxAvg) * 100 : 0,
        Regular: maxAvg > 0 ? (segmentMetrics['regular'].avgOrder / maxAvg) * 100 : 0,
        New: maxAvg > 0 ? (segmentMetrics['new'].avgOrder / maxAvg) * 100 : 0,
        fullMark: 100
      }
    ];
  };

  const segmentData = processSegmentData();
  const chartColors = {
    vip: '#7c3aed',
    regular: '#0d9488',
    new: '#d97706'
  };

  const SegmentTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box bg="white" p={3} borderRadius="md" boxShadow="lg" border="1px solid #e2e8f0">
          <Text fontWeight="bold" mb={2} color="#1e3a8a" fontSize="sm">
            {data.subject}
          </Text>
          {payload.map((entry: any, index: number) => (
            <Text key={index} color={entry.color} fontSize="sm">
              {entry.name}: {entry.value.toFixed(1)}%
            </Text>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Box className="chart-card" p={6} borderRadius="xl" bg="white" boxShadow="sm" border="1px solid #E2E8F0">
      <Text fontSize="lg" fontWeight="semibold" mb={4} color="#1e3a8a">
        Customer Segments Analysis
      </Text>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={segmentData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" stroke="#475569" fontSize={12} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
          <Tooltip content={<SegmentTooltip />} />
          <Radar
            name="VIP"
            dataKey="VIP"
            stroke={chartColors.vip}
            fill={chartColors.vip}
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar
            name="Regular"
            dataKey="Regular"
            stroke={chartColors.regular}
            fill={chartColors.regular}
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar
            name="New"
            dataKey="New"
            stroke={chartColors.new}
            fill={chartColors.new}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default CustomerSegmentsChart;