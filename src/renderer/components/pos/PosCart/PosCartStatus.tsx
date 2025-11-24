// src/renderer/src/components/pos/PosCart/PosCartStatus.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, ShoppingBag, CheckCircle } from 'lucide-react';
import { transactionsService } from '../../../services/transactionsService';
import authService from '../../../services/authService';

interface PosCartStatusProps {
  cartItemsCount: number;
  customerName?: string;
  isCartEmpty: boolean;
  totalAmount: number;
  onSaleComplete?: () => void;
}

interface DailyStats {
  totalSales: number;
  transactionCount: number;
  averageSale: number;
}

export const PosCartStatus: React.FC<PosCartStatusProps> = ({
  cartItemsCount,
  customerName,
  isCartEmpty,
  totalAmount,
  onSaleComplete
}) => {
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const user = authService.getCurrentUser();

  // Load daily stats
  useEffect(() => {
    const loadDailyStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const summary = await transactionsService.getDailySummary(today);
        
        if (summary && summary.summary) {
          setDailyStats({
            totalSales: summary.summary.total_sales || 0,
            transactionCount: summary.summary.total_transactions || 0,
            averageSale: summary.summary.total_transactions > 0 
              ? (summary.summary.total_sales / summary.summary.total_transactions) 
              : 0
          });
        }
      } catch (error) {
        console.log('Could not load daily stats:', error);
      }
    };

    loadDailyStats();
  }, []);

  // Show success message after sale
  useEffect(() => {
    if (isCartEmpty && showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isCartEmpty, showSuccess]);

  const handleSaleComplete = () => {
    setShowSuccess(true);
    if (onSaleComplete) onSaleComplete();
  };

  // Get status message based on context
  const getStatusMessage = () => {
    if (showSuccess && isCartEmpty) {
      return {
        message: 'Sale completed successfully!',
        icon: <CheckCircle size={14} />,
        color: 'text-green-600',
        showStats: true
      };
    }

    if (!isCartEmpty && customerName) {
      return {
        message: `Processing order for ${customerName}`,
        icon: <Users size={14} />,
        color: 'text-blue-600',
        showStats: false
      };
    }

    if (!isCartEmpty) {
      return {
        message: `${cartItemsCount} item${cartItemsCount !== 1 ? 's' : ''} in cart • UGX ${totalAmount.toLocaleString()}`,
        icon: <ShoppingBag size={14} />,
        color: 'text-purple-600',
        showStats: false
      };
    }

    // Default empty state with stats
    const greeting = user ? `Hi ${user.fullname.split(' ')[0]}` : 'Ready';
    const statsInfo = dailyStats ? ` • ${dailyStats.transactionCount} sales today` : '';
    
    return {
      message: `${greeting}${statsInfo}`,
      icon: <TrendingUp size={14} />,
      color: 'text-gray-600',
      showStats: true
    };
  };

  const status = getStatusMessage();

  return (
    <div className="pos-cart-status-container">
      <motion.div 
        className="pos-cart-status"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={`status-content ${status.color}`}>
          <div className="status-icon">
            {status.icon}
          </div>
          <span className="status-text">{status.message}</span>
        </div>

        {/* Show additional stats when relevant */}
        <AnimatePresence>
          {status.showStats && dailyStats && dailyStats.transactionCount > 0 && (
            <motion.div
              className="daily-stats"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Today's Total:</span>
                  <span className="stat-value">UGX {dailyStats.totalSales.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Sale:</span>
                  <span className="stat-value">UGX {Math.round(dailyStats.averageSale).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Hidden handler for parent components */}
      <div style={{ display: 'none' }}>
        <button onClick={handleSaleComplete}>Complete Sale</button>
      </div>
    </div>
  );
};