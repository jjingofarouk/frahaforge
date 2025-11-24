// src/renderer/components/suppliers/utils/formatters.ts
export const formatCurrency = (amount: number | string): string => {
  try {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `UGX ${value.toLocaleString('en-UG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  } catch (error) {
    return `UGX ${amount}`;
  }
};

export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};