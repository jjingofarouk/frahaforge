// src/renderer/components/accounting/revenue/RevenueAnalysis.tsx
import React from 'react';
import { Box, Text, SimpleGrid } from '@chakra-ui/react';
import { useTransactionsData } from '../../transactions/hooks/useTransactionsData';
import { accountsService } from '../../../services/accountsService';
import './RevenueAnalysis.css';

interface RevenueAnalysisProps {
  startDate: string;
  endDate: string;
}

const RevenueAnalysis: React.FC<RevenueAnalysisProps> = ({ startDate, endDate }) => {
  const { data: transactionsData, state: transactionsState } = useTransactionsData();

  // Calculate metrics from transactions data (instant updates like ModernCharts)
  const revenueMetrics = React.useMemo(() => {
    if (!transactionsData?.transactions || transactionsData.transactions.length === 0) {
      return {
        totalRevenue: 0,
        transactionCount: 0,
        averageTransaction: 0,
        totalTax: 0,
        totalDiscount: 0
      };
    }

    const transactions = transactionsData.transactions;
    const totalRevenue = transactions.reduce((sum, transaction) => sum + transaction.total, 0);
    const totalTax = transactions.reduce((sum, transaction) => sum + (transaction.tax || 0), 0);
    const totalDiscount = transactions.reduce((sum, transaction) => sum + (transaction.discount || 0), 0);
    const transactionCount = transactions.length;
    const averageTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;

    return {
      totalRevenue,
      transactionCount,
      averageTransaction,
      totalTax,
      totalDiscount
    };
  }, [transactionsData?.transactions]);

  const loading = transactionsState.loading;

  if (loading) {
    return (
      <Box className="revenue-analysis">
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          {[...Array(4)].map((_, index) => (
            <Box key={index} className="revenue-stat-skeleton">
              <Box className="skeleton-label"></Box>
              <Box className="skeleton-value"></Box>
              <Box className="skeleton-help"></Box>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    );
  }

  const stats = [
    {
      label: 'Total Revenue',
      value: accountsService.formatCurrency(revenueMetrics.totalRevenue),
      help: `${revenueMetrics.transactionCount} transactions`,
      className: 'total-revenue'
    },
    {
      label: 'Average Transaction',
      value: accountsService.formatCurrency(revenueMetrics.averageTransaction),
      help: 'Per transaction',
      className: 'avg-transaction'
    },
    {
      label: 'Total Discount',
      value: accountsService.formatCurrency(revenueMetrics.totalDiscount),
      help: 'Discounts given',
      className: 'total-discount'
    }
  ];

  return (
    <Box className="revenue-analysis">
      <Text className="section-title">Revenue Analysis</Text>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        {stats.map((stat) => (
          <Box key={stat.label} className={`revenue-stat ${stat.className}`}>
            <Text className="stat-label">{stat.label}</Text>
            <Text className="stat-value">{stat.value}</Text>
            <Text className="stat-help">{stat.help}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default RevenueAnalysis;