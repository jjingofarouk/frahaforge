// src/renderer/src/utils/formatUGX.ts
export const formatUGX = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return `UGX ${num.toLocaleString('en-UG', { minimumFractionDigits: 0 })}`;
};