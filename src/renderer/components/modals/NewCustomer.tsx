// src/renderer/src/components/modals/NewCustomer.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { customersService, Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../../services/customerService';
import { useCustomerManager } from '../../src/stores/globalPosStore';
import './NewCustomer.css';

interface NewCustomerProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded?: (customer?: Customer) => void;
  editingCustomer?: Customer | null;
}

const NewCustomer: React.FC<NewCustomerProps> = ({ isOpen, onClose, onCustomerAdded, editingCustomer }) => {
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    phone: '',
    email: '',
    address: '',
    store: 'FrahaPharmacy'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  // Use the customer manager for automatic synchronization
  const { createAndAddCustomer, updateAndSyncCustomer } = useCustomerManager();

  useEffect(() => {
    if (editingCustomer) {
      console.log('✏️ Editing customer:', editingCustomer);
      setFormData({
        name: editingCustomer.name || '',
        phone: editingCustomer.phone || '',
        email: editingCustomer.email || '',
        address: editingCustomer.address || '',
        store: editingCustomer.store || 'FrahaPharmacy'
      });
    } else {
      console.log('🆕 Creating new customer');
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        store: 'FrahaPharmacy'
      });
    }
    setErrors([]);
    setSuccess(false);
  }, [editingCustomer, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
    if (success) {
      setSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setSuccess(false);

    try {
      console.log('🔄 Submitting customer form...', formData);
      
      // Validate form data
      const validation = customersService.validateCustomer(formData);
      if (!validation.isValid) {
        console.log('❌ Validation errors:', validation.errors);
        setErrors(validation.errors);
        return;
      }

      let result;
      let newCustomer: Customer | undefined;

      if (editingCustomer) {
        console.log('📝 Updating existing customer:', editingCustomer.id);
        
        const updateData: UpdateCustomerRequest = {};
        if (formData.name !== editingCustomer.name) updateData.name = formData.name;
        if (formData.phone !== editingCustomer.phone) updateData.phone = formData.phone;
        if (formData.email !== editingCustomer.email) updateData.email = formData.email;
        if (formData.address !== editingCustomer.address) updateData.address = formData.address;
        if (formData.store !== editingCustomer.store) updateData.store = formData.store;

        // Use the synchronized update function
        newCustomer = await updateAndSyncCustomer(editingCustomer.id, updateData);
        result = { customer: newCustomer };
      } else {
        console.log('🆕 Creating new customer');
        
        // Use the synchronized create function
        newCustomer = await createAndAddCustomer(formData);
        result = { customer: newCustomer };
      }
      
      setSuccess(true);
      console.log('✅ Customer saved and synchronized successfully:', newCustomer);
      
      // Wait a moment to show success, then close
      setTimeout(() => {
        if (onCustomerAdded) {
          console.log('📤 Calling onCustomerAdded callback with:', newCustomer);
          onCustomerAdded(newCustomer);
        }
        onClose();
      }, 800);
      
    } catch (error: any) {
      console.error('❌ Failed to save customer:', error);
      setErrors([error.message || 'Failed to save customer. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log('❌ Closing customer modal');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="new-customer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleClose}
        >
          <motion.div
            className="new-customer-content"
            initial={{ scale: 0.95, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="new-customer-header">
              <h4 className="new-customer-title">
                {editingCustomer ? 'Edit Customer' : 'New Customer'}
              </h4>
              <button 
                className="new-customer-close-btn" 
                onClick={handleClose}
                disabled={loading}
              >
                ×
              </button>
            </div>

            <div className="new-customer-body">
              {success && (
                <motion.div
                  className="success-message"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  ✅ {editingCustomer ? 'Customer updated successfully!' : 'Customer created successfully!'}
                </motion.div>
              )}

              {errors.length > 0 && (
                <motion.div
                  className="error-messages"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  {errors.map((error, index) => (
                    <div key={index} className="error-message">
                      {error}
                    </div>
                  ))}
                </motion.div>
              )}

              <form id="saveCustomer" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Customer Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter customer name"
                    className="form-control"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="Enter phone number"
                    className="form-control"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="form-control"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address" className="form-label">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                    className="form-control"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="store" className="form-label">Store</label>
                  <select
                    id="store"
                    name="store"
                    value={formData.store}
                    onChange={handleChange}
                    className="form-control"
                    disabled={loading}
                    style={{ appearance: 'none' }}
                  >
                    <option value="FrahaPharmacy">Fraha Pharmacy</option>
                    <option value="default">Default Store</option>
                  </select>
                </div>

                <motion.button
                  type="submit"
                  className={`btn btn-primary ${success ? 'btn-success' : ''}`}
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      {editingCustomer ? 'Updating...' : 'Creating...'}
                    </>
                  ) : success ? (
                    '✓ Done!'
                  ) : editingCustomer ? (
                    'Update Customer'
                  ) : (
                    'Create Customer'
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewCustomer;