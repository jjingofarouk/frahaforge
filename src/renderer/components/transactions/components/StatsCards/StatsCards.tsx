import React from 'react';
import { SimpleGrid, Box, Text, Flex } from '@chakra-ui/react';
import { 
  FiDollarSign, 
  FiTrendingUp, 
  FiShoppingCart, 
  FiUsers,
  FiPackage,
  FiBarChart2 
} from 'react-icons/fi';

interface Metric {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: string;
}

interface StatsCardsProps {
  metrics: Metric[];
}

const getIcon = (iconName: string) => {
  const icons: { [key: string]: any } = {
    '💰': FiDollarSign,
    '📈': FiTrendingUp,
    '🛒': FiShoppingCart,
    '📦': FiPackage,
    '📊': FiBarChart2,
    '👥': FiUsers,
  };
  return icons[iconName] || FiBarChart2;
};

const getTrendColor = (trend: 'up' | 'down') => {
  return trend === 'up' ? 'green.500' : 'red.500';
};

const StatsCards: React.FC<StatsCardsProps> = ({ metrics }) => {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 6 }} spacing={6}>
      {metrics.map((metric, index) => (
        <Box
          key={metric.title}
          p={6}
          borderRadius="xl"
          bg="white"
          boxShadow="sm"
          border="1px"
          borderColor="gray.100"
          transition="all 0.3s"
          _hover={{
            transform: 'translateY(-4px)',
            boxShadow: 'lg',
          }}
        >
          <Flex justify="space-between" align="flex-start" mb={4}>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                {metric.value}
              </Text>
              <Text fontSize="sm" color="gray.600" mt={1}>
                {metric.title}
              </Text>
            </Box>
            <Flex
              align="center"
              justify="center"
              w={12}
              h={12}
              borderRadius="lg"
              bg={`${getTrendColor(metric.trend)}15`}
              color={getTrendColor(metric.trend)}
            >
              {React.createElement(getIcon(metric.icon), { size: 24 })}
            </Flex>
          </Flex>
          
          <Flex align="center" gap={2}>
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={getTrendColor(metric.trend)}
            >
              {metric.trend === 'up' ? '↗' : '↘'} {Math.abs(metric.change)}%
            </Text>
            <Text fontSize="sm" color="gray.500">
              vs last period
            </Text>
          </Flex>
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default StatsCards;