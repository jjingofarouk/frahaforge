// src/renderer/src/components/pos/RefreshIndicator.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useGlobalPosStore } from '../../src/stores/globalPosStore';
import './RefreshIndicator.css';

export const RefreshIndicator: React.FC = () => {
  const { loading } = useGlobalPosStore();
  const isRefreshing = Object.values(loading).some(Boolean);

  return (
    <AnimatePresence mode="wait">
      {isRefreshing && (
        <motion.div
          className="refresh-indicator"
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{
            duration: 0.22,
            ease: [0.16, 1, 0.3, 1], // smooth easeOutExpo-like
          }}
        >
          <Loader2
            size={13}
            strokeWidth={2.2}
            className="refresh-icon"
            style={{ animationDuration: '0.9s' }}
          />
          <span className="refresh-text"></span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};