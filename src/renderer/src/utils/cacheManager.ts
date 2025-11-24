// src/renderer/src/utils/cacheManager.ts
import { enhancedImageCache } from './imageCache';

class CacheManager {
  private maxCacheSize = 100 * 1024 * 1024; // 100MB
  private managementInterval: NodeJS.Timeout | null = null;

  async manageCache(): Promise<void> {
    try {
      console.log('Managing image cache...');
      await enhancedImageCache.manageStorage();
      console.log('Image cache management completed');
    } catch (error) {
      console.warn('Cache management failed:', error);
    }
  }

  // Start automatic cache management
  startCacheManagement(): void {
    // Clear any existing interval
    if (this.managementInterval) {
      clearInterval(this.managementInterval);
    }

    // Check cache every hour
    this.managementInterval = setInterval(() => {
      this.manageCache();
    }, 60 * 60 * 1000);
    
    // Also check on startup
    this.manageCache();

    console.log('Cache management started');
  }

  // Stop cache management
  stopCacheManagement(): void {
    if (this.managementInterval) {
      clearInterval(this.managementInterval);
      this.managementInterval = null;
      console.log('Cache management stopped');
    }
  }

  // Get cache statistics
  async getStats() {
    try {
      return await enhancedImageCache.getCacheStats();
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        browserCacheSize: 0,
        persistentStorageSize: 0,
        persistentFileCount: 0
      };
    }
  }

  // Clear all cache
  async clearAllCache(): Promise<void> {
    try {
      await enhancedImageCache.clearAllCache();
      console.log('All cache cleared');
    } catch (error) {
      console.error('Failed to clear all cache:', error);
      throw error;
    }
  }

  // Clear browser cache only
  async clearBrowserCache(): Promise<void> {
    try {
      await enhancedImageCache.clearBrowserCache();
      console.log('Browser cache cleared');
    } catch (error) {
      console.error('Failed to clear browser cache:', error);
      throw error;
    }
  }

  // Clear persistent storage only
  async clearPersistentStorage(): Promise<void> {
    try {
      await enhancedImageCache.clearPersistentStorage();
      console.log('Persistent storage cleared');
    } catch (error) {
      console.error('Failed to clear persistent storage:', error);
      throw error;
    }
  }

  // Preload important images
  async preloadImages(urls: string[]): Promise<void> {
    try {
      await enhancedImageCache.preloadImages(urls);
      console.log(`Preloaded ${urls.length} images`);
    } catch (error) {
      console.warn('Failed to preload some images:', error);
    }
  }
}

// Create and export a singleton instance
export const cacheManager = new CacheManager();