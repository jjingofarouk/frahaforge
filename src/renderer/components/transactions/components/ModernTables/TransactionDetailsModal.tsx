// components/TransactionDetailsModal.tsx
import React from 'react';
import { 
  X, 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  ShoppingCart, 
  Tag,
  Printer
} from 'lucide-react';
import { 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Box,
  Text,
  Button,
  HStack,
  VStack,
  Badge,
  Divider,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { Transaction, TransactionItem } from '../../../../services/transactionsService';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  getCustomerName: (customerId: number) => string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getPaymentTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'cash':
      return <DollarSign size={16} />;
    case 'card':
      return <CreditCard size={16} />;
    case 'due':
      return <ShoppingCart size={16} />;
    default:
      return <DollarSign size={16} />;
  }
};

const getPaymentTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'cash':
      return { color: 'green.600', bg: 'green.50' };
    case 'card':
      return { color: 'blue.600', bg: 'blue.50' };
    case 'due':
      return { color: 'orange.600', bg: 'orange.50' };
    default:
      return { color: 'gray.600', bg: 'gray.50' };
  }
};

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  isOpen,
  onClose,
  getCustomerName
}) => {
  if (!transaction) return null;

  // Calculate amounts from real transaction data
  const subtotal = transaction.subtotal || 0;
  const discount = transaction.discount || 0;
  const tax = transaction.tax || 0;
  const total = transaction.total || 0;
  const paid = transaction.paid || 0;
  const change = transaction.change_amount || 0;
  const due = total - paid;

  const paymentTypeStyle = getPaymentTypeColor(transaction.payment_type);

  const handlePrintReceipt = () => {
    // Use the transactions service to generate and print receipt
    const receipt = `
FRAHA PHARMACY
Old Kampala, Uganda
0751360385

Receipt #: ${transaction.order_number}
Date: ${formatDate(transaction.created_at)}
Cashier: ${transaction.user_name}
Customer: ${getCustomerName(transaction.customer_id)}

ITEMS:
${transaction.items?.map(item => 
  `${item.product_name} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}`
).join('\n') || 'No items'}

Subtotal: ${formatCurrency(subtotal)}
Tax: ${formatCurrency(tax)}
Discount: ${formatCurrency(discount)}
Total: ${formatCurrency(total)}

Paid: ${formatCurrency(paid)}
Change: ${formatCurrency(change)}
Payment: ${transaction.payment_type}

Thank you for your business!
    `.trim();

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt #${transaction.order_number}</title>
            <style>
              body { font-family: monospace; margin: 20px; }
              .receipt { max-width: 300px; }
              .center { text-align: center; }
              .items { margin: 10px 0; }
              .total { border-top: 1px solid #000; padding-top: 5px; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="center">
                <h2>FRAHA PHARMACY</h2>
                <p>Old Kampala, Uganda<br>0751360385</p>
              </div>
              <p><strong>Receipt #:</strong> ${transaction.order_number}</p>
              <p><strong>Date:</strong> ${formatDate(transaction.created_at)}</p>
              <p><strong>Cashier:</strong> ${transaction.user_name}</p>
              <p><strong>Customer:</strong> ${getCustomerName(transaction.customer_id)}</p>
              
              <div class="items">
                <strong>ITEMS:</strong><br>
                ${transaction.items?.map(item => 
                  `${item.product_name} x${item.quantity}<br>${formatCurrency(item.price * item.quantity)}`
                ).join('<br>') || 'No items'}
              </div>
              
              <p><strong>Subtotal:</strong> ${formatCurrency(subtotal)}</p>
              <p><strong>Tax:</strong> ${formatCurrency(tax)}</p>
              <p><strong>Discount:</strong> ${formatCurrency(discount)}</p>
              <div class="total">
                <p><strong>Total:</strong> ${formatCurrency(total)}</p>
              </div>
              <p><strong>Paid:</strong> ${formatCurrency(paid)}</p>
              <p><strong>Change:</strong> ${formatCurrency(change)}</p>
              <p><strong>Payment:</strong> ${transaction.payment_type}</p>
              <div class="center">
                <p><em>Thank you for your business!</em></p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        {/* Header */}
        <ModalHeader borderBottom="1px solid" borderColor="gray.200">
          <HStack justify="space-between" align="center">
            <HStack spacing={3}>
              <Box p={2} bg="blue.50" borderRadius="lg">
                <FileText size={24} color="#3182ce" />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="xl" fontWeight="bold" color="gray.800">
                  Transaction Details
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Invoice #{transaction.order_number}
                </Text>
              </VStack>
            </HStack>
            <Button
              variant="ghost"
              onClick={onClose}
              size="sm"
            >
              <X size={20} />
            </Button>
          </HStack>
        </ModalHeader>

        {/* Body */}
        <ModalBody py={6}>
          <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
            {/* Left Column - Transaction Information */}
            <VStack spacing={6} align="stretch">
              {/* Customer & Basic Info */}
              <Grid templateColumns="1fr 1fr" gap={4}>
                <Box p={4} bg="gray.50" borderRadius="lg">
                  <HStack spacing={2} mb={2}>
                    <User size={16} color="#6b7280" />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Customer
                    </Text>
                  </HStack>
                  <Text fontSize="md" fontWeight="semibold" color="gray.900">
                    {getCustomerName(transaction.customer_id)}
                  </Text>
                </Box>

                <Box p={4} bg="gray.50" borderRadius="lg">
                  <HStack spacing={2} mb={2}>
                    <Calendar size={16} color="#6b7280" />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Date & Time
                    </Text>
                  </HStack>
                  <Text fontSize="md" fontWeight="semibold" color="gray.900">
                    {formatDate(transaction.created_at)}
                  </Text>
                </Box>

                <Box p={4} bg="gray.50" borderRadius="lg">
                  <HStack spacing={2} mb={2}>
                    <User size={16} color="#6b7280" />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Cashier
                    </Text>
                  </HStack>
                  <Text fontSize="md" fontWeight="semibold" color="gray.900">
                    {transaction.user_name}
                  </Text>
                </Box>

                <Box p={4} bg="gray.50" borderRadius="lg">
                  <HStack spacing={2} mb={2}>
                    <Tag size={16} color="#6b7280" />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Till
                    </Text>
                  </HStack>
                  <Text fontSize="md" fontWeight="semibold" color="gray.900">
                    #{transaction.till}
                  </Text>
                </Box>
              </Grid>

              {/* Items List */}
              <Box p={4} bg="gray.50" borderRadius="lg">
                <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.800">
                  Items Purchased
                </Text>
                <VStack spacing={3} align="stretch">
                  {transaction.items?.map((item, index) => (
                    <Box key={item.id || index} py={2} borderBottom="1px solid" borderColor="gray.200" _last={{ borderBottom: "none" }}>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium" color="gray.900">
                            {item.product_name}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            {item.category} • {item.quantity} × {formatCurrency(item.price)}
                          </Text>
                        </VStack>
                        <Text fontWeight="semibold" color="gray.900">
                          {formatCurrency(item.price * item.quantity)}
                        </Text>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </Box>
            </VStack>

            {/* Right Column - Payment Summary */}
            <VStack spacing={6} align="stretch">
              {/* Payment Method */}
              <Box p={4} bg="gray.50" borderRadius="lg">
                <Text fontSize="lg" fontWeight="semibold" mb={3} color="gray.800">
                  Payment Method
                </Text>
                <Badge 
                  colorScheme={paymentTypeStyle.color.split('.')[0] as any}
                  variant="subtle"
                  px={3}
                  py={2}
                  borderRadius="full"
                >
                  <HStack spacing={2}>
                    {getPaymentTypeIcon(transaction.payment_type)}
                    <Text fontWeight="medium" textTransform="capitalize">
                      {transaction.payment_type}
                    </Text>
                  </HStack>
                </Badge>
              </Box>

              {/* Payment Summary */}
              <Box p={4} bg="gray.50" borderRadius="lg">
                <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.800">
                  Payment Summary
                </Text>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <Text color="gray.600">Subtotal</Text>
                    <Text fontWeight="medium">{formatCurrency(subtotal)}</Text>
                  </HStack>
                  
                  {discount > 0 && (
                    <HStack justify="space-between">
                      <Text color="gray.600">Discount</Text>
                      <Text fontWeight="medium" color="green.600">
                        -{formatCurrency(discount)}
                      </Text>
                    </HStack>
                  )}
                  
                  {tax > 0 && (
                    <HStack justify="space-between">
                      <Text color="gray.600">Tax</Text>
                      <Text fontWeight="medium">{formatCurrency(tax)}</Text>
                    </HStack>
                  )}
                  
                  <Divider />
                  
                  <HStack justify="space-between">
                    <Text fontWeight="semibold" color="gray.900">Total</Text>
                    <Text fontWeight="semibold" color="gray.900">
                      {formatCurrency(total)}
                    </Text>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text color="gray.600">Amount Paid</Text>
                    <Text fontWeight="medium" color="blue.600">
                      {formatCurrency(paid)}
                    </Text>
                  </HStack>
                  
                  {due > 0 ? (
                    <HStack justify="space-between">
                      <Text color="gray.600">Amount Due</Text>
                      <Text fontWeight="medium" color="orange.600">
                        {formatCurrency(due)}
                      </Text>
                    </HStack>
                  ) : (
                    <HStack justify="space-between">
                      <Text color="gray.600">Change</Text>
                      <Text fontWeight="medium" color="green.600">
                        {formatCurrency(change)}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </Box>

              {/* Status */}
              <Box p={4} bg="gray.50" borderRadius="lg">
                <Text fontSize="lg" fontWeight="semibold" mb={3} color="gray.800">
                  Status
                </Text>
                <Badge 
                  colorScheme={due === 0 ? "green" : "orange"}
                  variant="subtle"
                  px={3}
                  py={2}
                  borderRadius="full"
                  fontSize="sm"
                >
                  {due === 0 ? 'Completed' : 'Pending Payment'}
                </Badge>
              </Box>
            </VStack>
          </Grid>
        </ModalBody>

        {/* Footer */}
        <ModalFooter borderTop="1px solid" borderColor="gray.200">
          <HStack spacing={3}>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              colorScheme="blue"
              leftIcon={<Printer size={16} />}
              onClick={handlePrintReceipt}
            >
              Print Receipt
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};