// src/renderer/components/suppliers/components/ErrorBanner.tsx
import React from 'react';

interface ErrorBannerProps {
  error: string | null;
  onClose: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="error-banner">
      <span>{error}</span>
      <button className="error-close" onClick={onClose}>×</button>
    </div>
  );
};

