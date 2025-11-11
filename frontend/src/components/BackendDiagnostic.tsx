import React, { useState } from 'react';
import { adminAPI } from '../services/api';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const BackendDiagnostic: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<{
    health: 'checking' | 'success' | 'error' | null;
    systemSettings: 'checking' | 'success' | 'error' | null;
    error: string | null;
  }>({
    health: null,
    systemSettings: null,
    error: null
  });

  const runDiagnostics = async () => {
    setDiagnostics({
      health: 'checking',
      systemSettings: 'checking',
      error: null
    });

    try {
      // Test health endpoint
      try {
        const healthResponse = await fetch('/api/health');
        if (healthResponse.ok) {
          setDiagnostics(prev => ({ ...prev, health: 'success' }));
        } else {
          setDiagnostics(prev => ({ ...prev, health: 'error' }));
        }
      } catch (error) {
        setDiagnostics(prev => ({ ...prev, health: 'error' }));
      }

      // Test system settings endpoint
      try {
        const settingsResponse = await adminAPI.getSystemSettings();
        if (settingsResponse.data.success) {
          setDiagnostics(prev => ({ ...prev, systemSettings: 'success' }));
        } else {
          setDiagnostics(prev => ({ ...prev, systemSettings: 'error' }));
        }
      } catch (error: any) {
        setDiagnostics(prev => ({ 
          ...prev, 
          systemSettings: 'error',
          error: error.message || 'Unknown error'
        }));
      }
    } catch (error: any) {
      setDiagnostics(prev => ({ 
        ...prev, 
        error: error.message || 'Unknown error'
      }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'checking':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Backend Connection Diagnostic</h3>
        <button
          onClick={runDiagnostics}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Run Diagnostics
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Health Endpoint (/api/health)</span>
          {getStatusIcon(diagnostics.health || '')}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">System Settings Endpoint</span>
          {getStatusIcon(diagnostics.systemSettings || '')}
        </div>

        {diagnostics.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Details</h3>
                <div className="mt-2 text-sm text-red-700">
                  {diagnostics.error}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Troubleshooting</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Make sure the backend server is running on port 5001</li>
                  <li>Check that no other service is using port 5001</li>
                  <li>Verify the backend server started without errors</li>
                  <li>Check the browser console for additional error details</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackendDiagnostic;
