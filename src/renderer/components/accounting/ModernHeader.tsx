// src/renderer/components/accounting/ModernHeader.tsx
import React from 'react';
import { Box, Flex, Button, Input, HStack, Text, VStack, Badge } from '@chakra-ui/react';
import { Download, Calendar, RefreshCw, Clock } from 'lucide-react';
import { accountsService } from '../../services/accountsService';
import './ModernHeader.css';

interface DateRange {
  start: Date;
  end: Date;
}

interface ModernHeaderProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
  onExport: () => void;
  transactionCount: number;
  loading: boolean;
  title?: string;
  subtitle?: string;
}

const ensureDate = (date: any): Date => {
  if (date instanceof Date && !isNaN(date.getTime())) return date;
  const d = new Date(date);
  return !isNaN(d.getTime()) ? d : new Date();
};

const formatDateForInput = (date: any): string => {
  return ensureDate(date).toISOString().split('T')[0];
};

const formatDisplayDate = (date: any): string => {
  return ensureDate(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatTime = (date: any): string => {
  return ensureDate(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const ModernHeader: React.FC<ModernHeaderProps> = ({
  dateRange,
  onDateRangeChange,
  onExport,
  transactionCount,
  loading,
  title = "Business Analytics",
  subtitle
}) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date());
  const [selectedQuickRange, setSelectedQuickRange] = React.useState<string>('today');
  const [customStartDate, setCustomStartDate] = React.useState<string>('');
  const [customEndDate, setCustomEndDate] = React.useState<string>('');

  const safeStart = ensureDate(dateRange.start);
  const safeEnd = ensureDate(dateRange.end);

  React.useEffect(() => {
    setCustomStartDate(formatDateForInput(safeStart));
    setCustomEndDate(formatDateForInput(safeEnd));
  }, [safeStart, safeEnd]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = new Date(e.target.value);
    setCustomStartDate(e.target.value);
    if (!isNaN(newStart.getTime())) {
      const start = startOfDay(newStart);
      const end = safeEnd < start ? startOfDay(newStart) : safeEnd;
      onDateRangeChange({ start, end });
      setSelectedQuickRange('custom');
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = new Date(e.target.value);
    setCustomEndDate(e.target.value);
    if (!isNaN(newEnd.getTime())) {
      const end = endOfDay(newEnd);
      const start = safeStart > end ? startOfDay(newEnd) : safeStart;
      onDateRangeChange({ start, end });
      setSelectedQuickRange('custom');
    }
  };

  const applyCustomRange = () => {
    const start = startOfDay(new Date(customStartDate));
    const end = endOfDay(new Date(customEndDate));
    if (start > end) return;
    onDateRangeChange({ start, end });
    setSelectedQuickRange('custom');
  };

  const applyQuickRange = (rangeKey: string) => {
    const end = new Date();
    let start = new Date();
    switch (rangeKey) {
      case 'today': start = startOfDay(end); break;
      case 'week': start.setDate(start.getDate() - 7); start = startOfDay(start); break;
      case 'month': start.setDate(start.getDate() - 30); start = startOfDay(start); break;
      case 'quarter': start.setDate(start.getDate() - 90); start = startOfDay(start); break;
    }
    const rangeEnd = endOfDay(end);
    onDateRangeChange({ start, end: rangeEnd });
    setSelectedQuickRange(rangeKey);
    setCustomStartDate(formatDateForInput(start));
    setCustomEndDate(formatDateForInput(rangeEnd));
  };

  // Fixed: Use existing manualRefresh instead of non-existent forceRefreshAll
  const handleGlobalRefresh = async () => {
    setRefreshing(true);
    try {
      await accountsService.manualRefresh(); // This method exists
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const displaySubtitle = subtitle || (loading ? 'Loading...' : `${transactionCount} transactions • ${formatDisplayDate(safeStart)} - ${formatDisplayDate(safeEnd)}`);

  return (
    <Box className="modern-accounting-header">
      <Flex className="modern-header__main" justify="space-between" align="flex-start">
        <VStack align="flex-start" spacing={1}>
          <Text className="modern-header__title">{title}</Text>
          <Text className="modern-header__subtitle">{displaySubtitle}</Text>
        </VStack>

        <VStack align="flex-end" spacing={3}>
          <Box className="modern-header__live-status">
            <Flex align="center" gap={2}>
              <Box className="live-status__indicator">
                <Box className="live-dot live"></Box>
                <Box className="live-dot pulse"></Box>
              </Box>
              <Text className="live-status__text">Live Data</Text>
              <Clock size={12} />
              <Text className="live-status__timestamp">
                Updated {formatTime(lastUpdated)}
              </Text>
            </Flex>
          </Box>

          <HStack spacing={3}>
            <Button
              variant="outline"
              onClick={handleGlobalRefresh}
              size="sm"
              isLoading={refreshing}
              isDisabled={loading}
              leftIcon={<RefreshCw size={16} className={refreshing ? 'spin' : ''} />}
            >
              Refresh All
            </Button>
            <Button
              colorScheme="teal"
              onClick={onExport}
              isDisabled={loading || transactionCount === 0}
              leftIcon={<Download size={16} />}
            >
              Export CSV
            </Button>
          </HStack>
        </VStack>
      </Flex>

      {/* Date Controls */}
      <Box className="modern-header__date-controls" mt={6}>
        <Flex gap={6} align="flex-end">
          <Box flex={1}>
            <Text className="date-controls__label">Quick Ranges</Text>
            <HStack spacing={2} mt={2}>
              {['today', 'week', 'month', 'quarter'].map(key => (
                <Button
                  key={key}
                  size="sm"
                  variant={selectedQuickRange === key ? 'solid' : 'outline'}
                  colorScheme={selectedQuickRange === key ? 'teal' : undefined}
                  onClick={() => applyQuickRange(key)}
                  isDisabled={loading}
                >
                  {key === 'today' ? 'Today' : key === 'week' ? 'Last 7 Days' : key === 'month' ? 'Last 30 Days' : 'Last 90 Days'}
                </Button>
              ))}
            </HStack>
          </Box>

          <Box>
            <Text className="date-controls__label">Custom Range</Text>
            <HStack spacing={3} mt={2}>
              <Input type="date" value={customStartDate} onChange={handleStartDateChange} size="sm" max={customEndDate} />
              <Input type="date" value={customEndDate} onChange={handleEndDateChange} size="sm" min={customStartDate} />
              <Button size="sm" leftIcon={<Calendar size={16} />} onClick={applyCustomRange} isDisabled={loading}>
                Apply
              </Button>
            </HStack>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default ModernHeader;