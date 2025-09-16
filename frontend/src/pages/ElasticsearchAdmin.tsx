import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { 
  Database, 
  Plus, 
  Trash2, 
  Upload, 
  Search, 
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  Settings
} from 'lucide-react';

interface IndexInfo {
  index: string;
  health: string;
  status: string;
  docs_count: string;
  store_size: string;
}

interface ClusterHealth {
  status: string;
  number_of_nodes: number;
  active_primary_shards: number;
  active_shards: number;
}

const ElasticsearchAdmin = () => {
  const [clusterHealth, setClusterHealth] = useState<ClusterHealth | null>(null);
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Index creation state
  const [newIndexName, setNewIndexName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMapping, setCustomMapping] = useState('');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load cluster health and indices
  const loadElasticsearchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminAPI.getElasticsearchHealth();
      const data = response.data;
      
      if (data.success) {
        setClusterHealth(data.data.clusterHealth);
        setIndices(data.data.indices);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      console.error('Error loading Elasticsearch data:', err);
      setError(err.response?.data?.message || 'Failed to load Elasticsearch data');
    } finally {
      setLoading(false);
    }
  };

  // Create new index
  const createIndex = async () => {
    if (!newIndexName.trim()) {
      setError('Index name is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let mapping = {};
      
      if (selectedTemplate && selectedTemplate !== 'custom') {
        // Get template mapping
        const templatesResponse = await fetch('/api/admin/elasticsearch/templates');
        const templatesData = await templatesResponse.json();
        if (templatesData.success) {
          mapping = templatesData.data[selectedTemplate];
        }
      } else if (selectedTemplate === 'custom' && customMapping.trim()) {
        try {
          mapping = JSON.parse(customMapping);
        } catch (parseError) {
          setError('Invalid JSON mapping');
          setLoading(false);
          return;
        }
      }

      const response = await adminAPI.createElasticsearchIndex(newIndexName, Object.keys(mapping).length > 0 ? mapping : undefined);
      const data = response.data;
      
      if (data.success) {
        setSuccess(data.message);
        setNewIndexName('');
        setSelectedTemplate('');
        setCustomMapping('');
        loadElasticsearchData();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to create index');
    } finally {
      setLoading(false);
    }
  };

  // Delete index
  const deleteIndex = async (indexName: string) => {
    if (!window.confirm(`Are you sure you want to delete index "${indexName}"?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await adminAPI.deleteElasticsearchIndex(indexName);
      const data = response.data;
      
      if (data.success) {
        setSuccess(data.message);
        loadElasticsearchData();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete index');
    } finally {
      setLoading(false);
    }
  };

  // Create predefined indices
  const createPredefinedIndices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminAPI.createPredefinedIndices();
      const data = response.data;
      
      if (data.success) {
        setSuccess(data.message);
        loadElasticsearchData();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to create predefined indices');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (indexName: string) => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);
    
    try {
      const response = await adminAPI.importElasticsearchData(indexName, selectedFile);
      const data = response.data;
      
      if (data.success) {
        setSuccess(data.message);
        setSelectedFile(null);
        loadElasticsearchData();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setSelectedFile(file);
    } else {
      setError('Please select a valid JSON file');
    }
  };

  useEffect(() => {
    loadElasticsearchData();
  }, []);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'close': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Elasticsearch Management</h1>
          <p className="text-gray-600">Manage Elasticsearch indices and import data</p>
        </div>
        <button 
          onClick={loadElasticsearchData} 
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="ml-2">Refresh</span>
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Cluster Health */}
      {clusterHealth && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Cluster Health</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${getHealthColor(clusterHealth.status)}`}></div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-lg font-bold capitalize">{clusterHealth.status}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Nodes</p>
              <p className="text-lg font-bold">{clusterHealth.number_of_nodes}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Primary Shards</p>
              <p className="text-lg font-bold">{clusterHealth.active_primary_shards}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Active Shards</p>
              <p className="text-lg font-bold">{clusterHealth.active_shards}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Index */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Plus className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Create New Index</h2>
        </div>
        <p className="text-gray-600 mb-4">Create a new Elasticsearch index with optional mapping</p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="indexName" className="block text-sm font-medium text-gray-700 mb-1">
                Index Name
              </label>
              <input
                id="indexName"
                type="text"
                value={newIndexName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIndexName(e.target.value)}
                placeholder="Enter index name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
                Template
              </label>
              <select
                id="template"
                value={selectedTemplate}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a template</option>
                <option value="users">Users</option>
                <option value="producer_prices">Producer Prices</option>
                <option value="crops_livestock">Crops & Livestock</option>
                <option value="custom">Custom Mapping</option>
                <option value="empty">Empty Index</option>
              </select>
            </div>
          </div>
          
          {selectedTemplate === 'custom' && (
            <div>
              <label htmlFor="customMapping" className="block text-sm font-medium text-gray-700 mb-1">
                Custom Mapping (JSON)
              </label>
              <textarea
                id="customMapping"
                value={customMapping}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomMapping(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter JSON mapping..."
              />
            </div>
          )}
          
          <div className="flex space-x-2">
            <button 
              onClick={createIndex} 
              disabled={loading || !newIndexName.trim()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="ml-2">Create Index</span>
            </button>
            <button 
              onClick={createPredefinedIndices} 
              disabled={loading} 
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              <Settings className="h-4 w-4" />
              <span className="ml-2">Create Predefined Indices</span>
            </button>
          </div>
        </div>
      </div>

      {/* Indices List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Indices ({indices.length})</h2>
        </div>
        
        <div className="space-y-4">
          {indices.map((index) => (
            <div key={index.index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-lg">{index.index}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(index.status)}`}>
                      {index.status}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${getHealthColor(index.health)}`}></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Documents:</span> {index.docs_count}
                    </div>
                    <div>
                      <span className="font-medium">Store Size:</span> {index.store_size}
                    </div>
                    <div>
                      <span className="font-medium">Health:</span> {index.health}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {/* File Upload */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                      id={`file-${index.index}`}
                    />
                    <label htmlFor={`file-${index.index}`} className="cursor-pointer p-2 hover:bg-gray-100 rounded">
                      <Upload className="h-4 w-4" />
                    </label>
                    {selectedFile && (
                      <button
                        onClick={() => handleFileUpload(index.index)}
                        disabled={uploading}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import'}
                      </button>
                    )}
                  </div>
                    
                    <button
                      onClick={() => deleteIndex(index.index)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {selectedFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected file: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
            ))}
            
          {indices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No indices found</p>
              <p className="text-sm">Create your first index above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ElasticsearchAdmin;

