// src/renderer/components/accounting/shared/ExpenseForm.tsx
import React, { useState } from 'react';
import { Box, Text, VStack, HStack, SimpleGrid, Button, Input, Select, Textarea, useColorModeValue, FormControl, FormLabel, FormErrorMessage } from '@chakra-ui/react';
import { accountsService, CreateExpenseRequest, Expense } from '../../../services/accountsService';
import './ExpenseForm.css';

interface ExpenseFormProps {
  onSuccess?: (expense?: Expense) => void; // Make parameter optional
  onCancel?: () => void;
  initialData?: Partial<CreateExpenseRequest>;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  onSuccess, 
  onCancel, 
  initialData 
}) => {
  const [formData, setFormData] = useState<CreateExpenseRequest>({
    expense_date: initialData?.expense_date || new Date().toISOString().split('T')[0],
    description: initialData?.description || '',
    amount: initialData?.amount || 0,
    category: initialData?.category || '',
    subcategory: initialData?.subcategory || '',
    payment_method: initialData?.payment_method || '',
    vendor_name: initialData?.vendor_name || '',
    reference_number: initialData?.reference_number || '',
    receipt_image: '',
    status: initialData?.status || 'paid',
    due_date: initialData?.due_date || '',
    created_by: initialData?.created_by
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardBg = useColorModeValue('var(--bg-surface)', 'var(--bg-surface)');
  const borderColor = useColorModeValue('var(--border-color)', 'var(--border-color)');

  const expenseCategories = accountsService.getExpenseCategories();
  const paymentMethods = accountsService.getPaymentMethods();
  const statusOptions = ['paid', 'pending', 'overdue'];

  const getSubcategoryOptions = () => {
    switch (formData.category) {
      case 'Rent':
        return ['Rent for Fraha Pharmacy Main Branch'];
      case 'Salaries':
        return ['Manager', 'Cashiers', 'Dispensers', 'Cleaners', 'Security', 'Pharmacist', 'Assistant Pharmacist', 'Others'];
      case 'Utilities':
        return ['Electricity', 'Water', 'Internet', 'Generator Fuel', 'Airtime & Data', 'Security Lights', 'Umeme Bills', 'NWSC Bills'];
      case 'Supplies':
        return ['Medical Supplies', 'Prescription Pads', 'Receipt Books', 'Cleaning Supplies', 'Stationery', 'Packaging Materials', 'Protective Gear', 'First Aid Supplies'];
      case 'Marketing':
        return ['Flyers & Brochures', 'Social Media Ads', 'Radio Ads', 'Community Outreach', 'Health Camp Sponsorship', 'Signage', 'Promotional Items', 'Local Newspaper Ads'];
      case 'Transportation':
        return ['Delivery Fuel', 'Staff Transport', 'Supplier Pickups', 'Motorcycle Maintenance', 'Vehicle Insurance', 'Parking Fees', 'Emergency Deliveries', 'Customer Deliveries'];
      case 'Professional Fees':
        return ['Pharmacy Council Fees', 'Annual License Renewal', 'Legal Consultations', 'Accounting Services', 'Health Inspections', 'Drug Authority Fees', 'Consultation Fees', 'Training & Workshops'];
      case 'Insurance':
        return ['Business Insurance', 'Health Insurance', 'Vehicle Insurance', 'Property Insurance', 'Professional Liability', 'Goods in Transit', 'Workers Compensation', 'Public Liability'];
      default:
        return [];
    }
  };

  const getDescriptionTemplates = () => {
    switch (formData.category) {
      case 'Rent':
        return [
          'Monthly rent payment for Fraha Pharmacy main branch',
          'Quarterly rent advance payment',
          'Security deposit for pharmacy premises'
        ];
      case 'Salaries':
        return [
          'Monthly salary payment for pharmacy staff',
          'Overtime payment for weekend shifts',
          'Bonus payment for pharmacy team',
          'Advance salary for staff'
        ];
      case 'Utilities':
        return [
          'Monthly electricity bill payment',
          'Water bill for pharmacy premises',
          'Internet subscription for POS system',
          'Generator fuel for power backup',
          'Airtime and data for communication'
        ];
      case 'Supplies':
        return [
          'Purchase of medical supplies and consumables',
          'Restocking prescription pads and receipt books',
          'Cleaning materials for pharmacy hygiene',
          'Stationery for daily operations'
        ];
      case 'Marketing':
        return [
          'Printing of promotional flyers and brochures',
          'Social media advertising campaign',
          'Radio advertisement slots',
          'Community health outreach program'
        ];
      case 'Transportation':
        return [
          'Fuel for medicine deliveries',
          'Staff transport allowance',
          'Vehicle maintenance and servicing',
          'Motorcycle delivery costs'
        ];
      case 'Professional Fees':
        return [
          'Annual pharmacy council license renewal',
          'Legal consultation services',
          'Accounting and bookkeeping services',
          'Health inspection compliance fees'
        ];
      case 'Insurance':
        return [
          'Annual business insurance premium',
          'Staff health insurance coverage',
          'Vehicle insurance renewal',
          'Property insurance for pharmacy'
        ];
      default:
        return [];
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.expense_date) {
      newErrors.expense_date = 'Expense date is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await accountsService.createExpense(formData);
      // Pass the created expense to onSuccess callback if provided
      if (result.data) {
        onSuccess?.(result.data);
      } else {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Failed to create expense:', error);
      setErrors({ submit: 'Failed to create expense' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateExpenseRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleCategoryChange = (category: string) => {
    handleInputChange('category', category);
    handleInputChange('subcategory', '');
    handleInputChange('description', '');
  };

  const handleSubcategoryChange = (subcategory: string) => {
    handleInputChange('subcategory', subcategory);
    
    // Auto-fill description based on subcategory if not already set
    if (!formData.description && subcategory !== 'Others') {
      const templates = getDescriptionTemplates();
      if (templates.length > 0) {
        handleInputChange('description', templates[0]);
      }
    }
  };

  const handleTemplateSelect = (template: string) => {
    handleInputChange('description', template);
  };

  return (
    <Box 
      className="expense-form"
      bg={cardBg}
      p={6}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
    >
      <Text className="form-title" fontSize="lg" fontWeight="600" color="var(--text-primary)" mb={6}>
        {initialData ? 'Edit Expense' : 'New Expense'}
      </Text>

      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          {/* Basic Information */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isInvalid={!!errors.expense_date}>
              <FormLabel fontSize="sm" fontWeight="500" color="var(--text-primary)">
                Expense Date
              </FormLabel>
              <Input 
                type="date"
                value={formData.expense_date}
                onChange={(e) => handleInputChange('expense_date', e.target.value)}
                size="sm"
              />
              <FormErrorMessage>{errors.expense_date}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.amount}>
              <FormLabel fontSize="sm" fontWeight="500" color="var(--text-primary)">
                Amount (UGX)
              </FormLabel>
              <Input 
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                size="sm"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              <FormErrorMessage>{errors.amount}</FormErrorMessage>
            </FormControl>
          </SimpleGrid>

          {/* Category and Subcategory */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isInvalid={!!errors.category}>
              <FormLabel fontSize="sm" fontWeight="500" color="var(--text-primary)">
                Category
              </FormLabel>
              <Select 
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                size="sm"
                placeholder="Select category"
              >
                {expenseCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.category}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500" color="var(--text-primary)">
                Subcategory
              </FormLabel>
              <Select 
                value={formData.subcategory}
                onChange={(e) => handleSubcategoryChange(e.target.value)}
                size="sm"
                placeholder="Select subcategory"
              >
                {getSubcategoryOptions().map(subcategory => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </Select>
            </FormControl>
          </SimpleGrid>

          {/* Description Templates */}
          {formData.category && getDescriptionTemplates().length > 0 && (
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500" color="var(--text-primary)">
                Quick Description Templates
              </FormLabel>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                {getDescriptionTemplates().map((template, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    onClick={() => handleTemplateSelect(template)}
                    isDisabled={formData.description === template}
                  >
                    {template.length > 40 ? `${template.substring(0, 40)}...` : template}
                  </Button>
                ))}
              </SimpleGrid>
            </FormControl>
          )}

          {/* Description */}
          <FormControl isInvalid={!!errors.description}>
            <FormLabel fontSize="sm" fontWeight="500" color="var(--text-primary)">
              Description
            </FormLabel>
            <Textarea 
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              size="sm"
              placeholder="Describe the expense in detail..."
              rows={2}
            />
            <FormErrorMessage>{errors.description}</FormErrorMessage>
          </FormControl>

          {/* Payment Information */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isInvalid={!!errors.payment_method}>
              <FormLabel fontSize="sm" fontWeight="500" color="var(--text-primary)">
                Payment Method
              </FormLabel>
              <Select 
                value={formData.payment_method}
                onChange={(e) => handleInputChange('payment_method', e.target.value)}
                size="sm"
                placeholder="Select payment method"
              >
                {paymentMethods.map(method => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.payment_method}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500" color="var(--text-primary)">
                Status
              </FormLabel>
              <Select 
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                size="sm"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </Select>
            </FormControl>
          </SimpleGrid>

          {/* Vendor and Reference */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500" color="var(--text-primary)">
                Vendor Name
              </FormLabel>
              <Input 
                value={formData.vendor_name}
                onChange={(e) => handleInputChange('vendor_name', e.target.value)}
                size="sm"
                placeholder="Vendor or supplier name"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500" color="var(--text-primary)">
                Reference Number
              </FormLabel>
              <Input 
                value={formData.reference_number}
                onChange={(e) => handleInputChange('reference_number', e.target.value)}
                size="sm"
                placeholder="Invoice or receipt number"
              />
            </FormControl>
          </SimpleGrid>

          {/* Due Date (for pending expenses) */}
          {formData.status === 'pending' && (
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500" color="var(--text-primary)">
                Due Date
              </FormLabel>
              <Input 
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                size="sm"
              />
            </FormControl>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <Box className="submit-error" p={3} borderRadius="md" bg="var(--danger)" color="white">
              {errors.submit}
            </Box>
          )}

          {/* Action Buttons */}
          <HStack spacing={3} justify="flex-end" pt={4}>
            <Button 
              className="cancel-btn"
              variant="outline"
              onClick={onCancel}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              className="submit-btn"
              colorScheme="teal"
              type="submit"
              isLoading={isSubmitting}
              loadingText={initialData ? 'Updating...' : 'Creating...'}
            >
              {initialData ? 'Update Expense' : 'Create Expense'}
            </Button>
          </HStack>
        </VStack>
      </form>
    </Box>
  );
};

export default ExpenseForm;