// src/renderer/src/utils/ugandaTime.ts
/**
 * Uganda Timezone Utilities (UTC+3)
 * Handles all date conversions between UTC (database) and Uganda time (UI)
 */

// Uganda is UTC+3 (East Africa Time)
const UGANDA_UTC_OFFSET = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

/**
 * Convert UTC date to Uganda time (UTC+3) for display
 */
export function convertUTCToUganda(utcDate: string | Date): Date {
  const date = new Date(utcDate);
  return new Date(date.getTime() + UGANDA_UTC_OFFSET);
}

/**
 * Convert Uganda time to UTC for database storage
 */
export function convertUgandaToUTC(ugandaDate: string | Date): Date {
  const date = new Date(ugandaDate);
  return new Date(date.getTime() - UGANDA_UTC_OFFSET);
}

/**
 * Format UTC date for Uganda display
 */
export function formatDateForUgandaDisplay(date: string | Date): string {
  const ugandaDate = convertUTCToUganda(date);
  return ugandaDate.toLocaleString('en-UG', {
    timeZone: 'Africa/Kampala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Format date for API queries (UTC)
 */
export function formatDateForAPI(date: string | Date): string {
  const utcDate = date instanceof Date ? date : new Date(date);
  return utcDate.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Format Uganda date for API (convert to UTC date string)
 */
export function formatUgandaDateForAPI(ugandaDate: string | Date): string {
  const utcDate = convertUgandaToUTC(ugandaDate);
  return utcDate.toISOString().split('T')[0];
}

/**
 * Get current Uganda time
 */
export function getCurrentUgandaTime(): Date {
  return new Date(Date.now() + UGANDA_UTC_OFFSET);
}

/**
 * Get Uganda date range from date strings (for filtering)
 */
export function getUgandaDateRangeForAPI(startDate: string, endDate: string): { startDateUTC: string; endDateUTC: string } {
  // Create Uganda time dates
  const ugandaStart = new Date(startDate + 'T00:00:00+03:00');
  const ugandaEnd = new Date(endDate + 'T23:59:59+03:00');
  
  // Convert to UTC for API
  const startDateUTC = formatDateForAPI(ugandaStart);
  const endDateUTC = formatDateForAPI(ugandaEnd);
  
  return { startDateUTC, endDateUTC };
}

/**
 * Get today's Uganda date range for API
 */
export function getTodayUgandaRangeForAPI(): { startDateUTC: string; endDateUTC: string } {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  return getUgandaDateRangeForAPI(todayStr, todayStr);
}

/**
 * Format receipt date in Uganda time
 */
export function formatReceiptDate(utcDate: string | Date): string {
  const ugandaDate = convertUTCToUganda(utcDate);
  return ugandaDate.toLocaleString('en-UG', {
    timeZone: 'Africa/Kampala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Check if a date is today in Uganda time
 */
export function isTodayInUganda(date: string | Date): boolean {
  const ugandaDate = convertUTCToUganda(date);
  const todayUganda = getCurrentUgandaTime();
  
  return ugandaDate.toDateString() === todayUganda.toDateString();
}

/**
 * Get Uganda time display for transactions
 */
export function getUgandaTimeDisplay(utcDate: string | Date): {
  date: string;
  time: string;
  full: string;
} {
  const ugandaDate = convertUTCToUganda(utcDate);
  
  const date = ugandaDate.toLocaleDateString('en-UG', {
    timeZone: 'Africa/Kampala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const time = ugandaDate.toLocaleTimeString('en-UG', {
    timeZone: 'Africa/Kampala',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return {
    date,
    time,
    full: `${date} ${time}`
  };
}

/**
 * Format currency for display (UGX)
 */
export function formatCurrency(amount: number | string | undefined | null): string {
  if (!amount && amount !== 0) return 'UGX 0';
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numValue)) return 'UGX 0';
  
  // Round to nearest 100
  const rounded = Math.round(Number(numValue) / 100) * 100;
  return `UGX ${rounded.toLocaleString('en-UG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}