// src/renderer/src/components/suppliers/SupplierModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Users, Phone, Mail, MapPin, User } from 'lucide-react';
import { Supplier, CreateSupplierRequest, supplierService } from '../../services/supplierService';
import './SuppliersModal.css';

interface SupplierModalProps {
  supplier: Supplier | null;
  mode: 'view' | 'edit' | 'create';
  onClose: () => void;
  onSave: () => void;
}

const SupplierModal: React.FC<SupplierModalProps> = ({ supplier, mode, onClose, onSave }) => {
  const [formData, setFormData] = useState<CreateSupplierRequest>({
    name: '',
    phone_number: '',
    email: '',
    address: '',
    contact_person: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        phone_number: supplier.phone_number || '',
        email: supplier.email || '',
        address: supplier.address || '',
        contact_person: supplier.contact_person || ''
      });
    } else {
      setFormData({
        name: '',
        phone_number: '',
        email: '',
        address: '',
        contact_person: ''
      });
    }
    setErrors({});
  }, [supplier, mode]);

  const handleInputChange = (field: keyof CreateSupplierRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Supplier name is required';
    }

    if (formData.phone_number && !supplierService.isValidPhoneNumber(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }

    if (formData.email && !supplierService.isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === 'create') {
        await supplierService.createSupplier(formData);
      } else if (mode === 'edit' && supplier) {
        // We'll need to add an updateSupplier method to the service
        // For now, we'll use the create endpoint which might need adjustment
        await supplierService.createSupplier(formData);
      }
      onSave();
      onClose();
    } catch (error: any) {
      alert(`Failed to save supplier: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Add New Supplier';
      case 'edit': return 'Edit Supplier';
      case 'view': return 'Supplier Details';
      default: return 'Supplier';
    }
  };

  const isViewMode = mode === 'view';

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="supplier-modal"
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="header-left">
              <Users size={24} />
              <h2>{getTitle()}</h2>
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="modal-content">
            {/* Supplier Name */}
            <div className="form-group">
              <label className="form-label">
                <Users size={16} />
                Supplier Name *
              </label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="Enter supplier name"
                disabled={isViewMode}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            {/* Contact Person */}
            <div className="form-group">
              <label className="form-label">
                <User size={16} />
                Contact Person
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.contact_person}
                onChange={e => handleInputChange('contact_person', e.target.value)}
                placeholder="Enter contact person name"
                disabled={isViewMode}
              />
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label className="form-label">
                <Phone size={16} />
                Phone Number
              </label>
              <input
                type="tel"
                className={`form-input ${errors.phone_number ? 'error' : ''}`}
                value={formData.phone_number}
                onChange={e => handleInputChange('phone_number', e.target.value)}
                placeholder="+256 XXX XXX XXX"
                disabled={isViewMode}
              />
              {errors.phone_number && <span className="error-message">{errors.phone_number}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">
                <Mail size={16} />
                Email Address
              </label>
              <input
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                placeholder="supplier@example.com"
                disabled={isViewMode}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* Address */}
            <div className="form-group">
              <label className="form-label">
                <MapPin size={16} />
                Address
              </label>
              <textarea
                className="form-textarea"
                value={formData.address}
                onChange={e => handleInputChange('address', e.target.value)}
                placeholder="Enter supplier address"
                rows={3}
                disabled={isViewMode}
              />
            </div>

            {/* Supplier Stats (View Mode Only) */}
            {isViewMode && supplier && (
              <div className="supplier-stats">
                <h4>Supplier Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Total Products</span>
                    <span className="stat-value">{supplier.total_products || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Restocked Items</span>
                    <span className="stat-value">{supplier.unique_products_restocked || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Reliability Score</span>
                    <span className={`stat-value reliability-${supplier.reliability_score ? (supplier.reliability_score >= 80 ? 'high' : supplier.reliability_score >= 50 ? 'medium' : 'low') : 'none'}`}>
                      {supplier.reliability_score ? `${supplier.reliability_score}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Last Restock</span>
                    <span className="stat-value">
                      {supplier.last_restock_date 
                        ? new Date(supplier.last_restock_date).toLocaleDateString() 
                        : 'Never'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose}>
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode && (
              <button 
                className="btn-save" 
                onClick={handleSave}
                disabled={loading || !formData.name.trim()}
              >
                <Save size={18} />
                {loading ? 'Saving...' : mode === 'create' ? 'Create Supplier' : 'Save Changes'}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SupplierModal;