// src/renderer/src/components/customers/components/MarketingInsights.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Award, Package, Target, BarChart3 } from 'lucide-react';

interface MarketingInsightsProps {
  insights: any;
  loading: boolean;
}

const MarketingInsights: React.FC<MarketingInsightsProps> = ({ insights, loading }) => {
  if (loading) {
    return (
      <div className="marketing-insights-loading">
        <div className="spinner"></div>
        <p>Loading marketing insights...</p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="marketing-insights-empty">
        <BarChart3 size={48} />
        <h3>No Data Available</h3>
        <p>Marketing insights will appear as customer data accumulates</p>
      </div>
    );
  }

  return (
    <div className="marketing-insights">
      <div className="marketing-insights-header">
        <h2>Marketing Intelligence</h2>
        <p>Data-driven insights for targeted marketing campaigns</p>
      </div>

      {/* Customer Segments */}
      <div className="insights-section">
        <h3>Customer Segments</h3>
        <div className="segments-grid">
          <motion.div className="segment-card vip" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="segment-icon">
              <Award size={24} />
            </div>
            <div className="segment-content">
              <h4>VIP Customers</h4>
              <p className="segment-count">{insights.customerSegments.vip.length} customers</p>
              <p className="segment-desc">High-value, frequent purchasers</p>
            </div>
          </motion.div>

          <motion.div className="segment-card frequent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="segment-icon">
              <TrendingUp size={24} />
            </div>
            <div className="segment-content">
              <h4>Frequent Buyers</h4>
              <p className="segment-count">{insights.customerSegments.frequent.length} customers</p>
              <p className="segment-desc">Regular, loyal customers</p>
            </div>
          </motion.div>

          <motion.div className="segment-card regular" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="segment-icon">
              <Users size={24} />
            </div>
            <div className="segment-content">
              <h4>Regular Customers</h4>
              <p className="segment-count">{insights.customerSegments.regular.length} customers</p>
              <p className="segment-desc">Occasional purchasers</p>
            </div>
          </motion.div>

          <motion.div className="segment-card new" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="segment-icon">
              <Target size={24} />
            </div>
            <div className="segment-content">
              <h4>New Customers</h4>
              <p className="segment-count">{insights.customerSegments.new.length} customers</p>
              <p className="segment-desc">Recent first-time buyers</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Popular Products */}
      <div className="insights-section">
        <h3>Top Performing Products</h3>
        <div className="products-grid">
          {insights.popularProducts.map((product: any, index: number) => (
            <motion.div 
              key={product.productName}
              className="product-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="product-rank">#{index + 1}</div>
              <div className="product-icon">
                <Package size={20} />
              </div>
              <div className="product-details">
                <h4 className="product-name">{product.productName}</h4>
                <div className="product-stats">
                  <div className="product-stat">
                    <span>Revenue:</span>
                    <strong>UGX {product.totalRevenue.toLocaleString()}</strong>
                  </div>
                  <div className="product-stat">
                    <span>Sold:</span>
                    <strong>{product.totalSold} units</strong>
                  </div>
                  <div className="product-stat">
                    <span>Customers:</span>
                    <strong>{product.customerCount}</strong>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Campaign Recommendations */}
      <div className="insights-section">
        <h3>Marketing Recommendations</h3>
        <div className="recommendations-grid">
          <motion.div className="recommendation-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h4>🎯 VIP Loyalty Program</h4>
            <p>Create exclusive offers for {insights.customerSegments.vip.length} VIP customers to maintain loyalty</p>
          </motion.div>

          <motion.div className="recommendation-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h4>📧 Re-engagement Campaign</h4>
            <p>Target {insights.customerSegments.regular.length} regular customers with personalized offers</p>
          </motion.div>

          <motion.div className="recommendation-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h4>🆕 Welcome Series</h4>
            <p>Onboard {insights.customerSegments.new.length} new customers with welcome discounts</p>
          </motion.div>

          <motion.div className="recommendation-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h4>📊 Product Promotion</h4>
            <p>Feature top products in marketing campaigns to drive additional sales</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MarketingInsights;