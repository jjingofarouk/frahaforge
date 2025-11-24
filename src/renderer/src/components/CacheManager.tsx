// src/renderer/src/components/CacheManager.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Database, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { enhancedImageCache } from '../utils/imageCache';
import './CacheManager.css';

const CacheManager: React.FC = () => {
  const [stats, setStats] = useState({
    browserCacheSize: 0,
    persistentStorageSize: 0,
    persistentFileCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const cacheStats = await enhancedImageCache.getCacheStats();
      setStats(cacheStats);
      showMessage('success', 'Cache stats updated');
    } catch (error) {
      console.error('Failed to load cache stats:', error);
      showMessage('error', 'Failed to load cache stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClearBrowserCache = async () => {
    setLoading(true);
    try {
      await enhancedImageCache.clearBrowserCache();
      await loadStats();
      showMessage('success', 'Browser cache cleared');
    } catch (error) {
      console.error('Failed to clear browser cache:', error);
      showMessage('error', 'Failed to clear browser cache');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllCache = async () => {
    setLoading(true);
    try {
      await enhancedImageCache.clearAllCache();
      await loadStats();
      showMessage('success', 'All cache cleared');
    } catch (error) {
      console.error('Failed to clear all cache:', error);
      showMessage('error', 'Failed to clear all cache');
    } finally {
      setLoading(false);
    }
  };

  const handleManageStorage = async () => {
    setLoading(true);
    try {
      await enhancedImageCache.manageStorage();
      await loadStats();
      showMessage('success', 'Storage managed successfully');
    } catch (error) {
      console.error('Failed to manage storage:', error);
      showMessage('error', 'Failed to manage storage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cache-manager">
      <div className="cache-header">
        <h4>Image Cache Management</h4>
        <motion.button
          onClick={loadStats}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className="refresh-btn"
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          Refresh
        </motion.button>
      </div>

      {message && (
        <motion.div
          className={`cache-message ${message.type}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </motion.div>
      )}

      <div className="cache-stats">
        <div className="stat-item">
          <span className="stat-label">Browser Cache:</span>
          <span className="stat-value">{formatBytes(stats.browserCacheSize)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Local Storage:</span>
          <span className="stat-value">
            {formatBytes(stats.persistentStorageSize)} ({stats.persistentFileCount} files)
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Cached:</span>
          <span className="stat-value">
            {formatBytes(stats.browserCacheSize + stats.persistentStorageSize)}
          </span>
        </div>
      </div>

      <div className="cache-actions">
        <motion.button
          onClick={handleClearBrowserCache}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading || stats.browserCacheSize === 0}
          className="action-btn clear-browser-btn"
        >
          <Trash2 size={16} />
          Clear Browser Cache
        </motion.button>

        <motion.button
          onClick={handleManageStorage}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className="action-btn manage-btn"
        >
          <Database size={16} />
          Manage Storage
        </motion.button>

        <motion.button
          onClick={handleClearAllCache}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className="action-btn clear-all-btn"
        >
          <Trash2 size={16} />
          Clear All Cache
        </motion.button>
      </div>
    </div>
  );
};

export default CacheManager;