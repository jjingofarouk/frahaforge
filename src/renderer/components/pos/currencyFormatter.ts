// src/renderer/src/utils/currencyFormatter.ts
export const formatUGX = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('en-UG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatUGXDecimal = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '0.00';
  
  return new Intl.NumberFormat('en-UG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};