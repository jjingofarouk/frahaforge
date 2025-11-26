import { User } from '../types/user.types';
import electronStoreService from './electronStoreService';

const SESSION_KEY = 'fraha_user_session';

class AuthService {
  private currentUser: User | null = null;
private readonly apiUrl = 'http://192.168.1.3:3001/api/';
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.loadSession();
      this.initialized = true;
      console.log('✅ Auth service initialized');
    } catch (error) {
      console.error('❌ Auth service init failed:', error);
      this.initialized = true; // Mark as initialized anyway
    }
  }

  private async loadSession(): Promise<void> {
    try {
      const sessionData = await electronStoreService.get(SESSION_KEY);
      console.log('📦 Loaded session data:', sessionData);
      
      if (sessionData && sessionData.id && sessionData.username) {
        this.currentUser = sessionData as User;
        console.log('✅ Session restored:', this.currentUser.username);
      } else {
        console.log('ℹ️ No valid session found');
        this.currentUser = null;
      }
    } catch (error) {
      console.error('❌ Failed to load session:', error);
      this.currentUser = null;
    }
  }

  async login(credentials: { username: string; password: string }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('🔐 Attempting login:', credentials.username);

      const response = await fetch(`${this.apiUrl}users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        return { success: false, error: 'Invalid username or password' };
      }

      const data = await response.json();
      console.log('📡 Login response:', data);

      if (data.auth && data.id) {
        // Remove password from user data and ensure proper typing
        const { password, ...userData } = data;
        const user: User = {
          id: data.id,
          username: data.username,
          fullname: data.fullname,
          perm_products: data.perm_products || 0,
          perm_categories: data.perm_categories || 0,
          perm_transactions: data.perm_transactions || 0,
          perm_users: data.perm_users || 0,
          perm_settings: data.perm_settings || 0,
          status: data.status || '',
          last_login: data.last_login,
          is_logged_in: data.is_logged_in || 0,
          created_at: data.created_at
        };
        
        // Save to Electron Store
        await this.saveSession(user);
        
        console.log('✅ Login successful, user:', user.fullname);
        return { success: true, user };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'Server connection failed' };
    }
  }

  private async saveSession(user: User): Promise<void> {
    try {
      this.currentUser = user;
      await electronStoreService.set(SESSION_KEY, user);
      console.log('💾 Session saved to Electron Store:', user.username);
    } catch (error) {
      console.error('❌ Failed to save session:', error);
      throw error;
    }
  }

  async logout(): Promise<{ success: boolean }> {
    try {
      console.log('🚪 Logging out...');
      
      if (this.currentUser) {
        // Notify server (but don't wait for it)
        fetch(`${this.apiUrl}users/logout/${this.currentUser.id}`).catch(() => {});
      }
      
      await this.clearSession();
      console.log('✅ Logout complete');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      await this.clearSession();
      return { success: true };
    }
  }

  private async clearSession(): Promise<void> {
    try {
      this.currentUser = null;
      await electronStoreService.delete(SESSION_KEY);
      console.log('🧹 Session cleared from Electron Store');
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  async checkExistingSession(): Promise<{ auth: boolean; user?: User }> {
    if (!this.initialized) {
      await this.initialize();
    }
    return { 
      auth: this.isAuthenticated(), 
      user: this.currentUser || undefined 
    };
  }

  // Simple form validation
  validateForm(form: { username: string; password: string }): { isValid: boolean; error?: string } {
    if (!form.username?.trim()) {
      return { isValid: false, error: 'Username is required' };
    }
    if (!form.password) {
      return { isValid: false, error: 'Password is required' };
    }
    return { isValid: true };
  }
}

// Create singleton instance
const authService = new AuthService();
export default authService;