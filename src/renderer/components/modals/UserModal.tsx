// src/renderer/src/components/modals/UserModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User as UserIcon, Shield, Package, CreditCard, Settings, Users, Calendar, Circle } from 'lucide-react';
import authService from '../../services/authService';
import './UserModal.css';

// Define User interface locally
interface User {
  id: number;
  username: string;
  fullname: string;
  password: string;
  perm_products: number;
  perm_categories: number;
  perm_transactions: number;
  perm_users: number;
  perm_settings: number;
  status: string;
  last_login?: string;
  is_logged_in: number;
  created_at: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, user }) => {
  // Don't render if no user
  if (!user) {
    return null;
  }

  // Get current user for comparison
  const currentUser = authService.getCurrentUser();
  const isCurrentUser = currentUser?.id === user.id;

  // Format last login date
  const formatLastLogin = (dateStr?: string): string => {
    if (!dateStr) return 'Never';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  // Format created date
  const formatCreatedDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  // Get user role based on permissions
  const getUserRole = (): string => {
    const p = user;
    if (p.perm_users && p.perm_settings) return 'Administrator';
    if (p.perm_products && p.perm_transactions && !p.perm_users) return 'Manager';
    if (p.perm_products && !p.perm_transactions && !p.perm_users) return 'Dispenser';
    if (!p.perm_products && p.perm_transactions && !p.perm_users) return 'Cashier';
    return 'Limited User';
  };

  // Get status color and text
  const getStatusInfo = () => {
    if (user.is_logged_in === 1) {
      return { color: '#10B981', text: 'Online', icon: <Circle size={12} fill="#10B981" color="#10B981" /> };
    }
    return { color: '#6B7280', text: 'Offline', icon: <Circle size={12} color="#6B7280" /> };
  };

  const statusInfo = getStatusInfo();
  const userRole = getUserRole();

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
                User Profile
                {isCurrentUser && <span className="current-user-badge">(You)</span>}
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
              {/* User Avatar and Basic Info */}
              <div className="user-profile-header">
                <div className="user-avatar-large">
                  {user.fullname
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="user-basic-info">
                  <h3 className="user-display-name">{user.fullname}</h3>
                  <p className="user-username">@{user.username}</p>
                  <div className="user-status">
                    {statusInfo.icon}
                    <span style={{ color: statusInfo.color }}>{statusInfo.text}</span>
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="user-details-section">
                <h4 className="section-title">Account Details</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">User ID:</span>
                    <span className="detail-value">#{user.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Role:</span>
                    <span className="detail-value role-badge">{userRole}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last Login:</span>
                    <span className="detail-value">{formatLastLogin(user.last_login)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Account Created:</span>
                    <span className="detail-value">{formatCreatedDate(user.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="user-details-section">
                <h4 className="section-title">Permissions</h4>
                <div className="permissions-grid">
                  <div className="permission-item">
                    <Package size={16} className="permission-icon" />
                    <span className="permission-label">Products Management</span>
                    <div className={`permission-status ${user.perm_products ? 'granted' : 'denied'}`}>
                      {user.perm_products ? 'Granted' : 'Denied'}
                    </div>
                  </div>
                  <div className="permission-item">
                    <Package size={16} className="permission-icon" />
                    <span className="permission-label">Categories Management</span>
                    <div className={`permission-status ${user.perm_categories ? 'granted' : 'denied'}`}>
                      {user.perm_categories ? 'Granted' : 'Denied'}
                    </div>
                  </div>
                  <div className="permission-item">
                    <CreditCard size={16} className="permission-icon" />
                    <span className="permission-label">Transactions & Sales</span>
                    <div className={`permission-status ${user.perm_transactions ? 'granted' : 'denied'}`}>
                      {user.perm_transactions ? 'Granted' : 'Denied'}
                    </div>
                  </div>
                  <div className="permission-item">
                    <Users size={16} className="permission-icon" />
                    <span className="permission-label">User Management</span>
                    <div className={`permission-status ${user.perm_users ? 'granted' : 'denied'}`}>
                      {user.perm_users ? 'Granted' : 'Denied'}
                    </div>
                  </div>
                  <div className="permission-item">
                    <Settings size={16} className="permission-icon" />
                    <span className="permission-label">System Settings</span>
                    <div className={`permission-status ${user.perm_settings ? 'granted' : 'denied'}`}>
                      {user.perm_settings ? 'Granted' : 'Denied'}
                    </div>
                  </div>
                </div>
              </div>


              {/* Close Button */}
              <div className="modal-actions">
                <motion.button
                  className="close-action-btn"
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserModal;