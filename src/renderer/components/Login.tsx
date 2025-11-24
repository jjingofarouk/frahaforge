import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, User as UserIcon, RefreshCw } from 'lucide-react';
import authService from '../services/authService';
import { User } from '../types/user.types';
import logo from '../assets/images/logo.png';
import '../../styles/Login.css';

interface FormData {
  username: string;
  password: string;
}

interface LoginProps {
  onLoginSuccess?: (user: User) => void;
  onLoginError?: (error: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onLoginError }) => {
  const [formData, setFormData] = useState<FormData>({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('Checking Electron Store...');

  useEffect(() => {
    const checkStore = async () => {
      try {
        if (typeof window.electron?.store !== 'undefined') {
          // Test store functionality
          await window.electron.store.set('login_test', 'test_value');
          const testValue = await window.electron.store.get('login_test');
          await window.electron.store.delete('login_test');
          
          if (testValue === 'test_value') {
            setDebugInfo('Electron Store: ✅ Working');
          } else {
            setDebugInfo('Electron Store: ❌ Test Failed');
          }
        } else {
          setDebugInfo('Electron Store: ❌ Unavailable');
        }
      } catch (err) {
        setDebugInfo('Electron Store: ❌ Error');
      }
    };

    checkStore();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const validation = authService.validateForm(formData);
    if (!validation.isValid) {
      setError(validation.error || 'Please enter username and password');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔐 Attempting login for:', formData.username);
      
      const result = await authService.login(formData);
      
      if (result.success && result.user) {
        console.log('✅ Login successful:', result.user.fullname);
        onLoginSuccess?.(result.user);
      } else {
        const msg = result.error || 'Invalid username or password';
        console.error('❌ Login failed:', msg);
        setError(msg);
        onLoginError?.(msg);
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const errorMsg = error.message || 'Login failed';
      setError(errorMsg);
      onLoginError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const testStoreConnection = async () => {
    try {
      setDebugInfo('Testing store connection...');
      await window.electron.store.set('connection_test', Date.now());
      const value = await window.electron.store.get('connection_test');
      setDebugInfo(`Store test: ${value ? '✅ SUCCESS' : '❌ FAILED'}`);
    } catch (err) {
      setDebugInfo('Store test: ❌ ERROR');
    }
  };

  return (
    <div className="pharm-login-container">
      <AnimatePresence>
        <motion.div
          className="pharm-login-box"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <motion.div
            className="pharm-login-header"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <img src={logo} alt="Logo" className="pharm-login-logo" />
            <h1 className="pharm-login-title">Welcome Back</h1>
            <p className="pharm-login-subtitle">Sign in to your account</p>
          </motion.div>

          <motion.form
            className="pharm-login-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {error && (
              <motion.div
                className="pharm-login-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </motion.div>
            )}

            <div className="pharm-form-group">
              <label htmlFor="username" className="pharm-form-label">Username</label>
              <div className="pharm-input-wrapper">
                <UserIcon className="pharm-input-icon" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  className="pharm-form-control"
                  disabled={isLoading}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="pharm-form-group">
              <label htmlFor="password" className="pharm-form-label">Password</label>
              <div className="pharm-input-wrapper">
                <Lock className="pharm-input-icon" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="pharm-form-control"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              className="pharm-login-btn"
              disabled={isLoading}
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              {!isLoading && <ArrowRight className="pharm-btn-icon" />}
            </motion.button>
          </motion.form>

          {/* Quick Login Helper (Dev Mode Only) */}
          {process.env.NODE_ENV === 'development' && (
            <motion.div
              className="pharm-login-dev-helper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <details>
                <summary>Quick Login (Dev)</summary>
                <div className="dev-login-options">
                  <button 
                    type="button"
                    onClick={() => setFormData({ username: 'admin', password: 'password' })}
                  >
                    Admin
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({ username: 'manager1', password: 'password' })}
                  >
                    Manager
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({ username: 'cashier1', password: 'password' })}
                  >
                    Cashier
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({ username: 'dispenser1', password: 'password' })}
                  >
                    Dispenser
                  </button>
                </div>
                <div className="dev-debug-info">
                  <p>{debugInfo}</p>
                  <button 
                    type="button" 
                    onClick={testStoreConnection}
                    className="test-store-btn"
                  >
                    <RefreshCw size={14} />
                    Test Store
                  </button>
                </div>
              </details>
            </motion.div>
          )}

          <motion.div
            className="pharm-login-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <p>© 2025 Fraha Pharmacy. All rights reserved.</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Login;