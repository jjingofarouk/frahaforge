// src/renderer/src/components/customers/components/FrequentCustomers.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Users, DollarSign, Award, Target } from 'lucide-react';
import { Customer } from '../../services/customerService';
import './FrequentCustomers.css';

interface FrequentCustomersProps {
  customers: Customer[];
}

const FrequentCustomers: React.FC<FrequentCustomersProps> = ({ customers }) => {
  const frequentCustomers = customers
    .filter(customer => customer.total_orders >= 3)
    .sort((a, b) => b.total_orders - a.total_orders)
    .slice(0, 5);

  const topSpenders = customers
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 5);

  const vipCustomers = customers
    .filter(customer => customer.segment === 'vip')
    .slice(0, 5);

  if (customers.length === 0) {
    return (
      <div className="frequent-customers">
        <div className="frequent-customers__header">
          <TrendingUp size={20} />
          <h3>Customer Insights</h3>
        </div>
        <div className="frequent-customers__empty">
          <Users size={32} />
          <p>No customer insights available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="frequent-customers">
      <div className="frequent-customers__header">
        <TrendingUp size={20} />
        <h3>Customer Insights</h3>
      </div>

      {vipCustomers.length > 0 && (
        <div className="frequent-customers__section">
          <h4>
            <Award size={16} />
            VIP Customers
          </h4>
          <div className="frequent-customers__list">
            {vipCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                className="frequent-customer-card frequent-customer-card--vip"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="frequent-customer-card__rank frequent-customer-card__rank--vip">
                  <Award size={14} />
                </div>
                <div className="frequent-customer-card__info">
                  <div className="frequent-customer-card__name">{customer.name}</div>
                  <div className="frequent-customer-card__details">
                    <span>{customer.total_orders} orders</span>
                    <span>•</span>
                    <span>UGX {customer.total_spent.toLocaleString()}</span>
                  </div>
                </div>
                <div className="frequent-customer-card__points">
                  <Star size={12} />
                  {customer.loyalty_points}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {frequentCustomers.length > 0 && (
        <div className="frequent-customers__section">
          <h4>
            <Target size={16} />
            Most Frequent
          </h4>
          <div className="frequent-customers__list">
            {frequentCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                className="frequent-customer-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="frequent-customer-card__rank">
                  #{index + 1}
                </div>
                <div className="frequent-customer-card__info">
                  <div className="frequent-customer-card__name">{customer.name}</div>
                  <div className="frequent-customer-card__details">
                    <span>{customer.total_orders} orders</span>
                    <span>•</span>
                    <span>UGX {customer.total_spent.toLocaleString()}</span>
                  </div>
                </div>
                <div className="frequent-customer-card__badge">
                  <Target size={14} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {topSpenders.length > 0 && (
        <div className="frequent-customers__section">
          <h4>
            <DollarSign size={16} />
            Top Spenders
          </h4>
          <div className="frequent-customers__list">
            {topSpenders.map((customer, index) => (
              <motion.div
                key={customer.id}
                className="frequent-customer-card frequent-customer-card--spender"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="frequent-customer-card__rank frequent-customer-card__rank--spender">
                  #{index + 1}
                </div>
                <div className="frequent-customer-card__info">
                  <div className="frequent-customer-card__name">{customer.name}</div>
                  <div className="frequent-customer-card__details">
                    <DollarSign size={12} />
                    <span>UGX {customer.total_spent.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FrequentCustomers;