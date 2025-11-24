// src/renderer/src/components/accounting/utils/dateUtils.ts

export interface StringDateRange {
  startDate: string;
  endDate: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Converts a DateRange object with Date objects to StringDateRange with ISO date strings
 * @param dateRange - Object with start and end Date objects
 * @returns Object with startDate and endDate as ISO date strings (YYYY-MM-DD)
 */
export const convertToStringDateRange = (dateRange: DateRange): StringDateRange => {
  // Ensure we're working with proper Date objects
  const start = dateRange.start instanceof Date ? dateRange.start : new Date(dateRange.start);
  const end = dateRange.end instanceof Date ? dateRange.end : new Date(dateRange.end);
  
  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error('Invalid date range:', dateRange);
    // Return today's date as fallback
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return {
      startDate: todayStr,
      endDate: todayStr
    };
  }
  
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
};

/**
 * Converts string date range to DateRange with Date objects
 * @param stringDateRange - Object with startDate and endDate as strings
 * @returns Object with start and end Date objects
 */
export const convertToDateRange = (stringDateRange: StringDateRange): DateRange => {
  return {
    start: new Date(stringDateRange.startDate),
    end: new Date(stringDateRange.endDate)
  };
};

/**
 * Formats a Date object to a readable string
 * @param date - Date object to format
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Gets today's date range (start and end of day)
 * @returns DateRange for today
 */
export const getTodayDateRange = (): DateRange => {
  const today = new Date();
  return {
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
  };
};

/**
 * Gets this week's date range (last 7 days)
 * @returns DateRange for this week
 */
export const getThisWeekDateRange = (): DateRange => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * Gets this month's date range (last 30 days)
 * @returns DateRange for this month
 */
export const getThisMonthDateRange = (): DateRange => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * Gets this year's date range
 * @returns DateRange for this year
 */
export const getThisYearDateRange = (): DateRange => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
    end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
  };
};

/**
 * Checks if two date ranges are equal
 * @param range1 - First date range
 * @param range2 - Second date range
 * @returns True if ranges are equal
 */
export const areDateRangesEqual = (range1: DateRange, range2: DateRange): boolean => {
  return (
    range1.start.getTime() === range2.start.getTime() &&
    range1.end.getTime() === range2.end.getTime()
  );
};

/**
 * Gets the number of days between two dates
 * @param start - Start date
 * @param end - End date
 * @returns Number of days
 */
export const getDaysBetween = (start: Date, end: Date): number => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((utcEnd - utcStart) / msPerDay);
};