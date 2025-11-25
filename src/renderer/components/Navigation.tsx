// src/renderer/src/components/Navigation.tsx
'use client';
import React, { useState, useMemo } from 'react';
import {
  Package, Users, Settings, LogOut, User as UserIcon,
  Home, CreditCard, FileText, Layers, UserCheck, BarChart3, Truck,
  WifiOff, Shield, ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import { User } from '../types/user.types';
import logo from '../assets/images/logo.png';
import './Navigation.css';

type AppView =
  | 'pos'
  | 'transactions'
  | 'products'
  | 'orders'
  | 'customers'
  | 'accounting'
  | 'users'
  | 'suppliers'
  | 'about';

interface NavigationProps {
  user: User | null;
  onLogout: () => void;
  activeView: AppView;
  onSwitchView: (view: AppView) => void;
  onOpenSettings: () => void;
  onOpenUser: () => void;
  outOfStockCount: number;
  isOffline?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  requiresOnline?: boolean;
  onClick: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  user,
  onLogout,
  activeView,
  onSwitchView,
  onOpenSettings,
  onOpenUser,
  outOfStockCount,
  isOffline = false,
  isCollapsed = true,
  onToggleCollapse,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Safe user fallback
  const safeUser: User = user ?? {
    id: 0, username: 'unknown', fullname: 'Unknown User',
    perm_products: 0, perm_categories: 0, perm_transactions: 0,
    perm_users: 0, perm_settings: 0, status: '', is_logged_in: 0, created_at: ''
  };

  const hasPermission = (perm: keyof Pick<User, 'perm_products' | 'perm_transactions' | 'perm_users' | 'perm_settings'>) =>
    safeUser[perm] === 1;

  // Role logic
  const role = useMemo(() => {
    if (hasPermission('perm_users') && hasPermission('perm_settings'))
      return { name: 'Administrator', color: 'admin', icon: <Shield size={12} /> };
    if (hasPermission('perm_products') && hasPermission('perm_transactions') && !hasPermission('perm_users'))
      return { name: 'Manager', color: 'manager', icon: <UserCheck size={12} /> };
    if (hasPermission('perm_products') && !hasPermission('perm_transactions'))
      return { name: 'Dispenser', color: 'dispenser', icon: <Package size={12} /> };
    if (hasPermission('perm_transactions') && !hasPermission('perm_users'))
      return { name: 'Cashier', color: 'cashier', icon: <CreditCard size={12} /> };
    return { name: 'Limited User', color: 'limited', icon: <UserIcon size={12} /> };
  }, [safeUser]);

  // Navigation items
  const navItems = useMemo((): NavItem[] => {
    const items: NavItem[] = [];
    const add = (id: AppView, label: string, icon: React.ReactNode, requiresOnline = false, showBadge = false) => {
      const canAccess = (
        (id === 'pos' && (hasPermission('perm_products') || hasPermission('perm_transactions'))) ||
        (id === 'transactions' && hasPermission('perm_transactions')) ||
        (id === 'products' && hasPermission('perm_products')) ||
        (id === 'orders' && (hasPermission('perm_products') || hasPermission('perm_transactions'))) ||
        (id === 'customers') ||
        (id === 'suppliers' && hasPermission('perm_products')) ||
        (id === 'users' && hasPermission('perm_users')) ||
        (id === 'accounting' && hasPermission('perm_transactions')) ||
        (id === 'about') // About page is accessible to all
      );
      if (canAccess) {
        items.push({
          id,
          label,
          icon,
          badge: showBadge && outOfStockCount > 0 ? outOfStockCount : undefined,
          requiresOnline,
          onClick: () => onSwitchView(id),
        });
      }
    };

    add('pos', 'Point of Sale', <Home size={18} />);
    add('transactions', 'Transactions History', <CreditCard size={18} />, true);
    add('products', 'Manage Stock', <Layers size={18} />, false, true);
    add('orders', 'Pending Orders', <FileText size={18} />, true);
    add('customers', 'Customer Directory', <Users size={18} />);
    add('suppliers', 'Supplier Analytics', <Truck size={18} />, true);
    add('users', 'Staff Accounts', <Users size={18} />, true);
    add('accounting', 'Business Analytics', <BarChart3 size={18} />, true);
    add('about', 'About', <Info size={18} />);
    return items;
  }, [hasPermission, outOfStockCount, onSwitchView]);

  const handleItemClick = (item: NavItem) => {
    if (isOffline && item.requiresOnline) {
      alert('This feature requires an internet connection.');
      return;
    }
    item.onClick();
  };

  const getInitials = () => {
    const name = safeUser.fullname?.trim();
    if (!name || name === 'Unknown User') return 'UU';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Always show labels when expanded, only show on hover when collapsed
  const shouldShowLabels = isCollapsed ? isHovered : true;

  return (
    <nav
      className={`fraha-pharmacy-nav ${isCollapsed ? 'collapsed' : 'expanded'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Main navigation"
    >
      {/* Header */}
      <header className="nav-header">
        <div className="nav-logo-wrapper">
          <img src={logo} alt="Fraha Pharmacy" className="nav-logo" />
          {shouldShowLabels && (
            <div className="nav-logo-text">
              <span className="primary">Fraha</span>
              <span className="secondary">Pharmacy</span>
            </div>
          )}
        </div>
        
        {onToggleCollapse && (
          <button
            className="nav-toggle-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
        
        {isOffline && shouldShowLabels && (
          <div className="offline-indicator" title="You are offline">
            <WifiOff size={12} />
            <span>Offline</span>
          </div>
        )}
      </header>

      {/* Navigation Items */}
      <div className="nav-items">
        {navItems.map((item) => {
          const isDisabled = isOffline && item.requiresOnline;
          const isActive = activeView === item.id;
          const hasBadge = item.badge && item.badge > 0;
          
          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => !isDisabled && handleItemClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && !isDisabled && handleItemClick(item)}
            >
              <div className="nav-item-content">
                {item.icon}
                {shouldShowLabels && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    
                    {/* Badge - Only show when there are actual out-of-stock items */}
                    {hasBadge && (
                      <div className="nav-badge">
                        {item.badge}
                      </div>
                    )}
                  </>
                )}
                
                {!shouldShowLabels && hasBadge && (
                  <div className="nav-badge badge-dot" />
                )}
                
                {isDisabled && shouldShowLabels && <WifiOff size={10} className="offline-icon" />}
              </div>
            </div>
          );
        })}

        {/* Settings */}
        {hasPermission('perm_settings') && (
          <div
            className={`nav-item settings ${isOffline ? 'disabled' : ''}`}
            onClick={isOffline ? undefined : onOpenSettings}
            role="button"
            tabIndex={0}
          >
            <div className="nav-item-content">
              <Settings size={18} />
              {shouldShowLabels && (
                <>
                  <span className="nav-label">Settings</span>
                  {isOffline && <WifiOff size={10} className="offline-icon" />}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="nav-footer">
        <button
          className="user-menu"
          onClick={onOpenUser}
        >
          <div className={`user-avatar avatar-${role.color}`}>
            {getInitials()}
          </div>
          {shouldShowLabels && (
            <div className="user-info">
              <div className="user-name">{safeUser.fullname}</div>
              <div className={`user-role role-${role.color}`}>
                {role.icon}
                <span>{role.name}</span>
                {isOffline && <span className="offline-badge">• Offline</span>}
              </div>
            </div>
          )}
        </button>
        
        <button
          className="logout-btn"
          onClick={onLogout}
        >
          <LogOut size={18} />
          {shouldShowLabels && <span>Logout</span>}
        </button>
      </footer>
    </nav>
  );
};

export default Navigation;