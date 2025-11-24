// Enhanced UsersPage.tsx with real-time status tracking

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Package,
  CreditCard,
  Settings,
  Shield,
  AlertCircle,
  Key,
  RefreshCw,
} from 'lucide-react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import { format, formatDistanceToNow, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { getUsers, deleteUser, updateUser } from '../../services/api';
import { User } from '../../types/user.types';
import UserFormModal from './UserFormModal';
import './UsersPage.css';

interface UserWithStatus extends User {
  isOnline: boolean;
  lastActivity?: string;
  lastLoginDate?: Date;
  sessionExpired?: boolean;
}

const columnHelper = createColumnHelper<UserWithStatus>();

const permissionTooltips: Record<string, string> = {
  perm_products: 'Products',
  perm_categories: 'Categories',
  perm_transactions: 'Transactions',
  perm_users: 'Users',
  perm_settings: 'Settings',
};

const getPermissionIcon = (perm: string, size = 14) => {
  switch (perm) {
    case 'perm_products':
    case 'perm_categories':
      return <Package key={perm} size={size} />;
    case 'perm_transactions':
      return <CreditCard key={perm} size={size} />;
    case 'perm_users':
      return <Users key={perm} size={size} />;
    case 'perm_settings':
      return <Settings key={perm} size={size} />;
    default:
      return null;
  }
};

const getRoleName = (user: UserWithStatus): string => {
  const p = {
    products: user.perm_products,
    categories: user.perm_categories,
    transactions: user.perm_transactions,
    users: user.perm_users,
    settings: user.perm_settings,
  };
  if (p.users && p.settings) return 'Administrator';
  if (p.products && p.transactions && !p.users) return 'Manager';
  if (p.products && !p.transactions && !p.users) return 'Dispenser';
  if (!p.products && p.transactions && !p.users) return 'Cashier';
  return 'Limited User';
};

const getRoleColor = (role: string): string => {
  switch (role) {
    case 'Administrator': return 'admin';
    case 'Manager': return 'manager';
    case 'Dispenser': return 'dispenser';
    case 'Cashier': return 'cashier';
    default: return 'limited';
  }
};

// Enhanced function to check if user is truly online
const checkUserOnlineStatus = (user: User): { isOnline: boolean; sessionExpired: boolean } => {
  // User must have is_logged_in flag set to 1
  if (user.is_logged_in !== 1) {
    return { isOnline: false, sessionExpired: false };
  }

  // Check if session_expiry exists and is valid
  if (user.session_expiry) {
    const expiryDate = new Date(user.session_expiry);
    const now = new Date();
    
    if (expiryDate <= now) {
      return { isOnline: false, sessionExpired: true };
    }
  }

  // Check last_login or status to determine recent activity
  let lastActivityDate: Date | null = null;
  
  if (user.status && user.status.includes('Logged In_')) {
    const timestamp = user.status.split('Logged In_')[1];
    lastActivityDate = new Date(timestamp);
  } else if (user.last_login) {
    lastActivityDate = new Date(user.last_login);
  }

  // Consider user offline if last activity was more than 30 minutes ago
  if (lastActivityDate) {
    const minutesSinceActivity = differenceInMinutes(new Date(), lastActivityDate);
    if (minutesSinceActivity > 30) {
      return { isOnline: false, sessionExpired: false };
    }
  }

  return { isOnline: true, sessionExpired: false };
};

