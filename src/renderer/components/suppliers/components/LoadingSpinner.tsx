// src/renderer/components/suppliers/components/LoadingSpinner.tsx
import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
  type?: 'page' | 'product' | 'supplier' | 'chart';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading...", 
  type = 'page' 
}) => {
  if (type === 'page') {
    return (
      <div className="loading-page">
        <div className="skeleton-header">
          <div className="skeleton-line skeleton-title"></div>
          <div className="skeleton-line skeleton-subtitle"></div>
        </div>
        
        <div className="skeleton-controls">
          <div className="skeleton-search"></div>
          <div className="skeleton-button"></div>
        </div>

        <div className="skeleton-stats">
          <div className="skeleton-stat"></div>
          <div className="skeleton-stat"></div>
          <div className="skeleton-stat"></div>
          <div className="skeleton-stat"></div>
        </div>

        <div className="skeleton-content">
          <div className="skeleton-product-header"></div>
          <div className="skeleton-chart"></div>
          <div className="skeleton-suppliers">
            <div className="skeleton-supplier"></div>
            <div className="skeleton-supplier"></div>
            <div className="skeleton-supplier"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-default">
      <div className="skeleton-spinner"></div>
      <div className="skeleton-message">{message}</div>
    </div>
  );
};