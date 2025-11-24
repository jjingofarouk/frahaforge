// src/renderer/src/components/users/UserFormModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Eye, EyeOff, Key } from 'lucide-react';
import { User } from '../../types/user.types';
import { createUser, updateUser } from '../../services/api';
import './UserFormModal.css';

interface UserFormModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (userData: any) => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  user,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    perm_products: 0,
    perm_categories: 0,
    perm_transactions: 0,
    perm_users: 0,
    perm_settings: 0,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        username: user.username || '',
        password: '', // Don't show existing password
        perm_products: Number(user.perm_products) || 0,
        perm_categories: Number(user.perm_categories) || 0,
        perm_transactions: Number(user.perm_transactions) || 0,
        perm_users: Number(user.perm_users) || 0,
        perm_settings: Number(user.perm_settings) || 0,
      });
    } else {
      setFormData({
        full_name: '',
        username: '',
        password: '',
        perm_products: 0,
        perm_categories: 0,
        perm_transactions: 0,
        perm_users: 0,
        perm_settings: 0,
      });
    }
    setErrors({});
    setShowPassword(false);
    setLoading(false);
  }, [user, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    
    // For new users, password is required
    if (!user && !formData.password) {
      newErrors.password = 'Password is required for new users';
    }
    
    // If password is provided, validate it
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const payload: any = {
        fullname: formData.full_name.trim(), // Backend expects 'fullname' but we use 'full_name' in frontend
        username: formData.username.trim(),
        perm_products: Number(formData.perm_products),
        perm_categories: Number(formData.perm_categories),
        perm_transactions: Number(formData.perm_transactions),
        perm_users: Number(formData.perm_users),
        perm_settings: Number(formData.perm_settings),
      };

      // Only include password if provided
      if (formData.password) {
        payload.password = formData.password;
      }

      if (user) {
        // Update existing user
        payload.id = user.id;
        await updateUser(user.id, payload);
      } else {
        // Create new user
        await createUser(payload);
      }

      onSave(payload);
    } catch (err: any) {
      console.error('Error saving user:', err);
      setErrors({ 
        submit: err.response?.data?.message || err.message || 'Failed to save user' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (perm: string, value: number) => {
    setFormData((prev) => ({ ...prev, [perm]: value }));
  };

  const presetRoles = {
    administrator: { 
      perm_products: 1, 
      perm_categories: 1, 
      perm_transactions: 1, 
      perm_users: 1, 
      perm_settings: 1 
    },
    manager: { 
      perm_products: 1, 
      perm_categories: 1, 
      perm_transactions: 1, 
      perm_users: 0, 
      perm_settings: 0 
    },
    dispenser: { 
      perm_products: 1, 
      perm_categories: 1, 
      perm_transactions: 0, 
      perm_users: 0, 
      perm_settings: 0 
    },
    cashier: { 
      perm_products: 0, 
      perm_categories: 0, 
      perm_transactions: 1, 
      perm_users: 0, 
      perm_settings: 0 
    },
    limited: { 
      perm_products: 0, 
      perm_categories: 0, 
      perm_transactions: 0, 
      perm_users: 0, 
      perm_settings: 0 
    },
  };

  const applyPresetRole = (role: keyof typeof presetRoles) => {
    setFormData((prev) => ({ ...prev, ...presetRoles[role] }));
  };

  const getCurrentRole = (): string => {
    const perms = formData;
    if (perms.perm_users && perms.perm_settings) return 'administrator';
    if (perms.perm_products && perms.perm_transactions && !perms.perm_users) return 'manager';
    if (perms.perm_products && !perms.perm_transactions && !perms.perm_users) return 'dispenser';
    if (!perms.perm_products && perms.perm_transactions && !perms.perm_users) return 'cashier';
    return 'limited';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="user-form-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="user-form-modal-content"
            initial={{ scale: 0.95, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="user-form-header">
              <h2>{user ? 'Edit User' : 'Create New User'}</h2>
              <button className="close-btn" onClick={onClose} disabled={loading}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                  className={errors.full_name ? 'error' : ''}
                  placeholder="Enter full name"
                  disabled={loading}
                />
                {errors.full_name && <span className="error-text">{errors.full_name}</span>}
              </div>

              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                  className={errors.username ? 'error' : ''}
                  placeholder="Enter username"
                  disabled={loading}
                />
                {errors.username && <span className="error-text">{errors.username}</span>}
              </div>

              <div className="form-group">
                <label>
                  Password {!user && '*'}
                  {user && <span className="optional">(leave blank to keep current)</span>}
                </label>
                <div className="password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                    className={errors.password ? 'error' : ''}
                    placeholder={user ? "Enter new password" : "Enter password"}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="form-section">
                <h3>Quick Role Presets</h3>
                <div className="role-presets">
                  {Object.entries(presetRoles).map(([role, perms]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => applyPresetRole(role as keyof typeof presetRoles)}
                      className={`preset-btn ${role} ${getCurrentRole() === role ? 'active' : ''}`}
                      disabled={loading}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h3>Detailed Permissions</h3>
                <div className="permissions-grid">
                  {[
                    { key: 'perm_products', label: 'Products Management' },
                    { key: 'perm_categories', label: 'Categories Management' },
                    { key: 'perm_transactions', label: 'Transactions & Sales' },
                    { key: 'perm_users', label: 'User Management' },
                    { key: 'perm_settings', label: 'System Settings' },
                  ].map((p) => (
                    <div key={p.key} className="permission-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={!!formData[p.key as keyof typeof formData]}
                          onChange={(e) =>
                            handlePermissionChange(p.key, e.target.checked ? 1 : 0)
                          }
                          disabled={loading}
                        />
                        {p.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {errors.submit && (
                <div className="form-error">
                  <Key size={16} />
                  {errors.submit}
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Save size={16} />
                    </motion.div>
                  ) : (
                    <Save size={16} />
                  )}
                  {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserFormModal;