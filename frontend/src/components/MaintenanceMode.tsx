import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../store/store';
import { useSystemSettings, defaultSystemSettings } from '../contexts/SystemSettingsContext';
import { Wrench, Clock, Shield, LogIn } from 'lucide-react';

const MaintenanceMode: React.FC = () => {
  const { settings } = useSystemSettings();
  const { user } = useSelector((state: RootState) => state.auth);
  const siteName = settings?.siteName || defaultSystemSettings.siteName;
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Wrench className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {siteName} is temporarily unavailable
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We're currently performing scheduled maintenance
          </p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <Clock className="mx-auto h-8 w-8 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Maintenance in Progress
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              We're working hard to improve your experience. Please check back soon.
            </p>
            
            {isAdmin ? (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-center">
                  <Shield className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800 font-medium">
                    Admin Access: You can bypass maintenance mode
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center justify-center">
                  <Clock className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-sm text-red-800 font-medium">
                    The site is temporarily unavailable for all users except administrators
                  </span>
                </div>
              </div>
            )}
            
            {/* Login button for non-admin users */}
            {!isAdmin && (
              <div className="mt-6">
                <Link
                  to="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In (Admin Access)
                </Link>
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Are you an administrator? Sign in to access the site during maintenance.
                </p>
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-4">
              If you need immediate assistance, please contact support.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;
