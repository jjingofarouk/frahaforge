// src/renderer/components/accounting/AccountingPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Skeleton,
  SimpleGrid,
} from '@chakra-ui/react';
import { ModernChakraProvider } from '../transactions/modern-dashboard/ChakraProvider';
import ModernHeader from './ModernHeader';
import ModernCharts from '../transactions/components/ModernCharts/ModernCharts';
import DashboardOverview from './dashboard/DashboardOverview';
import { useInstantTransactions } from '../../src/hooks/useInstantTransactions';
import { convertToStringDateRange, StringDateRange } from './utils/dateUtils';
import { useUltraFastAccountingStore } from '../../src/stores/ultraFastAccountingStore';
import { accountsService, Expense } from '../../services/accountsService';

import ProductSalesPerformance from './revenue/ProductSalesPerformance';
import ExpenseTracker from './expenses/ExpenseTracker';
import './AccountingPage.css';

interface AccountingPageProps {
  user: any;
}

// Define proper types for chart data
interface SalesData {
  date: string;
  sales: number;
}

interface PaymentData {
  name: string;
  value: number;
}

interface CategoryData {
  name: string;
  sales: number;
  abbreviatedName: string;
}

interface ProfitData {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
}

interface CashierData {
  name: string;
  sales: number;
  transactions: number;
  avgTransaction: number;
}

interface ChartData {
  salesData: SalesData[];
  paymentData: PaymentData[];
  categoryData: CategoryData[];
  topCustomersData: any[];
  hourlyData: any[];
  profitData: ProfitData[];
  inventoryData: any[];
  cashierData: CashierData[];
  products: any[];
  customersDue: any[];
  transactions: any[];
  expenses: Expense[];
}

