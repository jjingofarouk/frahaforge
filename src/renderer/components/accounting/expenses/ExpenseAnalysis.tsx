// src/renderer/components/accounting/expenses/ExpenseAnalysis.tsx
import React, { useState, useEffect } from 'react';
import { Box, Text, VStack, HStack, SimpleGrid, Skeleton, Progress, useColorModeValue } from '@chakra-ui/react';
import { accountsService, Expense } from '../../../services/accountsService';
import './ExpenseAnalysis.css';

interface ExpenseAnalysisProps {
  startDate?: string;
  endDate?: string;
}

const ExpenseAnalysis: React.FC<ExpenseAnalysisProps> = ({ startDate, endDate }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const cardBg = useColorModeValue('var(--bg-surface)', 'var(--bg-surface)');
  const borderColor = useColorModeValue('var(--border-color)', 'var(--border-color)');

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await accountsService.getExpenses({
        startDate,
        endDate,
        page: 1,
        limit: 1000
      });
      
      if (response.success) {
        setExpenses(response.data);
      } else {
        setError('Failed to load expense analysis data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CRITICAL FIX: Reload when date range changes
  useEffect(() => {
    if (startDate && endDate) {
      loadExpenses();
    }
  }, [startDate, endDate]);

  const getCategoryBreakdown = () => {
    const breakdown: { [key: string]: { amount: number; count: number; percentage: number } } = {};
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    expenses.forEach(expense => {
      if (!breakdown[expense.category]) {
        breakdown[expense.category] = { amount: 0, count: 0, percentage: 0 };
      }
      breakdown[expense.category].amount += expense.amount;
      breakdown[expense.category].count += 1;
    });
    
    // Calculate percentages
    Object.keys(breakdown).forEach(category => {
      breakdown[category].percentage = totalAmount > 0 ? (breakdown[category].amount / totalAmount) * 100 : 0;
    });
    
    return Object.entries(breakdown)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getPaymentMethodBreakdown = () => {
    const breakdown: { [key: string]: { amount: number; count: number; percentage: number } } = {};
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    expenses.forEach(expense => {
      if (!breakdown[expense.payment_method]) {
        breakdown[expense.payment_method] = { amount: 0, count: 0, percentage: 0 };
      }
      breakdown[expense.payment_method].amount += expense.amount;
      breakdown[expense.payment_method].count += 1;
    });
    
    // Calculate percentages
    Object.keys(breakdown).forEach(method => {
      breakdown[method].percentage = totalAmount > 0 ? (breakdown[method].amount / totalAmount) * 100 : 0;
    });
    
    return Object.entries(breakdown)
      .map(([method, data]) => ({ method, ...data }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getStatusBreakdown = () => {
    const breakdown: { [key: string]: { amount: number; count: number; percentage: number } } = {};
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    expenses.forEach(expense => {
      if (!breakdown[expense.status]) {
        breakdown[expense.status] = { amount: 0, count: 0, percentage: 0 };
      }
      breakdown[expense.status].amount += expense.amount;
      breakdown[expense.status].count += 1;
    });
    
    // Calculate percentages
    Object.keys(breakdown).forEach(status => {
      breakdown[status].percentage = totalAmount > 0 ? (breakdown[status].amount / totalAmount) * 100 : 0;
    });
    
    return Object.entries(breakdown)
      .map(([status, data]) => ({ status, ...data }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Rent': 'var(--primary-teal)',
      'Salaries': 'var(--success)',
      'Utilities': 'var(--warning)',
      'Supplies': 'var(--danger)',
      'Marketing': '#8B5CF6',
      'Transportation': '#EC4899',
      'Professional Fees': '#3B82F6',
      'Insurance': '#F59E0B',
      'Office Supplies': '#10B981',
      'Taxes': '#EF4444',
      'Other': '#6B7280'
    };
    return colors[category] || 'var(--text-secondary)';
  };

  if (loading) {
    return (
      <Box className="expense-analysis">
        <Skeleton height="600px" borderRadius="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="expense-analysis error">
        <Box className="error-message" p={4} textAlign="center" color="var(--danger)">
          {error}
        </Box>
      </Box>
    );
  }

  const categoryBreakdown = getCategoryBreakdown();
  const paymentMethodBreakdown = getPaymentMethodBreakdown();
  const statusBreakdown = getStatusBreakdown();
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const avgExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;

  return (
    <Box
      className="expense-analysis"
      bg={cardBg}
      p={6}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
    >
      <VStack align="stretch" spacing={4} mb={6}>
        <Text className="section-title" fontSize="lg" fontWeight="600" color="var(--text-primary)">
          Expense Analysis
        </Text>
        {startDate && endDate && (
          <Text fontSize="sm" color="var(--text-secondary)">
            {startDate} to {endDate} • {expenses.length} expenses
          </Text>
        )}
      </VStack>

      {expenses.length === 0 ? (
        <Box textAlign="center" py={12}>
          <Text fontSize="lg" color="var(--text-secondary)" mb={2}>
            No expenses found
          </Text>
          <Text fontSize="sm" color="var(--text-secondary)">
            {startDate && endDate 
              ? `No expenses found for ${startDate} to ${endDate}` 
              : 'Try adjusting your date range or add expenses'}
          </Text>
        </Box>
      ) : (
        <>
          {/* Summary Stats */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
            <Box className="summary-stat" textAlign="center">
              <Text className="stat-value" fontSize="xl" fontWeight="700" color="var(--text-primary)">
                {accountsService.formatCurrency(totalExpenses)}
              </Text>
              <Text className="stat-label" fontSize="sm" color="var(--text-secondary)">
                Total Expenses
              </Text>
            </Box>
            <Box className="summary-stat" textAlign="center">
              <Text className="stat-value" fontSize="xl" fontWeight="700" color="var(--primary-teal)">
                {expenses.length}
              </Text>
              <Text className="stat-label" fontSize="sm" color="var(--text-secondary)">
                Expense Items
              </Text>
            </Box>
            <Box className="summary-stat" textAlign="center">
              <Text className="stat-value" fontSize="xl" fontWeight="700" color="var(--warning)">
                {accountsService.formatCurrency(avgExpense)}
              </Text>
              <Text className="stat-label" fontSize="sm" color="var(--text-secondary)">
                Average per Item
              </Text>
            </Box>
            <Box className="summary-stat" textAlign="center">
              <Text className="stat-value" fontSize="xl" fontWeight="700" color="var(--success)">
                {categoryBreakdown.length}
              </Text>
              <Text className="stat-label" fontSize="sm" color="var(--text-secondary)">
                Categories
              </Text>
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {/* Category Breakdown */}
            <Box className="breakdown-section">
              <Text className="breakdown-title" fontSize="md" fontWeight="600" color="var(--text-primary)" mb={4}>
                By Category
              </Text>
              <VStack spacing={4} align="stretch">
                {categoryBreakdown.map((item) => (
                  <Box key={item.category} className="breakdown-item">
                    <HStack justify="space-between" mb={2}>
                      <HStack spacing={3}>
                        <Box
                          className="color-indicator"
                          w="12px"
                          h="12px"
                          borderRadius="full"
                          bg={getCategoryColor(item.category)}
                        />
                        <Text className="breakdown-label" fontSize="sm" fontWeight="500" color="var(--text-primary)">
                          {item.category}
                        </Text>
                      </HStack>
                      <Text className="breakdown-percentage" fontSize="sm" fontWeight="600" color="var(--text-primary)">
                        {item.percentage.toFixed(1)}%
                      </Text>
                    </HStack>
                    <Progress
                      value={item.percentage}
                      height="8px"
                      borderRadius="full"
                      bg="var(--border-color)"
                      sx={{
                        '& > div': {
                          bg: getCategoryColor(item.category)
                        }
                      }}
                    />
                    <HStack justify="space-between" mt={2}>
                      <Text className="breakdown-amount" fontSize="xs" color="var(--text-secondary)">
                        {accountsService.formatCurrency(item.amount)}
                      </Text>
                      <Text className="breakdown-count" fontSize="xs" color="var(--text-secondary)">
                        {item.count} items
                      </Text>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </Box>

            {/* Payment Method & Status Breakdown */}
            <VStack spacing={6} align="stretch">
              {/* Payment Method Breakdown */}
              <Box className="breakdown-section">
                <Text className="breakdown-title" fontSize="md" fontWeight="600" color="var(--text-primary)" mb={4}>
                  By Payment Method
                </Text>
                <VStack spacing={3} align="stretch">
                  {paymentMethodBreakdown.map((item) => (
                    <HStack key={item.method} justify="space-between">
                      <Text className="breakdown-label" fontSize="sm" color="var(--text-primary)">
                        {item.method}
                      </Text>
                      <HStack spacing={4}>
                        <Text className="breakdown-amount" fontSize="sm" color="var(--text-secondary)">
                          {accountsService.formatCurrency(item.amount)}
                        </Text>
                        <Text className="breakdown-percentage" fontSize="sm" fontWeight="600" color="var(--primary-teal)">
                          {item.percentage.toFixed(1)}%
                        </Text>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              </Box>

              {/* Status Breakdown */}
              <Box className="breakdown-section">
                <Text className="breakdown-title" fontSize="md" fontWeight="600" color="var(--text-primary)" mb={4}>
                  By Status
                </Text>
                <VStack spacing={3} align="stretch">
                  {statusBreakdown.map((item) => (
                    <HStack key={item.status} justify="space-between">
                      <Text
                        className="breakdown-label"
                        fontSize="sm"
                        color={
                          item.status === 'paid' ? 'var(--success)' :
                          item.status === 'pending' ? 'var(--warning)' :
                          'var(--danger)'
                        }
                        fontWeight="500"
                      >
                        {item.status}
                      </Text>
                      <HStack spacing={4}>
                        <Text className="breakdown-amount" fontSize="sm" color="var(--text-secondary)">
                          {accountsService.formatCurrency(item.amount)}
                        </Text>
                        <Text className="breakdown-count" fontSize="sm" color="var(--text-secondary)">
                          {item.count}
                        </Text>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              </Box>

              {/* Top Expenses */}
              <Box className="breakdown-section">
                <Text className="breakdown-title" fontSize="md" fontWeight="600" color="var(--text-primary)" mb={4}>
                  Top 5 Expenses
                </Text>
                <VStack spacing={3} align="stretch">
                  {expenses
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 5)
                    .map((expense, index) => (
                      <HStack key={expense.id} justify="space-between" p={3} borderRadius="md" border="1px solid" borderColor={borderColor}>
                        <VStack align="start" spacing={1}>
                          <Text className="expense-description" fontSize="sm" fontWeight="500" color="var(--text-primary)">
                            {expense.description}
                          </Text>
                          <Text className="expense-category" fontSize="xs" color="var(--text-secondary)">
                            {expense.category}
                          </Text>
                        </VStack>
                        <Text className="expense-amount" fontSize="sm" fontWeight="600" color="var(--warning)">
                          {accountsService.formatCurrency(expense.amount)}
                        </Text>
                      </HStack>
                    ))}
                </VStack>
              </Box>
            </VStack>
          </SimpleGrid>
        </>
      )}
    </Box>
  );
};

export default ExpenseAnalysis;