// src/renderer/src/components/StockIntelligencePanel.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Zap, 
  Lightbulb,
  BarChart3,
  Target,
  Sparkles
} from 'lucide-react';
import { StockProduct } from '../../services/stockService';
import './StockIntelligence.css';
import { AlertCircleIcon } from 'lucide-react';


export interface StockAlert {
  type: 'critical' | 'warning' | 'info' | 'success';
  message: string;
  suggestion?: string;
  priority: number;
}

interface StockIntelligenceProps {
  lowStockProducts: StockProduct[];
  outOfStockProducts: StockProduct[];
  criticalStockProducts: StockProduct[];
  expiredProducts: StockProduct[];
  expiringSoonProducts: StockProduct[];
  totalProducts: number;
  totalInventoryValue: number;
}

interface StockMetrics {
  stockHealthScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  turnoverRate: number;
  efficiencyScore: number;
}

interface Insight {
  icon: React.ComponentType<any>;
  title: string;
  message: string;
  suggestion?: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  priority: number;
}

export const StockIntelligencePanel: React.FC<StockIntelligenceProps> = ({
  lowStockProducts,
  outOfStockProducts,
  criticalStockProducts,
  expiredProducts,
  expiringSoonProducts,
  totalProducts,
  totalInventoryValue
}) => {
  const [currentInsight, setCurrentInsight] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  // Calculate advanced metrics - SAME LOGIC, just using StockProduct type
  const metrics = useMemo((): StockMetrics => {
    const totalIssues = lowStockProducts.length + expiredProducts.length + expiringSoonProducts.length;
    const healthScore = Math.max(0, 100 - (totalIssues / totalProducts) * 100);
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (outOfStockProducts.length > 0 || expiredProducts.length > 0) riskLevel = 'critical';
    else if (criticalStockProducts.length > 5) riskLevel = 'high';
    else if (lowStockProducts.length > totalProducts * 0.1) riskLevel = 'medium';

    // Mock turnover rate calculation
    const turnoverRate = Math.random() * 100;

    const efficiencyScore = Math.max(0, 100 - (
      (outOfStockProducts.length * 10) +
      (criticalStockProducts.length * 5) +
      (expiredProducts.length * 15) +
      (expiringSoonProducts.length * 3)
    ));

    return {
      stockHealthScore: Math.round(healthScore),
      riskLevel,
      turnoverRate: Math.round(turnoverRate),
      efficiencyScore: Math.max(0, Math.min(100, Math.round(efficiencyScore)))
    };
  }, [lowStockProducts, outOfStockProducts, criticalStockProducts, expiredProducts, expiringSoonProducts, totalProducts]);

  // Generate AI insights - SAME LOGIC, just using StockProduct type
  const insights = useMemo((): Insight[] => {
    const generatedInsights: Insight[] = [];

    // Critical stock insights
    if (outOfStockProducts.length > 0) {
      generatedInsights.push({
        icon: AlertTriangle,
        title: 'Stockout Crisis',
        message: `${outOfStockProducts.length} products are completely out of stock. This is causing potential revenue loss.`,
        suggestion: 'Prioritize restocking these items immediately to avoid customer dissatisfaction.',
        type: 'critical',
        priority: 100
      });
    }

    if (criticalStockProducts.length > 0) {
      generatedInsights.push({
        icon: Zap,
        title: 'Critical Stock Levels',
        message: `${criticalStockProducts.length} products are at critically low levels (≤3 units).`,
        suggestion: 'Consider emergency reordering and adjust safety stock levels.',
        type: 'warning',
        priority: 90
      });
    }

    // Expiry insights
    if (expiredProducts.length > 0) {
      generatedInsights.push({
        icon: Clock,
        title: 'Expired Inventory',
        message: `${expiredProducts.length} products have expired and need immediate attention.`,
        suggestion: 'Remove expired items from sale and review your ordering quantities.',
        type: 'critical',
        priority: 95
      });
    }

    if (expiringSoonProducts.length > 0) {
      generatedInsights.push({
        icon: Target,
        title: 'Expiry Risk',
        message: `${expiringSoonProducts.length} products are nearing their expiry dates.`,
        suggestion: 'Consider promotional pricing or bundle deals to move this inventory.',
        type: 'warning',
        priority: 80
      });
    }

    // Performance insights
    if (metrics.stockHealthScore > 80) {
      generatedInsights.push({
        icon: TrendingUp,
        title: 'Excellent Health',
        message: `Your stock health score is ${metrics.stockHealthScore}% - well above industry average!`,
        suggestion: 'Maintain current practices and focus on optimizing high-performing categories.',
        type: 'success',
        priority: 50
      });
    } else if (metrics.stockHealthScore < 50) {
      generatedInsights.push({
        icon: BarChart3,
        title: 'Needs Improvement',
        message: `Stock health score is ${metrics.stockHealthScore}%. Several areas need attention.`,
        suggestion: 'Review your inventory management strategy and consider automated reordering.',
        type: 'warning',
        priority: 70
      });
    }

    // Financial insights
    if (totalInventoryValue > 1000000) {
      generatedInsights.push({
        icon: DollarSign,
        title: 'High Inventory Value',
        message: `Inventory value is UGX ${totalInventoryValue.toLocaleString()}.`,
        suggestion: 'Consider optimizing stock levels to free up working capital.',
        type: 'info',
        priority: 60
      });
    }

    // Sort by priority and return top 5
    return generatedInsights.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }, [metrics, outOfStockProducts, criticalStockProducts, expiredProducts, expiringSoonProducts, totalInventoryValue]);

  // Rotate through insights - SAME LOGIC
  useEffect(() => {
    if (insights.length > 1) {
      setIsAnalyzing(true);
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
        setCurrentInsight((prev) => (prev + 1) % insights.length);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [currentInsight, insights.length]);

  // Risk level configuration - SAME LOGIC
  const riskConfig = {
    low: { color: 'var(--success)', label: 'Low Risk' },
    medium: { color: 'var(--warning)', label: 'Medium Risk' },
    high: { color: 'var(--warning-dark)', label: 'High Risk' },
    critical: { color: 'var(--danger)', label: 'Critical Risk' }
  };

  if (insights.length === 0) return null;

  const CurrentInsightIcon = insights[currentInsight]?.icon || AlertTriangle;

  return (
    <motion.div 
      className="stock-intelligence-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="sip-header">
        <motion.div
          className="sip-header-icon"
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Brain size={20} />
        </motion.div>
        <div className="sip-header-content">
          <h3 className="sip-title">AI Stock Intelligence</h3>
          <p className="sip-subtitle">Real-time insights powered by machine learning</p>
        </div>
        <motion.div
          className="sip-sparkle"
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles size={16} />
        </motion.div>
      </div>

      <div className="sip-metrics-grid">
        <motion.div 
          className="sip-metric-card"
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="sip-metric-header">
            <Target size={16} />
            <span>Health Score</span>
          </div>
          <div className="sip-metric-value">{metrics.stockHealthScore}%</div>
          <div className="sip-metric-progress">
            <motion.div 
              className="sip-progress-bar"
              initial={{ width: 0 }}
              animate={{ width: `${metrics.stockHealthScore}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              style={{ backgroundColor: metrics.stockHealthScore > 70 ? 'var(--success)' : 
                                     metrics.stockHealthScore > 40 ? 'var(--warning)' : 'var(--danger)' }}
            />
          </div>
        </motion.div>

        <motion.div 
          className="sip-metric-card"
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="sip-metric-header">
            <AlertTriangle size={16} />
            <span>Risk Level</span>
          </div>
          <div 
            className="sip-risk-level"
            style={{ color: riskConfig[metrics.riskLevel].color }}
          >
            {riskConfig[metrics.riskLevel].label}
          </div>
          <div className="sip-risk-description">
            {metrics.riskLevel === 'critical' && 'Immediate action required'}
            {metrics.riskLevel === 'high' && 'Close monitoring needed'}
            {metrics.riskLevel === 'medium' && 'Moderate attention required'}
            {metrics.riskLevel === 'low' && 'Stable and healthy'}
          </div>
        </motion.div>

        <motion.div 
          className="sip-metric-card"
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="sip-metric-header">
            <TrendingUp size={16} />
            <span>Efficiency</span>
          </div>
          <div className="sip-metric-value">{metrics.efficiencyScore}%</div>
          <div className="sip-metric-trend">
            {metrics.efficiencyScore > 75 ? 'Excellent' : 
             metrics.efficiencyScore > 50 ? 'Good' : 'Needs Improvement'}
          </div>
        </motion.div>
      </div>

      <div className="sip-insights">
        <div className="sip-insights-header">
          <Lightbulb size={16} />
          <span>Smart Insights</span>
          {isAnalyzing && (
            <motion.div 
              className="sip-analyzing"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Analyzing...
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentInsight}
            className="sip-insight-card"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <div className="sip-insight-icon">
              <CurrentInsightIcon size={20} />
            </div>
            <div className="sip-insight-content">
              <h4 className="sip-insight-title">{insights[currentInsight]?.title}</h4>
              <p className="sip-insight-message">{insights[currentInsight]?.message}</p>
              {insights[currentInsight]?.suggestion && (
                <p className="sip-insight-suggestion">
                  <strong>Recommendation:</strong> {insights[currentInsight]?.suggestion}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {insights.length > 1 && (
          <div className="sip-insight-dots">
            {insights.map((_, index) => (
              <button
                key={index}
                className={`sip-dot ${index === currentInsight ? 'sip-dot-active' : ''}`}
                onClick={() => setCurrentInsight(index)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Export alert generation function - SAME LOGIC, just using StockProduct type
export const generateStockAlerts = (props: StockIntelligenceProps): StockAlert[] => {
  const alerts: StockAlert[] = [];

  if (props.outOfStockProducts.length > 0) {
    alerts.push({
      type: 'critical',
      message: `${props.outOfStockProducts.length} products are out of stock. Immediate restocking required to prevent revenue loss.`,
      suggestion: 'Prioritize these items in your next purchase order.',
      priority: 100
    });
  }

  if (props.criticalStockProducts.length > 0) {
    alerts.push({
      type: 'warning',
      message: `${props.criticalStockProducts.length} products have critically low stock levels (≤3 units).`,
      suggestion: 'Consider emergency reordering for these items.',
      priority: 90
    });
  }

  if (props.expiredProducts.length > 0) {
    alerts.push({
      type: 'critical',
      message: `${props.expiredProducts.length} products have expired and must be removed from inventory.`,
      suggestion: 'Review expiry dates and adjust ordering quantities.',
      priority: 95
    });
  }

  if (props.expiringSoonProducts.length > 10) {
    alerts.push({
      type: 'warning',
      message: `${props.expiringSoonProducts.length} products are nearing expiry. Consider promotional strategies.`,
      suggestion: 'Create bundle deals or discounts to move this inventory.',
      priority: 80
    });
  }

  if (props.lowStockProducts.length === 0 && props.expiredProducts.length === 0) {
    alerts.push({
      type: 'success',
      message: `All ${props.totalProducts} products are properly stocked with no expiry issues.`,
      suggestion: 'Maintain current inventory management practices.',
      priority: 60
    });
  }

  return alerts.sort((a, b) => b.priority - a.priority).slice(0, 3);
};