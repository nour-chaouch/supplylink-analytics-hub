import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import DataImportWizard from '../components/DataImportWizard';
import IndexCreationForm from '../components/IndexCreationForm';
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
  Settings,
  Wand2,
  Eye,
  Edit
} from 'lucide-react';
import DataManagement from '../components/DataManagement';

interface IndexInfo {
  index: string;
  health: string;
  status: string;
  docs_count: string;
  store_size: string;
  pri?: string;
  rep?: string;
  uuid?: string;
  // Elasticsearch cat.indices fields with dots
  'docs.count'?: string;
  'docs.deleted'?: string;
  'store.size'?: string;
  'pri.store.size'?: string;
  'dataset.size'?: string;
  // New enriched fields from backend (when working)
  docsCount?: number;
  docsDeleted?: number;
  storeSize?: number;
  storeSizeHuman?: string;
  numberOfShards?: number;
  numberOfReplicas?: string;
  creationDate?: string | null;
  mappingFields?: number;
  error?: string;
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
  const [showIndexCreationForm, setShowIndexCreationForm] = useState(false);
  
  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedIndexForWizard, setSelectedIndexForWizard] = useState<string>('');
  
  // Data management state
  const [dataManagementOpen, setDataManagementOpen] = useState(false);
  const [selectedIndexForDataManagement, setSelectedIndexForDataManagement] = useState<string>('');

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

  // Handle successful index creation
  const handleIndexCreationSuccess = () => {
    setSuccess('Index created successfully!');
    loadElasticsearchData();
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


  // Open import wizard for specific index
  const openImportWizard = (indexName: string) => {
    setSelectedIndexForWizard(indexName);
    setWizardOpen(true);
  };

  // Handle wizard success
  const handleWizardSuccess = () => {
    setSuccess('Data imported successfully!');
    loadElasticsearchData();
  };

  // Close wizard
  const closeWizard = () => {
    setWizardOpen(false);
    setSelectedIndexForWizard('');
  };

  // Data management functions
  const openDataManagement = (indexName: string) => {
    setSelectedIndexForDataManagement(indexName);
    setDataManagementOpen(true);
  };

  const closeDataManagement = () => {
    setDataManagementOpen(false);
    setSelectedIndexForDataManagement('');
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Create Custom Index</h2>
          </div>
          <button
            onClick={() => setShowIndexCreationForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Index
          </button>
        </div>
        <p className="text-gray-600">
          Create a custom Elasticsearch index with your own field definitions and data types.
          Define exactly what fields you need and their types for optimal data storage and querying.
        </p>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Custom Index Creation Features:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Define custom field names and data types</li>
                <li>Support for all Elasticsearch field types (text, keyword, integer, date, etc.)</li>
                <li>Automatic optimization settings (analyzers, mappings)</li>
                <li>Built-in timestamp fields (createdAt, updatedAt)</li>
                <li>Field validation and naming rules</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Indices List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Indices ({indices.length})</h2>
          </div>
          <div className="text-sm text-gray-500">
            Click "Import Data" for step-by-step wizard
          </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                    <div>
                      <span className="font-medium">Documents:</span> {
                        index.docsCount?.toLocaleString() || 
                        index.docs_count || 
                        (index as any)['docs.count'] || 
                        '0'
                      }
                    </div>
                    <div>
                      <span className="font-medium">Store Size:</span> {
                        index.storeSizeHuman || 
                        index.store_size || 
                        (index as any)['store.size'] || 
                        '0 B'
                      }
                    </div>
                    <div>
                      <span className="font-medium">Shards:</span> {index.pri || '0'}
                    </div>
                    <div>
                      <span className="font-medium">Health:</span> {index.health}
                    </div>
                  </div>
                  {/* Additional details */}
                  {(index.mappingFields || index.docsDeleted || index['docs.deleted'] || index.rep) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
                      {index.mappingFields && index.mappingFields > 0 && (
                        <div>
                          <span className="font-medium">Fields:</span> {index.mappingFields}
                        </div>
                      )}
                      {((index.docsDeleted && index.docsDeleted > 0) || 
                        (index['docs.deleted'] && parseInt(index['docs.deleted']) > 0)) && (
                        <div>
                          <span className="font-medium">Deleted Docs:</span> {
                            index.docsDeleted?.toLocaleString() || 
                            index['docs.deleted'] || 
                            '0'
                          }
                        </div>
                      )}
                      {(index.numberOfReplicas || index.rep) && (
                        <div>
                          <span className="font-medium">Replicas:</span> {index.numberOfReplicas || index.rep}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {/* Import Wizard Button */}
                  <button
                    onClick={() => openImportWizard(index.index)}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    <Wand2 className="h-4 w-4 mr-1" />
                    Import Data
                  </button>
                  
                  {/* Data Management Button */}
                  <button
                    onClick={() => openDataManagement(index.index)}
                    className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Manage Data
                  </button>
                    
                    <button
                      onClick={() => deleteIndex(index.index)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
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

      {/* Data Import Wizard */}
      <DataImportWizard
        indexName={selectedIndexForWizard}
        isOpen={wizardOpen}
        onClose={closeWizard}
        onSuccess={handleWizardSuccess}
      />

      {/* Data Management */}
      {dataManagementOpen && (
        <DataManagement
          indexName={selectedIndexForDataManagement}
          onClose={closeDataManagement}
        />
      )}

      {/* Index Creation Form */}
      <IndexCreationForm
        isOpen={showIndexCreationForm}
        onClose={() => setShowIndexCreationForm(false)}
        onSuccess={handleIndexCreationSuccess}
      />
    </div>
  );
};

export default ElasticsearchAdmin;