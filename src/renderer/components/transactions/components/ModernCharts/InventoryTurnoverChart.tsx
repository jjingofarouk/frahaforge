// InventoryTurnoverChart.tsx
import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface InventoryTurnoverChartProps {
  products: any[];
  transactions: any[];
}

interface InventoryData {
  product: string;
  salesVolume: number;
  profitMargin: number;
  stockLevel: number;
  turnover: number;
}

const InventoryTurnoverChart: React.FC<InventoryTurnoverChartProps> = ({ products, transactions }) => {
  const processInventoryData = (): InventoryData[] => {
    // Calculate sales volume from transactions
    const productSales: { [key: number]: number } = {};
    
    transactions.forEach(transaction => {
      if (transaction.items) {
        transaction.items.forEach((item: any) => {
          productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity;
        });
      }
    });

    return products
      .filter(product => productSales[product.id] > 0) // Only products with sales
      .map(product => {
        const salesVolume = productSales[product.id] || 0;
        const profitMargin = product.cost_price ? ((product.price - product.cost_price) / product.price) * 100 : 30;
        const turnover = product.stock > 0 ? salesVolume / product.stock : 0;
        
        return {
          product: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
          salesVolume,
          profitMargin,
          stockLevel: product.stock,
          turnover
        };
      })
      .sort((a, b) => b.salesVolume - a.salesVolume)
      .slice(0, 50); // Top 50 products
  };

  const inventoryData = processInventoryData();
  const chartColors = {
    highTurnover: '#059669',
    mediumTurnover: '#d97706',
    lowTurnover: '#dc2626'
  };

  const getTurnoverColor = (turnover: number) => {
    if (turnover > 0.5) return chartColors.highTurnover;
    if (turnover > 0.1) return chartColors.mediumTurnover;
    return chartColors.lowTurnover;
  };

  const InventoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box bg="white" p={3} borderRadius="md" boxShadow="lg" border="1px solid #e2e8f0">
          <Text fontWeight="bold" mb={2} color="#1e3a8a" fontSize="sm">
            {data.product}
          </Text>
          <Text color="#475569" fontSize="sm" mb={1}>
            Sales Volume: {data.salesVolume}
          </Text>
          <Text color="#475569" fontSize="sm" mb={1}>
            Profit Margin: {data.profitMargin.toFixed(1)}%
          </Text>
          <Text color="#475569" fontSize="sm" mb={1}>
            Stock Level: {data.stockLevel}
          </Text>
          <Text color="#475569" fontSize="sm">
            Turnover Rate: {data.turnover.toFixed(2)}
          </Text>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box className="chart-card" p={6} borderRadius="xl" bg="white" boxShadow="sm" border="1px solid #E2E8F0">
      <Text fontSize="lg" fontWeight="semibold" mb={4} color="#1e3a8a">
        Inventory Turnover Analysis
      </Text>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart data={inventoryData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="salesVolume" 
            name="Sales Volume"
            stroke="#475569" 
            fontSize={12}
          />
          <YAxis 
            dataKey="profitMargin" 
            name="Profit Margin %"
            tickFormatter={(value) => `${value}%`}
            stroke="#475569" 
            fontSize={12}
          />
          <Tooltip content={<InventoryTooltip />} />
          <Scatter name="Products" data={inventoryData}>
            {inventoryData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getTurnoverColor(entry.turnover)}
                opacity={0.7}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <Box mt={3} fontSize="sm" color="#475569">
        <Text>• <span style={{color: chartColors.highTurnover}}>Green</span>: High turnover</Text>
        <Text>• <span style={{color: chartColors.mediumTurnover}}>Orange</span>: Medium turnover</Text>
        <Text>• <span style={{color: chartColors.lowTurnover}}>Red</span>: Low turnover</Text>
      </Box>
    </Box>
  );
};

export default InventoryTurnoverChart;