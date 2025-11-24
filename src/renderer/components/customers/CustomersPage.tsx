// src/renderer/src/components/customers/CustomersPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, Users, RefreshCw, Filter, AlertCircle, BarChart3, Crown, Heart, Clock, UserCheck } from 'lucide-react';
import CustomerStats from './CustomerStats';
import CustomerTable from './CustomerTable';
import FrequentCustomers from './FrequentCustomers';
import NewCustomerModal from '../modals/NewCustomer';
import { customersService, Customer, CustomerStats as CustomerStatsType } from '../../services/customerService';
import './CustomersPage.css';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<CustomerStatsType | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [recalculatingSegments, setRecalculatingSegments] = useState(false);

  // Load customers data
  useEffect(() => {
    loadCustomers();
  }, []);

  // Blinking animation for real-time indicator
  useEffect(() => {
    if (lastRefresh) {
      setIsBlinking(true);
      const timer = setTimeout(() => setIsBlinking(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastRefresh]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading customers data...');
      
      // Load customers with basic parameters
      const customersResponse = await customersService.getCustomers({
        page: 1,
        limit: 1000 // Get all customers for now
      });
      
      // Try to load stats, but don't fail if it doesn't exist
      let statsData = null;
      try {
        statsData = await customersService.getCustomerStats();
      } catch (statsError) {
        console.warn('Stats endpoint not available, using fallback data');
        // Create basic stats from customers data
        statsData = createFallbackStats(customersResponse.customers || []);
      }
      
      setCustomers(customersResponse.customers || []);
      setStats(statsData);
      setLastRefresh(new Date());
      console.log(`✅ Loaded ${customersResponse.customers?.length || 0} customers`);
    } catch (error: any) {
      console.error('Failed to fetch customers:', error);
      setError(`Failed to load customers: ${error.message}`);
      // Set empty state to prevent complete failure
      setCustomers([]);
      setStats(createFallbackStats([]));
    } finally {
      setLoading(false);
    }
  };

  // Create fallback stats when API endpoint is not available
  const createFallbackStats = (customersList: Customer[]): CustomerStatsType => {
    const totalCustomers = customersList.length;
    const activeCustomers = customersList.filter(c => c.total_orders > 0).length;
    const newCustomersToday = customersList.filter(c => {
      const created = new Date(c.created_at);
      const today = new Date();
      return created.toDateString() === today.toDateString();
    }).length;
    
    const totalLoyaltyPoints = customersList.reduce((sum, c) => sum + c.loyalty_points, 0);
    const averageOrderValue = customersList.length > 0 
      ? customersList.reduce((sum, c) => sum + c.total_spent, 0) / customersList.length
      : 0;

    // Calculate segment distribution
    const segmentCounts = customersList.reduce((acc, customer) => {
      acc[customer.segment] = (acc[customer.segment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const segment_distribution = Object.entries(segmentCounts).map(([segment, count]) => ({
      segment,
      customer_count: count,
      percentage: totalCustomers > 0 ? Math.round((count / totalCustomers) * 100) : 0
    }));

    return {
      total_customers: totalCustomers,
      active_customers: activeCustomers,
      new_customers_today: newCustomersToday,
      total_loyalty_points: totalLoyaltyPoints,
      average_order_value: averageOrderValue,
      segment_distribution
    };
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await loadCustomers();
    } catch (error: any) {
      console.error('Failed to refresh customers:', error);
      setError(`Failed to refresh: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRecalculateSegments = async () => {
    try {
      setRecalculatingSegments(true);
      setError(null);
      
      const result = await customersService.recalculateAllSegments();
      
      console.log('✅ Segments recalculated:', result);
      
      // Reload customers to see updated segments
      await loadCustomers();
      
      // Show success message
      setError(`✅ Segments recalculated: ${result.updated} customers updated out of ${result.total}`);
      
    } catch (error: any) {
      console.error('Failed to recalculate segments:', error);
      setError(`Failed to recalculate segments: ${error.message}`);
    } finally {
      setRecalculatingSegments(false);
    }
  };

  const handleNewCustomerCreated = async () => {
    setIsNewCustomerOpen(false);
    setEditingCustomer(null);
    await loadCustomers();
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsNewCustomerOpen(true);
  };

  const handleDeleteCustomer = async (customerId: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this customer? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await customersService.deleteCustomer(customerId);
      await loadCustomers();
    } catch (error: any) {
      console.error('Failed to delete customer:', error);
      setError(`Failed to delete customer: ${error.message}`);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery) ||
      customer.segment?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSegment = segmentFilter === 'all' || customer.segment === segmentFilter;

    return matchesSearch && matchesSegment;
  });

  const segments = ['all', 'new', 'regular', 'loyal', 'vip', 'inactive'];

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'vip': return Crown;
      case 'loyal': return Heart;
      case 'regular': return UserCheck;
      case 'new': return Users;
      case 'inactive': return Clock;
      default: return Users;
    }
  };

  return (
    <div className="customers-container">
      <motion.div
        className="customers-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="customers-header__content">
          <div className="customers-header__title">
            <h1>Customer Management</h1>
            {lastRefresh && (
              <div className="last-refresh-container">
                <span className={`last-refresh ${isBlinking ? 'blinking' : ''}`}>
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
                <span className="realtime-indicator">• Live</span>
              </div>
            )}
          </div>
          <div className="customers-header__actions">

            <motion.button
              className="customers-refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Refresh Customer Data"
            >
              <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </motion.button>
            <motion.button
              className="customers-add-btn"
              onClick={() => setIsNewCustomerOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <UserPlus size={18} />
              Add Customer
            </motion.button>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div 
          className={`error-banner ${error.includes('✅') ? 'success-banner' : ''}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </motion.div>
      )}

      {stats && <CustomerStats stats={stats} />}

      <div className="customers-content">
        <div className="customers-main-grid">
          <div className="customers-table-section">
            <div className="customers-table__header">
              <div className="customers-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search customers by name, segment, or contact info..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="customers-search__input"
                />
              </div>
              <div className="customers-filters">
                <div className="segment-filter">
                  <Filter size={16} />
                  <select 
                    value={segmentFilter} 
                    onChange={(e) => setSegmentFilter(e.target.value)}
                    className="segment-filter-select"
                  >
                    {segments.map(segment => {
                      const IconComponent = getSegmentIcon(segment);
                      return (
                        <option key={segment} value={segment}>
                          {segment === 'all' ? 'All Segments' : segment.charAt(0).toUpperCase() + segment.slice(1)}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="customers-table__stats">
                <span>{filteredCustomers.length} customers</span>
                {searchQuery && (
                  <span className="customers-search__hint">
                    matching "{searchQuery}"
                  </span>
                )}
                {segmentFilter !== 'all' && (
                  <span className="customers-segment__hint">
                    in {segmentFilter} segment
                  </span>
                )}
              </div>
            </div>
            <CustomerTable
              customers={filteredCustomers}
              loading={loading}
              onRefresh={handleRefresh}
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteCustomer}
            />
          </div>
          <div className="customers-sidebar">
            <FrequentCustomers customers={filteredCustomers} />
          </div>
        </div>
      </div>

      <NewCustomerModal
        isOpen={isNewCustomerOpen}
        onClose={() => {
          setIsNewCustomerOpen(false);
          setEditingCustomer(null);
        }}
        onCustomerAdded={handleNewCustomerCreated}
        editingCustomer={editingCustomer}
      />
    </div>
  );
};

export default CustomersPage;