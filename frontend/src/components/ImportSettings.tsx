import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, AlertCircle, CheckCircle, Loader2, Database, Globe } from 'lucide-react';
import { adminAPI } from '../services/api';
import { useSystemSettings } from '../contexts/SystemSettingsContext';
import BackendDiagnostic from './BackendDiagnostic';

interface ImportSettings {
  batchSize: number;
  chunkSize: number;
  maxRetries: number;
  timeoutMultiplier: number;
  minTimeout: number;
  maxTimeout: number;
  memoryCheckInterval: number;
  progressUpdateInterval: number;
  enableValidation: boolean;
  skipInvalidDocuments: boolean;
  enableRealTimeLogging: boolean;
}

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

interface AllSettings {
  import: ImportSettings;
  system: SystemSettings;
}

const AllSettings: React.FC = () => {
  const [settings, setSettings] = useState<AllSettings>({
    import: {
      batchSize: 5000,
      chunkSize: 10485760, // 10MB
      maxRetries: 3,
      timeoutMultiplier: 5,
      minTimeout: 30,
      maxTimeout: 120,
      memoryCheckInterval: 100000,
      progressUpdateInterval: 1000,
      enableValidation: true,
      skipInvalidDocuments: true,
      enableRealTimeLogging: true
    },
    system: {
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
    }
  });

  const [activeTab, setActiveTab] = useState<'import' | 'system'>('import');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { refreshSettings } = useSystemSettings();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllSettings();
      if (response.data.success) {
        setSettings(response.data.settings);
      } else {
        setMessage({ type: 'error', text: 'Failed to load settings' });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (activeTab === 'import') {
        const response = await adminAPI.updateImportSettings(settings.import);
        if (response.data.success) {
          setMessage({ type: 'success', text: 'Import settings saved successfully!' });
        } else {
          setMessage({ type: 'error', text: response.data.message || 'Failed to save import settings' });
        }
      } else if (activeTab === 'system') {
        const response = await adminAPI.updateSystemSettings(settings.system);
        if (response.data.success) {
          setMessage({ type: 'success', text: 'System settings saved successfully!' });
          // Refresh the system settings context to update the UI
          try {
            await refreshSettings();
          } catch (refreshError) {
            console.warn('Failed to refresh system settings after save:', refreshError);
            // Don't show error to user as the save was successful
          }
        } else {
          setMessage({ type: 'error', text: response.data.message || 'Failed to save system settings' });
        }
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      if (error.response?.data?.message) {
        setMessage({ type: 'error', text: error.response.data.message });
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        setMessage({ type: 'error', text: 'Cannot connect to backend server. Please ensure the backend is running on port 5001.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await adminAPI.resetAllSettings();
      if (response.data.success) {
        setSettings(response.data.settings);
        setMessage({ type: 'success', text: 'All settings reset to defaults!' });
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to reset settings' });
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      setMessage({ type: 'error', text: 'Failed to reset settings' });
    } finally {
      setSaving(false);
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="h-6 w-6 text-blue-500 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">All Settings</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={resetSettings}
                disabled={saving}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </button>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Settings
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mt-4">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('import')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'import'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Database className="h-4 w-4 inline mr-2" />
                Import Settings
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'system'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Globe className="h-4 w-4 inline mr-2" />
                System Settings
              </button>
            </nav>
          </div>
        </div>

        <div className="p-6">
          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              {message.text}
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'import' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Performance Settings */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Performance Settings
                </h2>

                {/* Batch Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Size
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    value={settings.import.batchSize}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      import: { ...prev.import, batchSize: parseInt(e.target.value) || 5000 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of documents to process in each batch (100-10,000)
                  </p>
                </div>

                {/* Chunk Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chunk Size
                  </label>
                  <input
                    type="number"
                    min="1048576"
                    max="104857600"
                    step="1048576"
                    value={settings.import.chunkSize}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      import: { ...prev.import, chunkSize: parseInt(e.target.value) || 10485760 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    File chunk size: {formatBytes(settings.import.chunkSize)} (1MB-100MB)
                  </p>
                </div>

                {/* Max Retries */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Retries
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.import.maxRetries}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      import: { ...prev.import, maxRetries: parseInt(e.target.value) || 3 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum retry attempts for failed operations (1-10)
                  </p>
                </div>
              </div>

              {/* Timeout Settings */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Timeout Settings
                </h2>

                {/* Timeout Multiplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout Multiplier (minutes per GB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.import.timeoutMultiplier}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      import: { ...prev.import, timeoutMultiplier: parseInt(e.target.value) || 5 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minutes per GB of file size (1-60)
                  </p>
                </div>

                {/* Min Timeout */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={settings.import.minTimeout}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      import: { ...prev.import, minTimeout: parseInt(e.target.value) || 30 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum timeout duration (5-60 minutes)
                  </p>
                </div>

                {/* Max Timeout */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="480"
                    value={settings.import.maxTimeout}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      import: { ...prev.import, maxTimeout: parseInt(e.target.value) || 120 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum timeout duration (60-480 minutes)
                  </p>
                </div>
              </div>

              {/* Monitoring Settings */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Monitoring Settings
                </h2>

                {/* Memory Check Interval */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Memory Check Interval
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="1000000"
                    step="1000"
                    value={settings.import.memoryCheckInterval}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      import: { ...prev.import, memoryCheckInterval: parseInt(e.target.value) || 100000 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Check memory every {formatNumber(settings.import.memoryCheckInterval)} documents
                  </p>
                </div>

                {/* Progress Update Interval */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progress Update Interval
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    step="100"
                    value={settings.import.progressUpdateInterval}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      import: { ...prev.import, progressUpdateInterval: parseInt(e.target.value) || 1000 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Update progress every {formatNumber(settings.import.progressUpdateInterval)} documents
                  </p>
                </div>
              </div>

              {/* Feature Settings */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Feature Settings
                </h2>

                {/* Enable Validation */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Enable Document Validation
                    </label>
                    <p className="text-xs text-gray-500">
                      Validate documents before processing
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.import.enableValidation}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      import: { ...prev.import, enableValidation: e.target.checked }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                {/* Skip Invalid Documents */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Skip Invalid Documents
                    </label>
                    <p className="text-xs text-gray-500">
                      Skip documents that fail validation
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.import.skipInvalidDocuments}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      import: { ...prev.import, skipInvalidDocuments: e.target.checked }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                {/* Enable Real-time Logging */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Enable Real-time Logging
                    </label>
                    <p className="text-xs text-gray-500">
                      Show detailed logs during processing
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.import.enableRealTimeLogging}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      import: { ...prev.import, enableRealTimeLogging: e.target.checked }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* System Settings Tab */}
          {activeTab === 'system' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* General Settings */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  General Settings
                </h2>

                {/* Site Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.system.siteName}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, siteName: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Site Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={settings.system.siteDescription}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, siteDescription: e.target.value }
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

              </div>

              {/* Elasticsearch Settings */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Elasticsearch Settings
                </h2>


                {/* Elasticsearch Timeout */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Elasticsearch Timeout (ms)
                  </label>
                  <input
                    type="number"
                    min="5000"
                    max="120000"
                    step="1000"
                    value={settings.system.elasticsearchTimeout}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, elasticsearchTimeout: parseInt(e.target.value) || 30000 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Log Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Log Level
                  </label>
                  <select
                    value={settings.system.logLevel}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, logLevel: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Feature Toggles
                </h2>

                {/* Maintenance Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Maintenance Mode
                    </label>
                    <p className="text-xs text-gray-500">
                      Enable maintenance mode to restrict access
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.system.maintenanceMode}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, maintenanceMode: e.target.checked }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                {/* Allow Registration */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Allow Registration
                    </label>
                    <p className="text-xs text-gray-500">
                      Allow new users to register
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.system.allowRegistration}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, allowRegistration: e.target.checked }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

              </div>
            </div>
          )}

          {/* Current Settings Summary */}
          {activeTab === 'import' && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Current Import Settings Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Batch Size:</span>
                  <span className="ml-1 font-medium">{formatNumber(settings.import.batchSize)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Chunk Size:</span>
                  <span className="ml-1 font-medium">{formatBytes(settings.import.chunkSize)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Max Retries:</span>
                  <span className="ml-1 font-medium">{settings.import.maxRetries}</span>
                </div>
                <div>
                  <span className="text-gray-500">Timeout:</span>
                  <span className="ml-1 font-medium">{settings.import.minTimeout}-{settings.import.maxTimeout}min</span>
                </div>
              </div>
            </div>
          )}

          {/* Backend Diagnostic */}
          <div className="mt-8">
            <BackendDiagnostic />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllSettings;
