// src/renderer/src/components/modals/SettingsModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Moon, Sun, Bell, Printer, Clock } from 'lucide-react';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppSettings {
  theme: 'light' | 'dark';
  autoLogout: number; // minutes
  printReceipts: boolean;
  lowStockAlert: boolean;
  language: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    autoLogout: 30,
    printReceipts: true,
    lowStockAlert: true,
    language: 'en'
  });

  const [isLoading, setIsLoading] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (field: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    
    // Apply theme immediately
    if (field === 'theme') {
      document.documentElement.setAttribute('data-theme', value);
      localStorage.setItem('fraha-theme', value);
    }
  };

  const handleSaveClick = async () => {
    await saveSettings();
  };

  const saveSettings = async () => {
    setIsLoading(true);

    try {
      // Save to localStorage
      localStorage.setItem('appSettings', JSON.stringify(settings));
      
      alert('✅ Settings saved successfully!');
      onClose();

    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert(`❌ Failed to save settings: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="settings-modal-overlay" onClick={onClose}>
          <motion.div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h4 className="settings-modal-title">
                <Settings size={24} />
                Application Settings
              </h4>
              <button className="settings-close-btn" onClick={onClose}>
                <X size={24} />
              </button>
            </div>

            <div className="settings-modal-body">
              {isLoading && (
                <div className="loading-overlay">
                  <div className="loading-spinner"></div>
                  <span>Saving...</span>
                </div>
              )}

              {/* Appearance Settings */}
              <div className="settings-section">
                <h3 className="section-title">
                  <Moon size={20} />
                  Appearance
                </h3>

                <div className="form-group">
                  <label htmlFor="theme" className="form-label">Theme</label>
                  <select
                    id="theme"
                    value={settings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value as any)}
                    className="form-control"
                    disabled={isLoading}
                  >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                  </select>
                  <small className="help-text">
                    Choose your preferred color theme
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="language" className="form-label">Language</label>
                  <select
                    id="language"
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    className="form-control"
                    disabled={isLoading}
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                  <small className="help-text">
                    Interface language
                  </small>
                </div>
              </div>

              {/* Security Settings */}
              <div className="settings-section">
                <h3 className="section-title">
                  <Clock size={20} />
                  Security
                </h3>

                <div className="form-group">
                  <label htmlFor="autoLogout" className="form-label">Auto Logout</label>
                  <select
                    id="autoLogout"
                    value={settings.autoLogout}
                    onChange={(e) => handleSettingChange('autoLogout', parseInt(e.target.value))}
                    className="form-control"
                    disabled={isLoading}
                  >
                    <option value={0}>Never</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                  </select>
                  <small className="help-text">
                    Automatically log out after period of inactivity
                  </small>
                </div>
              </div>

              {/* POS Settings */}
              <div className="settings-section">
                <h3 className="section-title">
                  <Printer size={20} />
                  POS Settings
                </h3>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.printReceipts}
                      onChange={(e) => handleSettingChange('printReceipts', e.target.checked)}
                      disabled={isLoading}
                    />
                    <span className="checkmark"></span>
                    Auto-print receipts after sale
                  </label>
                  <small className="help-text">
                    Automatically print receipts when transactions are completed
                  </small>
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.lowStockAlert}
                      onChange={(e) => handleSettingChange('lowStockAlert', e.target.checked)}
                      disabled={isLoading}
                    />
                    <span className="checkmark"></span>
                    Show low stock alerts
                  </label>
                  <small className="help-text">
                    Display warnings when product quantities are low
                  </small>
                </div>
              </div>

              {/* Actions */}
              <div className="settings-actions">
                <button
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClick}
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;