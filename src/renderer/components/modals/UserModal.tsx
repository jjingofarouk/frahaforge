// src/renderer/src/components/modals/UserModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User as UserIcon } from 'lucide-react';
import { User } from '../../services/authService';
import axios from 'axios';
import '../../../styles/UserModal.css';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null; // Change to allow null
}

interface UserFormData {
  id: string;
  fullname: string;
  username: string;
  password: string;
  confirmPassword: string;
  permissions: {
    perm_products: boolean;
    perm_categories: boolean;
    perm_transactions: boolean;
    perm_users: boolean;
    perm_settings: boolean;
  };
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, user }) => {
  const [formData, setFormData] = useState<UserFormData>({
    id: user?.id?.toString() || '', // Safe access with optional chaining
    fullname: user?.fullname || '',
    username: user?.username || '',
    password: '',
    confirmPassword: '',
    permissions: {
      perm_products: user?.perm_products === 1,
      perm_categories: user?.perm_categories === 1,
      perm_transactions: user?.perm_transactions === 1,
      perm_users: user?.perm_users === 1,
      perm_settings: user?.perm_settings === 1,
    },
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id?.toString() || '', // Safe access
        fullname: user.fullname || '',
        username: user.username || '',
        password: '',
        confirmPassword: '',
        permissions: {
          perm_products: user.perm_products === 1,
          perm_categories: user.perm_categories === 1,
          perm_transactions: user.perm_transactions === 1,
          perm_users: user.perm_users === 1,
          perm_settings: user.perm_settings === 1,
        },
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        permissions: { ...prev.permissions, [name]: checked },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.fullname.trim()) newErrors.fullname = 'Name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        id: formData.id,
        fullname: formData.fullname,
        username: formData.username,
        password: formData.password || undefined,
        perm_products: formData.permissions.perm_products ? 1 : 0,
        perm_categories: formData.permissions.perm_categories ? 1 : 0,
        perm_transactions: formData.permissions.perm_transactions ? 1 : 0,
        perm_users: formData.permissions.perm_users ? 1 : 0,
        perm_settings: formData.permissions.perm_settings ? 1 : 0,
      };

      await axios.post('http://192.168.1.3:3000/api/users/post', userData);

      alert('User updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      setErrors({ submit: 'Failed to update user' });
    } finally {
      setLoading(false);
    }
  };

  // Don't render if no user
  if (!user) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="user-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className="user-modal-content"
            initial={{ scale: 0.95, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="user-modal-header">
              <h4 className="user-modal-title">
                <UserIcon className="user-icon" size={24} />
                Account Information
              </h4>
              <motion.button
                className="user-close-btn"
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="user-icon" size={24} />
              </motion.button>
            </div>
            <div className="user-modal-body">
              <form id="saveUser" onSubmit={handleSubmit}>
                <input type="hidden" name="id" value={formData.id} />
                <div className="form-group">
                  <label htmlFor="fullname" className="input-label">Name*</label>
                  <input
                    type="text"
                    required
                    name="fullname"
                    placeholder="Enter name"
                    className="form-control"
                    value={formData.fullname}
                    onChange={handleInputChange}
                  />
                  {errors.fullname && <span className="error-text">{errors.fullname}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="username" className="input-label">Username*</label>
                  <input
                    type="text"
                    required
                    name="username"
                    placeholder="Login Username"
                    className="form-control"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                  {errors.username && <span className="error-text">{errors.username}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="password" className="input-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="input-label">Repeat Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Repeat Password"
                    className="form-control"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>
                <div className="perms">
                  <h3 className="perms-title">Permissions</h3>
                  <hr />
                  {[
                    { id: 'perm_products', label: 'Manage Products and Stock' },
                    { id: 'perm_categories', label: 'Manage Product Categories' },
                    { id: 'perm_transactions', label: 'View Transactions' },
                    { id: 'perm_users', label: 'Manage Users and Permissions' },
                    { id: 'perm_settings', label: 'Manage Settings' },
                  ].map((perm) => (
                    <div key={perm.id} className="perm-item">
                      <label className="perm-label">
                        <input
                          type="checkbox"
                          name={perm.id}
                          checked={formData.permissions[perm.id as keyof typeof formData.permissions]}
                          onChange={handleInputChange}
                          className="perm-checkbox"
                        />
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
                <motion.button
                  type="submit"
                  className="submit-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading || Object.keys(errors).length > 0}
                >
                  {loading ? 'Saving...' : 'Submit'}
                </motion.button>
                {errors.submit && <span className="error-text">{errors.submit}</span>}
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserModal;