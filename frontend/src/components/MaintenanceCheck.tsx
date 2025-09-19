import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { RootState } from '../store/store';
import { useSystemSettings, defaultSystemSettings } from '../contexts/SystemSettingsContext';
import MaintenanceMode from './MaintenanceMode';

interface MaintenanceCheckProps {
  children: React.ReactNode;
}

const MaintenanceCheck: React.FC<MaintenanceCheckProps> = ({ children }) => {
  const { settings, loading } = useSystemSettings();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  
  // Show loading state while settings are being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  // Check if maintenance mode is enabled
  const maintenanceMode = settings?.maintenanceMode !== undefined ? settings.maintenanceMode : defaultSystemSettings.maintenanceMode;
  
  // Allow access to login and register pages during maintenance mode (guests might be admins)
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';
  
  // Block ALL users except admin users during maintenance
  // This includes guests (not authenticated) and authenticated non-admin users
  // BUT allow access to login and register pages so admins can log in or register
  if (maintenanceMode && user?.role !== 'admin' && !isLoginPage && !isRegisterPage) {
    return <MaintenanceMode />;
  }
  
  return <>{children}</>;
};

export default MaintenanceCheck;