const AccountingPage: React.FC<AccountingPageProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const store = useUltraFastAccountingStore();
  const dateRange = store.currentDateRange;

  const {
    data: transactions,
    isLoading: transactionsLoading,
    hasCachedData,
  } = useInstantTransactions({
    dateRange,
    enableBackgroundRefresh: true,
  });

  // Load expenses data
  useEffect(() => {
    const loadExpenses = async () => {
      setExpensesLoading(true);
      try {
        const result = await accountsService.getExpenses({
          startDate: dateRange.start?.toISOString().split('T')[0],
          endDate: dateRange.end?.toISOString().split('T')[0],
        });
        if (result.success) {
          setExpenses(result.data || []);
        }
      } catch (error) {
        console.error('Failed to load expenses:', error);
      } finally {
        setExpensesLoading(false);
      }
    };

    if (dateRange.start && dateRange.end) {
      loadExpenses();
    }
  }, [dateRange]);

  useEffect(() => {
    if (!dateRange.start || !(dateRange.start instanceof Date)) {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      store.setDateRange({ start, end });
    }
  }, [store, dateRange.start]);

  const stringDateRange: StringDateRange = convertToStringDateRange(dateRange);

  const chartData = useMemo((): ChartData => {
    if (!transactions || transactions.length === 0) {
      return {
        salesData: [],
        paymentData: [],
        categoryData: [],
        topCustomersData: [],
        hourlyData: [],
        profitData: [],
        inventoryData: [],
        cashierData: [],
        products: [],
        customersDue: [],
        transactions: [],
        expenses: expenses,
      };
    }

    const salesMap = transactions.reduce((acc: Record<string, number>, t: any) => {
      const date = new Date(t.created_at).toLocaleDateString('en-CA');
      acc[date] = (acc[date] || 0) + t.total;
      return acc;
    }, {});

    const salesData: SalesData[] = Object.entries(salesMap)
      .map(([date, sales]) => ({ date, sales: sales as number }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const paymentMap = transactions.reduce((acc: Record<string, number>, t: any) => {
      const method = t.payment_type || 'Cash';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    const paymentData: PaymentData[] = Object.entries(paymentMap).map(([name, value]) => ({ name, value: value as number }));

    const cashierMap = transactions.reduce((acc: any, t: any) => {
      const name = t.user_name || 'Unknown';
      if (!acc[name]) acc[name] = { sales: 0, transactions: 0 };
      acc[name].sales += t.total;
      acc[name].transactions += 1;
      return acc;
    }, {});

    const cashierData: CashierData[] = Object.entries(cashierMap)
      .map(([name, data]: any) => ({
        name,
        sales: data.sales,
        transactions: data.transactions,
        avgTransaction: data.transactions > 0 ? data.sales / data.transactions : 0,
      }))
      .sort((a: any, b: any) => b.sales - a.sales);

    // Process category data from transaction items
    const categoryMap = transactions.reduce((acc: Record<string, number>, transaction: any) => {
      if (transaction.items) {
        transaction.items.forEach((item: any) => {
          const category = item.category || 'General';
          acc[category] = (acc[category] || 0) + (item.price * item.quantity);
        });
      }
      return acc;
    }, {});

    const categoryData: CategoryData[] = Object.entries(categoryMap).map(([name, sales]) => ({
      name,
      sales: sales as number,
      abbreviatedName: abbreviateCategoryName(name)
    }));

    // Process profit data
    const profitMap = transactions.reduce((acc: Record<string, { revenue: number; cost: number; profit: number }>, t: any) => {
      const date = new Date(t.created_at).toLocaleDateString('en-CA');
      if (!acc[date]) {
        acc[date] = { revenue: 0, cost: 0, profit: 0 };
      }
      const estimatedCost = t.total * 0.6; // 60% cost estimation
      acc[date].revenue += t.total;
      acc[date].cost += estimatedCost;
      acc[date].profit += t.total - estimatedCost;
      return acc;
    }, {});

    const profitData: ProfitData[] = Object.entries(profitMap)
      .map(([date, data]) => ({
        date,
        ...data
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      salesData,
      paymentData,
      categoryData,
      topCustomersData: [],
      hourlyData: [],
      profitData,
      inventoryData: [],
      cashierData,
      products: [],
      customersDue: [],
      transactions,
      expenses: expenses,
    };
  }, [transactions, expenses]);

  // Helper function to abbreviate category names
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

  const showSkeleton = (transactionsLoading && !hasCachedData) || expensesLoading;

  const getHeaderProps = () => {
    const start = stringDateRange.startDate;
    const end = stringDateRange.endDate;

    switch (activeTab) {
      case 0:
        return {
          title: 'Business Analytics',
          subtitle: showSkeleton
            ? 'Loading data...'
            : `${transactions?.length || 0} transactions • ${expenses.length} expenses • ${start} to ${end}`,
          transactionCount: transactions?.length || 0,
        };
      case 1:
        return {
          title: 'Revenue & Sales Performance',
          subtitle: `Sales analysis • ${start} to ${end}`,
          transactionCount: transactions?.length || 0,
        };
      default:
        return { title: '', subtitle: '', transactionCount: 0 };
    }
  };

  const headerProps = getHeaderProps();

  return (
    <ModernChakraProvider>
      <Box className="accounting-dashboard" bg="var(--bg-gray)" minH="100vh">
        <Tabs
          variant="unstyled"
          index={activeTab}
          onChange={setActiveTab}
          isLazy
          lazyBehavior="unmount"
        >
          {/* TOP STICKY TAB BAR */}
          <Box
            className="accounting-tabs-header"
            position="sticky"
            top={0}
            zIndex={50}
            bg="var(--bg-surface)"
            borderBottom="1px solid var(--border-color)"
            backdropFilter="blur(12px)"
          >
            <TabList px={{ base: 4, md: 6 }} py={4} gap={{ base: 4, md: 8 }}>
              {['Dashboard', 'Revenue & Sales', 'Expenses'].map((title, i) => (
                <Tab
                  key={i}
                  px={6}
                  py={3}
                  fontSize="sm"
                  fontWeight="600"
                  color={activeTab === i ? 'white' : 'var(--text-secondary)'}
                  bg={activeTab === i ? 'var(--primary-teal)' : 'transparent'}
                  borderRadius="8px"
                  _hover={{
                    bg: activeTab === i ? 'var(--primary-teal-dark)' : 'var(--secondary-gray)',
                  }}
                  transition="all 0.2s"
                >
                  {title}
                </Tab>
              ))}
            </TabList>
          </Box>

          <TabPanels>
            {/* Dashboard Tab */}
            <TabPanel p={0} pt={6}>
              {activeTab !== 2 && (
                <Box mb={8}>
                  <ModernHeader
                    dateRange={dateRange}
                    onDateRangeChange={store.setDateRange}
                    onExport={() => console.log('Export triggered')}
                    transactionCount={headerProps.transactionCount}
                    loading={showSkeleton}
                    title={headerProps.title}
                    subtitle={headerProps.subtitle}
                  />
                </Box>
              )}

              {/* Dashboard Overview - Financial Summary */}
              <Box mb={8}>
                <DashboardOverview
                  startDate={stringDateRange.startDate}
                  endDate={stringDateRange.endDate}
                  transactions={transactions || []}
                  expenses={expenses}
                  loading={showSkeleton}
                />
              </Box>

              {showSkeleton ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {[...Array(6)].map((_, i) => (
                    <Box
                      key={i}
                      bg="var(--bg-surface)"
                      p={6}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="var(--border-color)"
                    >
                      <Skeleton height="24px" width="70%" mb={4} />
                      <Skeleton height="200px" borderRadius="md" />
                    </Box>
                  ))}
                </SimpleGrid>
              ) : (
                <ModernCharts {...chartData} />
              )}
            </TabPanel>

            {/* Revenue & Sales Tab */}
            <TabPanel p={0} pt={6}>
              {activeTab !== 2 && (
                <Box mb={8}>
                  <ModernHeader
                    dateRange={dateRange}
                    onDateRangeChange={store.setDateRange}
                    onExport={() => console.log('Export triggered')}
                    transactionCount={headerProps.transactionCount}
                    loading={transactionsLoading && !hasCachedData}
                    title={headerProps.title}
                    subtitle={headerProps.subtitle}
                  />
                </Box>
              )}
              <ProductSalesPerformance
                startDate={stringDateRange.startDate}
                endDate={stringDateRange.endDate}
                transactions={transactions || []}
                loading={transactionsLoading && !hasCachedData}
              />
            </TabPanel>

            {/* Expenses Tab */}
            <TabPanel p={0} pt={0}>
              <ExpenseTracker 
                expenses={expenses}
                onExpensesUpdate={setExpenses}
                dateRange={dateRange}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </ModernChakraProvider>
  );
};

export default AccountingPage;