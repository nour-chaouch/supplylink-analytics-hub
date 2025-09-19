import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSystemSettings, defaultSystemSettings } from '../contexts/SystemSettingsContext';

interface RegistrationRouteProps {
  children: React.ReactNode;
}

const RegistrationRoute: React.FC<RegistrationRouteProps> = ({ children }) => {
  const { settings, loading } = useSystemSettings();
  
  // Show loading state while settings are being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  // Check if registration is allowed
  const allowRegistration = settings?.allowRegistration !== undefined ? settings.allowRegistration : defaultSystemSettings.allowRegistration;
  
  // If registration is not allowed, redirect to login
  if (!allowRegistration) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default RegistrationRoute;
