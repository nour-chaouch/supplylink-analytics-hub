import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Save, X, AlertCircle, CheckCircle } from 'lucide-react';

interface IndexMetadata {
  _id: string;
  indexName: string;
  title: string;
  description: string;
  icon: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface IndexMetadataEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  indexName: string;
}

const ICON_OPTIONS = [
  { value: 'Database', label: 'Database', description: 'General data storage' },
  { value: 'BarChart3', label: 'Bar Chart', description: 'Analytics and reporting' },
  { value: 'TrendingUp', label: 'Trending Up', description: 'Growth and trends' },
  { value: 'Users', label: 'Users', description: 'User-related data' },
  { value: 'Package', label: 'Package', description: 'Product or inventory' },
  { value: 'MapPin', label: 'Map Pin', description: 'Location-based data' },
  { value: 'Calendar', label: 'Calendar', description: 'Time-based data' },
  { value: 'FileText', label: 'File Text', description: 'Document or text data' },
  { value: 'ShoppingCart', label: 'Shopping Cart', description: 'E-commerce data' },
  { value: 'Globe', label: 'Globe', description: 'Global or web data' },
  { value: 'Heart', label: 'Heart', description: 'Health or wellness data' },
  { value: 'Car', label: 'Car', description: 'Transportation data' },
  { value: 'Home', label: 'Home', description: 'Real estate or housing' },
  { value: 'Briefcase', label: 'Briefcase', description: 'Business data' },
  { value: 'Book', label: 'Book', description: 'Educational content' }
];

const IndexMetadataEditForm: React.FC<IndexMetadataEditFormProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  indexName 
}) => {
  const [metadata, setMetadata] = useState<IndexMetadata | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Database');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Load metadata when form opens
  useEffect(() => {
    if (isOpen && indexName) {
      loadMetadata();
    }
  }, [isOpen, indexName]);

  const loadMetadata = async () => {
    setLoadingMetadata(true);
    setError(null);
    
    try {
      const response = await adminAPI.getIndexMetadata(indexName);
      if (response.data.success) {
        const meta = response.data.data;
        setMetadata(meta);
        setTitle(meta.title);
        setDescription(meta.description);
        setSelectedIcon(meta.icon);
      } else {
        setError('Failed to load index metadata');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load index metadata');
    } finally {
      setLoadingMetadata(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedIcon('Database');
    setError(null);
    setMetadata(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await adminAPI.updateIndexMetadata(indexName, {
        title: title.trim(),
        description: description.trim(),
        icon: selectedIcon
      });
      onSuccess();
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update index metadata');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Index Metadata</h2>
            <p className="text-gray-600 mt-1">
              Update the title, description, and icon for "{indexName}"
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingMetadata ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Loading metadata...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="My Custom Index"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Human-readable title for the index
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what this index contains and its purpose..."
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Brief description of the index content and purpose
                </p>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => setSelectedIcon(icon.value)}
                      className={`p-3 border rounded-lg text-center hover:bg-gray-50 ${
                        selectedIcon === icon.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-600'
                      }`}
                      title={icon.description}
                    >
                      <div className="text-lg mb-1">{icon.label}</div>
                      <div className="text-xs">{icon.value}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Choose an icon that represents your index
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-red-800 font-medium">Error</span>
                  </div>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Metadata
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndexMetadataEditForm;

