class ElectronStoreService {
  private isReady = false;
  private initPromise: Promise<void> | null = null;

  private async initialize(): Promise<void> {
    if (this.isReady) return;

    // Check if electron store is available
    if (typeof window.electron?.store === 'undefined') {
      throw new Error('Electron store not available');
    }

    // Test the store with a simple operation
    try {
      const setResult = await window.electron.store.set('store_test', 'working');
      if (!setResult.success) {
        throw new Error(`Store set failed: ${setResult.error}`);
      }

      const testValue = await window.electron.store.get('store_test');
      if (testValue !== 'working') {
        throw new Error('Store test failed - cannot retrieve values');
      }

      // Clean up test
      await window.electron.store.delete('store_test');

      this.isReady = true;
      console.log('✅ Electron Store initialized and tested successfully');
    } catch (error) {
      console.error('❌ Electron Store initialization failed:', error);
      throw error;
    }
  }

  async ensureReady(): Promise<void> {
    if (this.isReady) return;

    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }

    await this.initPromise;
  }

  async get(key: string): Promise<any> {
    await this.ensureReady();
    return await window.electron.store.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    await this.ensureReady();
    const result = await window.electron.store.set(key, value);
    if (!result.success) {
      throw new Error(`Failed to set ${key} in store: ${result.error}`);
    }
  }

  async delete(key: string): Promise<void> {
    await this.ensureReady();
    const result = await window.electron.store.delete(key);
    if (!result.success) {
      throw new Error(`Failed to delete ${key} from store: ${result.error}`);
    }
  }
}

const electronStoreService = new ElectronStoreService();
export default electronStoreService;