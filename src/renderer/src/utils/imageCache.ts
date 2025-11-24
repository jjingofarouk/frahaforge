// src/renderer/src/utils/imageCache.ts
class EnhancedImageCache {
  private cacheName = 'pharmacy-images-v2';
  private isSupported = 'caches' in window;
  private localStorageKey = 'pharmacy-image-cache-v2';
  private maxLocalStorageSize = 5 * 1024 * 1024; // 5MB

  async cacheImage(url: string): Promise<string> {
    // Return original URL if caching is not supported
    if (!this.isSupported) {
      return url;
    }

    // Return original URL for data URLs or invalid URLs
    if (!url || url.startsWith('data:') || url.trim() === '') {
      return url;
    }

    try {
      // First try browser cache
      const browserCacheUrl = await this.getFromBrowserCache(url);
      if (browserCacheUrl) return browserCacheUrl;

      // Then try localStorage for small images (fallback)
      const localStorageUrl = await this.getFromLocalStorage(url);
      if (localStorageUrl) return localStorageUrl;

      // Finally download and cache
      return await this.downloadAndCache(url);
    } catch (error) {
      console.warn('Image cache failed, using original URL:', url, error);
      return url;
    }
  }

  private async getFromBrowserCache(url: string): Promise<string | null> {
    try {
      const cache = await caches.open(this.cacheName);
      const cachedResponse = await cache.match(url);
      
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.warn('Browser cache access failed:', error);
    }
    return null;
  }

  private async getFromLocalStorage(url: string): Promise<string | null> {
    try {
      const key = `${this.localStorageKey}-${this.hashString(url)}`;
      const stored = localStorage.getItem(key);
      if (stored && this.isValidUrl(stored)) {
        return stored;
      }
    } catch (error) {
      console.warn('Local storage access failed:', error);
    }
    return null;
  }

  private isValidUrl(url: string): boolean {
    return url.startsWith('blob:') || url.startsWith('http');
  }

  private async downloadAndCache(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Check if blob is valid image
    if (!blob.type.startsWith('image/')) {
      throw new Error('Invalid image type: ' + blob.type);
    }

    const blobUrl = URL.createObjectURL(blob);

    // Cache in browser (non-blocking)
    this.cacheInBrowser(url, blob).catch(console.warn);

    // Cache small images in localStorage (under 500KB)
    if (blob.size < 500 * 1024) {
      this.cacheInLocalStorage(url, blobUrl).catch(console.warn);
    }

    return blobUrl;
  }

  private async cacheInBrowser(url: string, blob: Blob): Promise<void> {
    try {
      const cache = await caches.open(this.cacheName);
      const response = new Response(blob);
      await cache.put(url, response);
    } catch (error) {
      console.warn('Browser caching failed:', error);
    }
  }

  private async cacheInLocalStorage(url: string, blobUrl: string): Promise<void> {
    try {
      const key = `${this.localStorageKey}-${this.hashString(url)}`;
      
      // Check localStorage size before adding
      const currentSize = this.getLocalStorageSize();
      if (currentSize + blobUrl.length > this.maxLocalStorageSize) {
        console.warn('Local storage full, skipping cache');
        return;
      }
      
      localStorage.setItem(key, blobUrl);
    } catch (error) {
      console.warn('Local storage caching failed:', error);
    }
  }

  private getLocalStorageSize(): number {
    let total = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.localStorageKey)) {
          const value = localStorage.getItem(key);
          if (value) {
            total += key.length + value.length;
          }
        }
      }
    } catch (error) {
      console.warn('Local storage size calculation failed:', error);
    }
    return total;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  async preloadImages(urls: string[]): Promise<void> {
    if (!this.isSupported) return;

    const validUrls = urls.filter(url => url && url.trim() !== '');
    
    // Preload in batches to avoid overwhelming the browser
    const batchSize = 5;
    for (let i = 0; i < validUrls.length; i += batchSize) {
      const batch = validUrls.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(async (url) => {
          try {
            await this.cacheImage(url);
          } catch (error) {
            console.warn(`Failed to preload image: ${url}`, error);
          }
        })
      );
      
      // Small delay between batches
      if (i + batchSize < validUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  async clearBrowserCache(): Promise<void> {
    if (!this.isSupported) return;
    
    try {
      const cache = await caches.open(this.cacheName);
      const keys = await cache.keys();
      
      // Revoke all object URLs
      keys.forEach(request => {
        cache.match(request).then(response => {
          if (response) {
            response.blob().then(blob => {
              URL.revokeObjectURL(URL.createObjectURL(blob));
            });
          }
        });
      });
      
      await caches.delete(this.cacheName);
    } catch (error) {
      console.warn('Browser cache clear failed:', error);
      throw error;
    }
  }

  async clearLocalStorageCache(): Promise<void> {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.localStorageKey)) {
          // Revoke object URL before removing
          const blobUrl = localStorage.getItem(key);
          if (blobUrl && blobUrl.startsWith('blob:')) {
            URL.revokeObjectURL(blobUrl);
          }
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Local storage cache clear failed:', error);
      throw error;
    }
  }

  async clearPersistentStorage(): Promise<void> {
    await this.clearLocalStorageCache();
  }

  async clearAllCache(): Promise<void> {
    await Promise.allSettled([
      this.clearBrowserCache(),
      this.clearLocalStorageCache()
    ]);
  }

  async getCacheStats(): Promise<{
    browserCacheSize: number;
    persistentStorageSize: number;
    persistentFileCount: number;
  }> {
    let browserCacheSize = 0;
    let persistentStorageSize = 0;
    let persistentFileCount = 0;

    // Browser cache size
    if (this.isSupported) {
      try {
        const cache = await caches.open(this.cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            browserCacheSize += blob.size;
          }
        }
      } catch (error) {
        console.warn('Browser cache stats failed:', error);
      }
    }

    // Local storage stats
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.localStorageKey)) {
          const value = localStorage.getItem(key);
          if (value) {
            persistentStorageSize += key.length + value.length;
            persistentFileCount++;
          }
        }
      }
    } catch (error) {
      console.warn('Local storage stats failed:', error);
    }

    return {
      browserCacheSize,
      persistentStorageSize,
      persistentFileCount
    };
  }

  async manageStorage(): Promise<void> {
    try {
      const stats = await this.getCacheStats();
      
      // Clear browser cache if too large (50MB)
      if (stats.browserCacheSize > 50 * 1024 * 1024) {
        console.log('Clearing browser cache due to size:', stats.browserCacheSize);
        await this.clearBrowserCache();
      }
      
      // Clear localStorage cache if too large (2MB)
      if (stats.persistentStorageSize > 2 * 1024 * 1024) {
        console.log('Clearing localStorage cache due to size:', stats.persistentStorageSize);
        await this.clearLocalStorageCache();
      }
    } catch (error) {
      console.warn('Storage management failed:', error);
      throw error;
    }
  }
}

export const enhancedImageCache = new EnhancedImageCache();