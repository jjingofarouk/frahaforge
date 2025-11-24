// src/renderer/components/accounting/shared/DateRangeSelector.tsx
import React from 'react';
import { Box, HStack, Button, Text, useColorModeValue } from '@chakra-ui/react';
import './DateRangeSelector.css';

interface DateRangeSelectorProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  onDateRangeChange: (range: { startDate: string; endDate: string }) => void;
  presets?: Array<{
    label: string;
    startDate: string;
    endDate: string;
  }>;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ 
  dateRange, 
  onDateRangeChange,
  presets = [
    { label: 'Today', startDate: getToday(), endDate: getToday() },
    { label: 'Yesterday', startDate: getYesterday(), endDate: getYesterday() },
    { label: 'This Week', startDate: getThisWeekStart(), endDate: getToday() },
    { label: 'Last Week', startDate: getLastWeekStart(), endDate: getLastWeekEnd() },
    { label: 'This Month', startDate: getThisMonthStart(), endDate: getToday() },
    { label: 'Last Month', startDate: getLastMonthStart(), endDate: getLastMonthEnd() },
    { label: 'This Quarter', startDate: getThisQuarterStart(), endDate: getToday() },
    { label: 'Last Quarter', startDate: getLastQuarterStart(), endDate: getLastQuarterEnd() },
    { label: 'This Year', startDate: getThisYearStart(), endDate: getToday() },
    { label: 'Last Year', startDate: getLastYearStart(), endDate: getLastYearEnd() },
  ]
}) => {
  const buttonBg = useColorModeValue('var(--bg-surface)', 'var(--bg-surface)');
  const buttonBorder = useColorModeValue('var(--border-color)', 'var(--border-color)');
  const activeBg = useColorModeValue('var(--primary-teal)', 'var(--primary-teal)');
  const activeColor = useColorModeValue('white', 'white');

  const isPresetActive = (preset: { startDate: string; endDate: string }) => {
    return dateRange.startDate === preset.startDate && dateRange.endDate === preset.endDate;
  };

  const handlePresetClick = (preset: { startDate: string; endDate: string }) => {
    onDateRangeChange({
      startDate: preset.startDate,
      endDate: preset.endDate
    });
  };

  const formatDateDisplay = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Box className="date-range-selector">
      {/* Date Range Display */}
      <Box className="date-range-display" mb={3}>
        <Text className="date-range-text" fontSize="sm" color="var(--text-secondary)">
          {formatDateDisplay(dateRange.startDate)} - {formatDateDisplay(dateRange.endDate)}
        </Text>
      </Box>

      {/* Quick Presets */}
      <Box className="presets-container">
        <HStack spacing={2} flexWrap="wrap">
          {presets.map((preset, index) => (
            <Button
              key={index}
              className={`preset-btn ${isPresetActive(preset) ? 'active' : ''}`}
              size="xs"
              variant={isPresetActive(preset) ? 'solid' : 'outline'}
              colorScheme="teal"
              onClick={() => handlePresetClick(preset)}
              bg={isPresetActive(preset) ? activeBg : buttonBg}
              color={isPresetActive(preset) ? activeColor : 'var(--text-primary)'}
              borderColor={buttonBorder}
              _hover={{
                bg: isPresetActive(preset) ? activeBg : 'var(--secondary-gray)'
              }}
            >
              {preset.label}
            </Button>
          ))}
        </HStack>
      </Box>

      {/* Custom Date Inputs */}
      <HStack spacing={3} mt={3}>
        <Box className="date-input-group" flex={1}>
          <Text className="date-label" fontSize="xs" color="var(--text-secondary)" mb={1}>
            From
          </Text>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => onDateRangeChange({
              ...dateRange,
              startDate: e.target.value
            })}
            className="date-input"
          />
        </Box>
        <Box className="date-input-group" flex={1}>
          <Text className="date-label" fontSize="xs" color="var(--text-secondary)" mb={1}>
            To
          </Text>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => onDateRangeChange({
              ...dateRange,
              endDate: e.target.value
            })}
            className="date-input"
          />
        </Box>
      </HStack>
    </Box>
  );
};

// Helper functions for date calculations
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

function getThisWeekStart(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function getLastWeekStart(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day - 6 + (day === 0 ? -6 : 1);
  const lastMonday = new Date(today.setDate(diff));
  return lastMonday.toISOString().split('T')[0];
}

function getLastWeekEnd(): string {
  const lastSunday = new Date(getLastWeekStart());
  lastSunday.setDate(lastSunday.getDate() + 6);
  return lastSunday.toISOString().split('T')[0];
}

function getThisMonthStart(): string {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
}

function getLastMonthStart(): string {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
}

function getLastMonthEnd(): string {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
}

function getThisQuarterStart(): string {
  const today = new Date();
  const quarter = Math.floor(today.getMonth() / 3);
  return new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
}

function getLastQuarterStart(): string {
  const today = new Date();
  const quarter = Math.floor(today.getMonth() / 3);
  const lastQuarter = quarter === 0 ? 3 : quarter - 1;
  const year = quarter === 0 ? today.getFullYear() - 1 : today.getFullYear();
  return new Date(year, lastQuarter * 3, 1).toISOString().split('T')[0];
}

function getLastQuarterEnd(): string {
  const lastQuarterStart = new Date(getLastQuarterStart());
  lastQuarterStart.setMonth(lastQuarterStart.getMonth() + 3);
  lastQuarterStart.setDate(0);
  return lastQuarterStart.toISOString().split('T')[0];
}

function getThisYearStart(): string {
  const today = new Date();
  return new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
}

function getLastYearStart(): string {
  const today = new Date();
  return new Date(today.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
}

function getLastYearEnd(): string {
  const today = new Date();
  return new Date(today.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
}

export default DateRangeSelector;