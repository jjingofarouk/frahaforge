// Updated SupplierMetricsCard.tsx with new CSS classes
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './SupplierMetricsCard.css';

interface SupplierMetricsCardProps {
  title: string;
  value: string;
  description: string;
  trend: 'up' | 'down' | 'neutral';
}

const SupplierMetricsCard: React.FC<SupplierMetricsCardProps> = ({
  title,
  value,
  description,
  trend
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="metrics-trend up" />;
      case 'down':
        return <TrendingDown className="metrics-trend down" />;
      default:
        return <Minus className="metrics-trend neutral" />;
    }
  };

  return (
    <div className="metrics-card" tabIndex={0}>
      <div className="metrics-header">
        <h3 className="metrics-title">{title}</h3>
        {getTrendIcon()}
      </div>
      
      <div className={`metrics-value ${trend}`}>
        {value}
      </div>
      
      <p className="metrics-description">
        {description}
      </p>
    </div>
  );
};

export default SupplierMetricsCard;