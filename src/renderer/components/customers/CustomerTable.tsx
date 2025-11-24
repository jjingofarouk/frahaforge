// src/renderer/src/components/customers/components/CustomerTable.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit2,
  Trash2,
  RefreshCw,
  User,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

import { Customer } from '../../services/customerService';
import './CustomerTable.css';

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  onRefresh: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: number) => void;
}

const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  loading,
  onEditCustomer,
  onDeleteCustomer,
}) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteCustomer = async (customerId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this customer? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      setDeletingId(customerId);
      await onDeleteCustomer(customerId);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="customers-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw size={32} />
        </motion.div>
        <p>Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="customer-table">
      <div className="customer-table__container">
        <table className="customer-table__table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Last Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {customers.map((customer, index) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="customer-table__row"
                >
                  {/* Customer Info */}
                  <td>
                    <div className="customer-table__customer-info">
                      <div className="customer-table__avatar">
                        <User size={16} />
                      </div>
                      <div>
                        <div className="customer-table__name">{customer.name}</div>
                        <div className="customer-table__segment-container">
                          <span
                            className={`customer-table__segment customer-table__segment--${customer.segment}`}
                          >
                            {customer.segment}
                          </span>
                          <div className="customer-table__store">{customer.store}</div>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td>
                    <div className="customer-table__contact-info">
                      {customer.phone && (
                        <div className="customer-table__contact-item">
                          <Phone size={14} />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="customer-table__contact-item">
                          <Mail size={14} />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="customer-table__contact-item">
                          <MapPin size={14} />
                          <span className="customer-table__address">{customer.address}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Orders */}
                  <td>
                    <div className="customer-table__orders">
                      <span className="customer-table__orders-count">{customer.total_orders}</span>
                      <span className="customer-table__orders-label">orders</span>
                    </div>
                  </td>

                  {/* Total Spent */}
                  <td>
                    <div className="customer-table__amount">
                      UGX {customer.total_spent.toLocaleString()}
                    </div>
                  </td>

                  {/* Last Order */}
                  <td>
                    <div className="customer-table__last-order">
                      {customer.last_order_date ? formatDate(customer.last_order_date) : 'Never'}
                    </div>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="customer-table__actions">
                      {/* EDIT BUTTON – FIXED */}
                      <motion.button
                        className="customer-table__action-btn customer-table__action-btn--edit"
                        onClick={() => onEditCustomer(customer)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Edit Customer"
                        aria-label="Edit Customer"
                      >
                        <Edit2 size={18} strokeWidth={2} />
                      </motion.button>

                      {/* DELETE BUTTON – WITH SMOOTH LOADING */}
                      <motion.button
                        className="customer-table__action-btn customer-table__action-btn--delete"
                        onClick={() => handleDeleteCustomer(customer.id)}
                        disabled={deletingId === customer.id}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Delete Customer"
                        aria-label="Delete Customer"
                      >
                        <AnimatePresence mode="wait">
                          {deletingId === customer.id ? (
                            <motion.div
                              key="loading"
                              initial={{ rotate: 0 }}
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              style={{ display: 'flex' }}
                            >
                              <RefreshCw size={18} strokeWidth={2} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="delete"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <Trash2 size={18} strokeWidth={2} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {/* Empty State */}
        {customers.length === 0 && (
          <div className="customers-empty">
            <User size={48} className="customers-empty__icon" />
            <h3>No Customers Found</h3>
            <p>Get started by adding your first customer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerTable;