// Alternative PrescriptionOTCChart.tsx - Simplified version
import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction } from '../../../../services/transactionsService';

interface PrescriptionOTCChartProps {
  transactions: Transaction[];
  products: any[];
}

const PrescriptionOTCChart: React.FC<PrescriptionOTCChartProps> = ({ transactions, products }) => {
  const processPrescriptionData = () => {
    const prescriptionData = {
      'OTC': { count: 0, amount: 0 },
      'Prescription': { count: 0, amount: 0 }
    };

    transactions.forEach(transaction => {
      if (transaction.items) {
        let hasPrescription = false;
        let transactionAmount = 0;

        transaction.items.forEach((item: any) => {
          const product = products.find(p => p.id === item.product_id);
          if (product?.prescription_required === 1) {
            hasPrescription = true;
          }
          transactionAmount += item.price * item.quantity;
        });

        if (hasPrescription) {
          prescriptionData['Prescription'].count += 1;
          prescriptionData['Prescription'].amount += transactionAmount;
        } else {
          prescriptionData['OTC'].count += 1;
          prescriptionData['OTC'].amount += transactionAmount;
        }
      }
    });

    return [
      {
        name: 'OTC',
        value: prescriptionData['OTC'].count,
        amount: prescriptionData['OTC'].amount
      },
      {
        name: 'Prescription',
        value: prescriptionData['Prescription'].count,
        amount: prescriptionData['Prescription'].amount
      }
    ];
  };

  const prescriptionData = processPrescriptionData();
  const pieColors = ['#0d9488', '#7c3aed'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Box className="chart-card" p={6} borderRadius="xl" bg="white" boxShadow="sm" border="1px solid #E2E8F0">
      <Text fontSize="lg" fontWeight="semibold" mb={4} color="#1e3a8a">
        Prescription vs OTC Sales
      </Text>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={prescriptionData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            dataKey="value"
          >
            {prescriptionData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string) => [
              name === 'value' ? `${value} transactions` : formatCurrency(value),
              name === 'value' ? 'Transactions' : 'Amount'
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PrescriptionOTCChart;