import { useCallback } from 'react';

interface Transaction {
  id: string;
  order: number;
  customer: any;
  date: string;
  total: string;
  paid: string;
  payment_type: string;
  user: string;
  till: number;
}

export const useExport = () => {
  const exportToCSV = useCallback((transactions: Transaction[], getCustomerName: (customer: any) => string) => {
    const headers = ['Invoice', 'Date', 'Customer', 'Total', 'Paid', 'Due', 'Method', 'Cashier', 'Till'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(txn => [
        txn.order,
        new Date(txn.date).toLocaleDateString(),
        getCustomerName(txn.customer),
        parseFloat(txn.total || '0').toFixed(2),
        parseFloat(txn.paid || '0').toFixed(2),
        (parseFloat(txn.total || '0') - parseFloat(txn.paid || '0')).toFixed(2),
        txn.payment_type,
        txn.user,
        txn.till
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }, []);

  return { exportToCSV };
};