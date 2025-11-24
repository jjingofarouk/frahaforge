// src/renderer/src/components/customers/components/CustomerStats.tsx
import React, { useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Target, ArrowUpRight, ArrowDownRight, Crown, Heart, Clock, UserPlus } from 'lucide-react';
import { CustomerStats as CustomerStatsType } from '../../services/customerService';
import './CustomerStats.css';

interface CustomerStatsProps {
  stats: CustomerStatsType;
  previousStats?: CustomerStatsType;
}

type TrendType = 'up' | 'down' | 'neutral';

interface PercentageChange {
  value: number;
  trend: TrendType;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  change: PercentageChange;
  description: string;
  segment?: string;
  color: string;
  iconColor: string;
}

const CustomerStats: React.FC<CustomerStatsProps> = ({ stats, previousStats }) => {
  const calculatePercentageChange = (current: number, previous: number): PercentageChange => {
    if (previous === 0) {
      return { value: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'neutral' };
    }
    
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change)),
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  };

  const segmentCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    stats.segment_distribution?.forEach(segment => {
      counts[segment.segment] = segment.customer_count;
    });
    return counts;
  }, [stats.segment_distribution]);

  const previousSegmentCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    previousStats?.segment_distribution?.forEach(segment => {
      counts[segment.segment] = segment.customer_count;
    });
    return counts;
  }, [previousStats?.segment_distribution]);

  const statsCards: StatCard[] = [
    {
      label: 'Total Customers',
      value: stats.total_customers,
      icon: Users,
      change: previousStats ? calculatePercentageChange(stats.total_customers, previousStats.total_customers) : { value: 0, trend: 'neutral' },
      description: 'All registered customers',
      color: 'var(--card-blue)',
      iconColor: 'var(--icon-blue)'
    },
    {
      label: 'Active Customers',
      value: stats.active_customers,
      icon: Target,
      change: previousStats ? calculatePercentageChange(stats.active_customers, previousStats.active_customers) : { value: 0, trend: 'neutral' },
      description: 'Orders in last 30 days',
      color: 'var(--card-green)',
      iconColor: 'var(--icon-green)'
    },
    {
      label: 'New Today',
      value: stats.new_customers_today,
      icon: UserPlus,
      change: { value: 0, trend: 'neutral' },
      description: 'Registered today',
      color: 'var(--card-purple)',
      iconColor: 'var(--icon-purple)'
    },
    {
      label: 'Avg Order Value',
      value: `UGX ${Math.round(stats.average_order_value).toLocaleString()}`,
      icon: DollarSign,
      change: previousStats ? calculatePercentageChange(stats.average_order_value, previousStats.average_order_value) : { value: 0, trend: 'neutral' },
      description: 'Average spend per order',
      color: 'var(--card-orange)',
      iconColor: 'var(--icon-orange)'
    },
    {
      label: 'VIP Customers',
      value: segmentCounts['vip'] || 0,
      icon: Crown,
      change: previousStats ? calculatePercentageChange(segmentCounts['vip'] || 0, previousSegmentCounts['vip'] || 0) : { value: 0, trend: 'neutral' },
      description: 'High-value customers',
      segment: 'vip',
      color: 'var(--card-gold)',
      iconColor: 'var(--icon-gold)'
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    hover: {
      y: -6,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.2,
      }
    }
  };

  const iconVariants: Variants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.5,
        ease: [0.34, 1.56, 0.64, 1],
      }
    },
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: {
        duration: 0.3,
      }
    }
  };

  const valueVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        delay: 0.2,
      }
    }
  };

  const formatValue = (value: string | number): string => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };

  const segmentDistribution = useMemo(() => {
    return stats.segment_distribution?.map(segment => ({
      ...segment,
      percentage: Math.round(segment.percentage)
    })) || [];
  }, [stats.segment_distribution]);

  return (
    <div className="customers-stats">
      <motion.div 
        className="stats-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {statsCards.map((stat) => (
          <motion.div
            key={stat.label}
            className="stat-card"
            style={{ backgroundColor: stat.color }}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
          >
            <div className="stat-card__header">
              <motion.div
                className="stat-card__icon-wrapper"
                style={{ color: stat.iconColor }}
                variants={iconVariants}
              >
                <stat.icon size={20} />
              </motion.div>
              <span className="stat-card__label">{stat.label}</span>
            </div>
            
            <motion.div 
              className="stat-card__value"
              variants={valueVariants}
            >
              {formatValue(stat.value)}
            </motion.div>
            
            <div className="stat-card__footer">
              <span className="stat-card__description">{stat.description}</span>
              {stat.change.value > 0 && (
                <motion.div 
                  className={`stat-card__change stat-card__change--${stat.change.trend}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {stat.change.trend === 'up' ? (
                    <ArrowUpRight size={12} strokeWidth={2} />
                  ) : stat.change.trend === 'down' ? (
                    <ArrowDownRight size={12} strokeWidth={2} />
                  ) : null}
                  <span>{stat.change.value}%</span>
                </motion.div>
              )}
            </div>

            {/* Background decorative elements */}
            <motion.div 
              className="stat-card__decoration"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            />
          </motion.div>
        ))}
      </motion.div>

      {segmentDistribution.length > 0 && (
        <motion.div 
          className="segment-distribution"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.5,
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          whileHover={{ y: -2 }}
        >
          <div className="segment-distribution__header">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Users size={16} />
            </motion.div>
            <span>Customer Segments</span>
          </div>
          <div className="segment-distribution__content">
            {segmentDistribution.map((segment, index) => (
              <motion.div 
                key={segment.segment} 
                className="segment-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: 0.6 + index * 0.1,
                  duration: 0.4
                }}
              >
                <div className="segment-item__header">
                  <span className="segment-item__name">
                    {segment.segment.charAt(0).toUpperCase() + segment.segment.slice(1)}
                  </span>
                  <div className="segment-item__values">
                    <span className="segment-item__count">{segment.customer_count}</span>
                    <span className="segment-item__percentage">{segment.percentage}%</span>
                  </div>
                </div>
                <div className="segment-item__bar">
                  <motion.div
                    className="segment-item__fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${segment.percentage}%` }}
                    transition={{ 
                      duration: 0.8, 
                      delay: 0.7 + index * 0.1,
                      ease: [0.34, 1.56, 0.64, 1]
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {previousStats && (
        <motion.div 
          className="stats-insights"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.8,
            duration: 0.5
          }}
          whileHover={{ y: -2 }}
        >
          <div className="insights-header">
            <motion.div
              whileHover={{ scale: 1.2 }}
              transition={{ duration: 0.3 }}
            >
              <TrendingUp size={16} />
            </motion.div>
            <span>Performance Insights</span>
          </div>
          <div className="insights-content">
            {stats.total_customers > previousStats.total_customers && (
              <motion.div 
                className="insight-item insight-item--positive"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                whileHover={{ x: 5 }}
              >
                Customer base grew by {stats.total_customers - previousStats.total_customers}
              </motion.div>
            )}
            {stats.average_order_value > previousStats.average_order_value && (
              <motion.div 
                className="insight-item insight-item--positive"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
                whileHover={{ x: 5 }}
              >
                Avg order value increased by UGX {Math.round(stats.average_order_value - previousStats.average_order_value).toLocaleString()}
              </motion.div>
            )}
            {stats.active_customers > previousStats.active_customers && (
              <motion.div 
                className="insight-item insight-item--positive"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 }}
                whileHover={{ x: 5 }}
              >
                Active customers increased by {stats.active_customers - previousStats.active_customers}
              </motion.div>
            )}
            {(segmentCounts['vip'] || 0) > (previousSegmentCounts['vip'] || 0) && (
              <motion.div 
                className="insight-item insight-item--positive"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
                whileHover={{ x: 5 }}
              >
                VIP customers increased by {(segmentCounts['vip'] || 0) - (previousSegmentCounts['vip'] || 0)}
              </motion.div>
            )}
            {stats.total_customers < previousStats.total_customers && (
              <motion.div 
                className="insight-item insight-item--negative"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                whileHover={{ x: 5 }}
              >
                Customer base decreased by {previousStats.total_customers - stats.total_customers}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CustomerStats;