const formatLastLogin = (dateStr?: string): string => {
  if (!dateStr || !dateStr.includes('Logged In_')) return 'Never';
  const timestamp = dateStr.split('Logged In_')[1];
  if (!timestamp) return 'Never';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Never';
  if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
  if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`;
  return formatDistanceToNow(date, { addSuffix: true });
};

// Password reset modal component
const PasswordResetModal: React.FC<{
  user: UserWithStatus | null;
  onClose: () => void;
  onReset: (newPassword: string) => void;
}> = ({ user, onClose, onReset }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    onReset(newPassword);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="modal-header">
          <h2>Reset Password for {user.fullname}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="password-reset-form">
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Reset Password
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithStatus | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserWithStatus | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching users from API...');
      
      const response = await getUsers();
      console.log('✅ Users fetched successfully:', response.data);
      
      const enriched: UserWithStatus[] = response.data.map((u: User) => {
        const status = u.status || '';
        const { isOnline, sessionExpired } = checkUserOnlineStatus(u);
        const lastActivity = status || 'Never logged in';
        const lastLoginDate = status.includes('Logged In_')
          ? new Date(status.split('Logged In_')[1])
          : undefined;
        
        return { 
          ...u, 
          isOnline,
          sessionExpired,
          lastActivity, 
          lastLoginDate,
          perm_products: Number(u.perm_products) || 0,
          perm_categories: Number(u.perm_categories) || 0,
          perm_transactions: Number(u.perm_transactions) || 0,
          perm_users: Number(u.perm_users) || 0,
          perm_settings: Number(u.perm_settings) || 0,
        };
      });
      
      setUsers(enriched);
      setLastRefresh(new Date());
    } catch (err: any) {
      let errorMessage = 'Failed to fetch users';
      
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check if the server is running.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Access denied. Please ensure you have proper permissions.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to view users.';
      } else {
        errorMessage = err.message || 'Failed to fetch users';
      }
      
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    
    // Auto-refresh every 10 seconds if enabled
    let interval: NodeJS.Timeout | undefined;
    if (autoRefresh) {
      interval = setInterval(fetchUsers, 10000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsFormModalOpen(true);
  };

  const handleEditUser = (user: UserWithStatus) => {
    setEditingUser(user);
    setIsFormModalOpen(true);
  };

  const handleResetPassword = (user: UserWithStatus) => {
    setResetPasswordUser(user);
  };

  const handlePasswordReset = async (newPassword: string) => {
    if (!resetPasswordUser) return;

    try {
      // Update user with new password
      await updateUser(resetPasswordUser.id, {
        ...resetPasswordUser,
        password: newPassword
      });
      
      setResetPasswordUser(null);
      await fetchUsers();
      
      // Show success message
      alert('Password reset successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (userId === 1) {
      alert('Cannot delete the primary administrator account');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await deleteUser(userId);
      await fetchUsers();
    } catch (err: any) {
      let errorMessage = 'Failed to delete user';
      
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check if the server is running.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Access denied. Please ensure you have proper permissions.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to delete users.';
      } else {
        errorMessage = err.message || 'Failed to delete user';
      }
      
      setError(errorMessage);
      console.error('Error deleting user:', err);
    }
  };

  const handleSaveUser = async () => {
    try {
      setIsFormModalOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to save user');
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('fullname', {
        id: 'user',
        header: 'User',
        cell: ({ row }) => (
          <div className="user-cell">
            <div className="user-avatar">
              {row.original.fullname
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{row.original.fullname}</div>
              <div className="user-username">@{row.original.username}</div>
            </div>
          </div>
        ),
      }),

      columnHelper.accessor((row) => getRoleName(row), {
        id: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const role = getRoleName(row.original);
          return (
            <span className={`role-badge ${getRoleColor(role)}`}>
              {role}
            </span>
          );
        },
      }),

      columnHelper.display({
        id: 'permissions',
        header: 'Permissions',
        cell: ({ row }) => {
          const perms = [
            { key: 'perm_products', value: row.original.perm_products },
            { key: 'perm_categories', value: row.original.perm_categories },
            { key: 'perm_transactions', value: row.original.perm_transactions },
            { key: 'perm_users', value: row.original.perm_users },
            { key: 'perm_settings', value: row.original.perm_settings },
          ].filter((p) => p.value);

          return (
            <div className="permissions-icons">
              {perms.map((p) => (
                <div key={p.key} className="permission-tooltip">
                  {getPermissionIcon(p.key)}
                  <span className="tooltip">{permissionTooltips[p.key]}</span>
                </div>
              ))}
            </div>
          );
        },
      }),

      columnHelper.accessor('isOnline', {
        header: 'Status',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className={`status-indicator ${user.isOnline ? 'online' : 'offline'}`}>
              {user.isOnline ? <UserCheck size={14} /> : <UserX size={14} />}
              <span>
                {user.isOnline ? 'Online' : user.sessionExpired ? 'Session Expired' : 'Offline'}
              </span>
            </div>
          );
        },
      }),

      columnHelper.accessor('lastActivity', {
        header: 'Last Login',
        cell: ({ row }) => {
          const date = row.original.lastLoginDate;
          const text = formatLastLogin(row.original.lastActivity);
          return (
            <div className="last-login">
              <span>{text}</span>
              {date && (
                <span className="last-login-full">
                  {format(date, 'PPPp')}
                </span>
              )}
            </div>
          );
        },
      }),

      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="actions">
            <motion.button
              className="action-btn edit"
              onClick={() => handleEditUser(row.original)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Edit user"
              title="Edit user"
            >
              <Edit size={14} />
            </motion.button>

            <motion.button
              className="action-btn reset-password"
              onClick={() => handleResetPassword(row.original)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Reset password"
              title="Reset password"
            >
              <Key size={14} />
            </motion.button>

            {row.original.id !== 1 && (
              <motion.button
                className="action-btn delete"
                onClick={() => handleDeleteUser(row.original.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Delete user"
                title="Delete user"
              >
                <Trash2 size={14} />
              </motion.button>
            )}
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading && users.length === 0) {
    return (
      <div className="users-page">
        <div className="users-loading">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Users size={24} />
          </motion.div>
          Loading users...
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div className="users-title">
          <Users size={28} />
          <h1>User Management</h1>
        </div>
        <div className="header-actions">
          <motion.button
            className={`refresh-btn ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
          >
            <RefreshCw size={16} className={autoRefresh ? 'spinning' : ''} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </motion.button>
          <motion.button
            className="refresh-btn"
            onClick={fetchUsers}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Refresh now"
          >
            <RefreshCw size={16} />
          </motion.button>
          <motion.button
            className="create-user-btn"
            onClick={handleCreateUser}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserPlus size={18} />
            Add User
          </motion.button>
        </div>
      </div>

      {error && (
        <motion.div 
          className="users-error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="error-close">×</button>
        </motion.div>
      )}

      <div className="users-stats">
        <div className="stat-card">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.filter((u) => u.isOnline).length}</div>
          <div className="stat-label">Online Now</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {users.filter((u) => getRoleName(u) === 'Administrator').length}
          </div>
          <div className="stat-label">Administrators</div>
        </div>
        <div className="last-refresh">
          Last updated: {format(lastRefresh, 'h:mm:ss a')}
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={header.column.getCanSort() ? 'sortable' : ''}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: ' ↑',
                      desc: ' ↓',
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="no-users">
                  <div className="no-users-content">
                    <Users size={48} />
                    <h3>No users found</h3>
                    <p>Create your first user to get started</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UserFormModal
        isOpen={isFormModalOpen}
        user={editingUser}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
      />

      {resetPasswordUser && (
        <PasswordResetModal
          user={resetPasswordUser}
          onClose={() => setResetPasswordUser(null)}
          onReset={handlePasswordReset}
        />
      )}
    </div>
  );
};

export default UsersPage;