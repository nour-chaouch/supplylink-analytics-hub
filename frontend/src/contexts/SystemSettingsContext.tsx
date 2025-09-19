import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminAPI } from '../services/api';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  supportedFormats: string[];
  elasticsearchTimeout: number;
  enableNotifications: boolean;
  logLevel: string;
  sessionTimeout: number;
}

interface SystemSettingsContextType {
  settings: SystemSettings | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

interface SystemSettingsProviderProps {
  children: ReactNode;
}

export const SystemSettingsProvider: React.FC<SystemSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSettings = async (isRefresh = false) => {
    // Prevent multiple concurrent requests
    if (isRefresh && isRefreshing) {
      return;
    }
    
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Check if user is authenticated, if not use public settings directly
      const token = localStorage.getItem('token');
      let response;
      
      if (token) {
        // User is authenticated, try admin settings first
        try {
          response = await adminAPI.getSystemSettings();
        } catch (err: any) {
          if (err.response?.status === 401) {
            // Token is invalid, try public settings
            response = await adminAPI.getPublicSystemSettings();
          } else {
            throw err;
          }
        }
      } else {
        // User is not authenticated, use public settings directly
        response = await adminAPI.getPublicSystemSettings();
      }
      if (response.data.success) {
        setSettings(response.data.settings);
      } else {
        setError('Failed to load system settings');
      }
    } catch (err: any) {
      console.error('Error loading system settings:', err);
      
      // Provide more specific error messages
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError('Backend server is not running. Please start the backend server on port 5001.');
      } else if (err.response?.status === 500) {
        setError('Backend server error. Please check the server logs.');
      } else {
        setError('Failed to load system settings');
      }
      
      // Don't clear settings on error, keep the last known good settings
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const refreshSettings = async () => {
    await loadSettings(true);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const value: SystemSettingsContextType = {
    settings,
    loading,
    error,
    refreshSettings
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = (): SystemSettingsContextType => {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
};

// Default settings fallback
export const defaultSystemSettings: SystemSettings = {
  siteName: 'SupplyLink Analytics Hub',
  siteDescription: 'Agricultural data analytics platform',
  maintenanceMode: false,
  allowRegistration: true,
  requireEmailVerification: false,
  supportedFormats: ['json', 'csv', 'xlsx'],
  elasticsearchTimeout: 30000,
  enableNotifications: true,
  logLevel: 'info',
  sessionTimeout: 3600
};
