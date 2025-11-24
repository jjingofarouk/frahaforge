// src/renderer/src/utils/ugandaTime.ts
/**
 * Uganda Timezone Utilities (UTC+3)
 * Handles all date conversions between local browser time and Uganda time
 */

// Uganda is UTC+3 (East Africa Time)
const UGANDA_UTC_OFFSET = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

/**
 * Convert a local date to Uganda time start of day (00:00:00 Uganda time)
 */
export const getUgandaStartOfDay = (date: Date): Date => {
  // Create a date at 00:00:00 in Uganda time (UTC+3)
  const ugandaMidnight = new Date(date);
  ugandaMidnight.setHours(0, 0, 0, 0);
  
  // Convert Uganda time to UTC by subtracting 3 hours
  const utcStart = new Date(ugandaMidnight.getTime() - UGANDA_UTC_OFFSET);
  return utcStart;
};

/**
 * Convert a local date to Uganda time end of day (23:59:59.999 Uganda time)
 */
export const getUgandaEndOfDay = (date: Date): Date => {
  // Create a date at 23:59:59.999 in Uganda time (UTC+3)
  const ugandaEnd = new Date(date);
  ugandaEnd.setHours(23, 59, 59, 999);
  
  // Convert Uganda time to UTC by subtracting 3 hours
  const utcEnd = new Date(ugandaEnd.getTime() - UGANDA_UTC_OFFSET);
  return utcEnd;
};

/**
 * Format date for API (YYYY-MM-DD) in Uganda time
 */
export const formatDateForUgandaAPI = (date: Date): string => {
  // Convert to Uganda time for display purposes
  const ugandaDate = new Date(date.getTime() + UGANDA_UTC_OFFSET);
  return ugandaDate.toISOString().split('T')[0];
};

/**
 * Convert UTC date from API to Uganda time for display
 */
export const convertUTCToUgandaTime = (utcDateString: string): Date => {
  const utcDate = new Date(utcDateString);
  return new Date(utcDate.getTime() + UGANDA_UTC_OFFSET);
};

/**
 * Get today's date range in Uganda time
 */
export const getTodayUgandaRange = (): { start: Date; end: Date } => {
  const today = new Date();
  return {
    start: getUgandaStartOfDay(today),
    end: getUgandaEndOfDay(today)
  };
};

/**
 * Create a Uganda date from YYYY-MM-DD string
 */
export const createUgandaDate = (dateString: string): Date => {
  // Parse the date string and set it to Uganda time
  const date = new Date(dateString + 'T00:00:00+03:00');
  return date;
};

/**
 * Get Uganda date range from start and end date strings
 */
export const getUgandaDateRange = (startDate: string, endDate: string): { start: Date; end: Date } => {
  return {
    start: getUgandaStartOfDay(createUgandaDate(startDate)),
    end: getUgandaEndOfDay(createUgandaDate(endDate))
  };
};

/**
 * Get Uganda date range from Date objects
 */
export const getUgandaDateRangeFromDates = (startDate: Date, endDate: Date): { start: Date; end: Date } => {
  return {
    start: getUgandaStartOfDay(startDate),
    end: getUgandaEndOfDay(endDate)
  };
};

/**
 * Check if a UTC date falls within a Uganda date range
 */
export const isDateInUgandaRange = (utcDate: Date, ugandaStart: Date, ugandaEnd: Date): boolean => {
  return utcDate >= ugandaStart && utcDate <= ugandaEnd;
};