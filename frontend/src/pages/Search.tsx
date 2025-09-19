import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { agriculturalAPI } from '../services/api';
import { 
  Search as SearchIcon, 
  Filter, 
  Download, 
  Database, 
  ChevronDown, 
  X,
  BarChart3,
  TrendingUp,
  Users,
  Package,
  MapPin,
  Calendar,
  FileText,
  ShoppingCart,
  Globe,
  Heart,
  Car,
  Home,
  Briefcase,
  Book,
  Edit,
  Settings,
  DollarSign,
  Leaf,
  ChevronRight,
  Tag,
  CheckCircle,
  AlertCircle,
  Clock,
  HardDrive,
  User,
  Activity,
  Zap,
  Shield,
  Star,
  Info
} from 'lucide-react';
import { RootState } from '../store/store';

interface Index {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  documentCount: number;
  status: 'available' | 'not_available';
  health: string;
  size: string;
  lastModified: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    username: string;
    email: string;
  } | null;
  hasMetadata: boolean;
}

interface Field {
  name: string;
  type: string;
  displayName: string;
  searchable: boolean;
}

interface FilterValue {
  value: string;
  count: number;
}

interface SearchFilters {
  [key: string]: string;
}

interface SearchResult {
  _id: string;
  _score?: number;
  _highlights?: { [key: string]: string[] };
  [key: string]: any;
}

const Search: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'admin';
  
  const [selectedIndex, setSelectedIndex] = useState<string>('');
  const [indices, setIndices] = useState<Index[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [filterValues, setFilterValues] = useState<{[key: string]: FilterValue[]}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [showAllFilters, setShowAllFilters] = useState(false);

  // Load available indices on component mount
  useEffect(() => {
    loadIndices();
  }, []);

  // Load fields and filter values when index changes
  useEffect(() => {
    if (selectedIndex) {
      loadFields(selectedIndex);
      loadAllFilterValues(selectedIndex);
      setFilters({});
      setResults([]);
      setTotalResults(0);
      setShowAllFilters(false); // Reset filter expansion
    }
  }, [selectedIndex]);

  const loadIndices = async () => {
    try {
      const response = await agriculturalAPI.getIndices();
      if (response.data.success) {
        setIndices(response.data.data);
        // Auto-select first available index
        const availableIndex = response.data.data.find((index: Index) => index.status === 'available');
        if (availableIndex) {
          setSelectedIndex(availableIndex.name);
        }
      }
    } catch (err) {
      console.error('Failed to load indices:', err);
      setError('Failed to load available indices');
    }
  };

  const loadFields = async (indexName: string) => {
    try {
      const response = await agriculturalAPI.getIndexFields(indexName);
      if (response.data.success) {
        setFields(response.data.data.filterableFields);
      }
    } catch (err) {
      console.error('Failed to load fields:', err);
      setError('Failed to load index fields');
    }
  };

  const loadAllFilterValues = async (indexName: string) => {
    try {
      const response = await agriculturalAPI.getAllIndexFilterValues(indexName);
      if (response.data.success) {
        const allFilterValues: {[key: string]: FilterValue[]} = {};
        Object.keys(response.data.data.filterValues).forEach(fieldName => {
          allFilterValues[fieldName] = response.data.data.filterValues[fieldName].values;
        });
        setFilterValues(allFilterValues);
      }
    } catch (err) {
      console.error('Failed to load filter values:', err);
      // If MongoDB doesn't have filter values, fall back to empty state
      setFilterValues({});
    }
  };

  const loadFilterValues = async (fieldName: string) => {
    if (!selectedIndex || filterValues[fieldName]) return;
    
    try {
      const response = await agriculturalAPI.getIndexFilterValues(selectedIndex, fieldName);
      if (response.data.success) {
        setFilterValues(prev => ({
          ...prev,
          [fieldName]: response.data.data.values
        }));
      }
    } catch (err) {
      console.error('Failed to load filter values:', err);
    }
  };

  const handleSearch = async () => {
    if (!selectedIndex) {
      setError('Please select an index to search');
      return;
    }
    
    if (!searchTerm.trim() && Object.values(filters).every(v => !v)) {
      setError('Please enter a search term or apply filters');
      return;
    }
    
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    
    try {
      const params: any = {
        page: 1,
        limit: pageSize
      };

      // Add search term if provided
      if (searchTerm.trim()) {
        params.q = searchTerm.trim();
      }

      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });

      const response = await agriculturalAPI.searchIndex(selectedIndex, params);
      if (response.data.success) {
        setResults(response.data.data);
        setTotalResults(response.data.pagination.total);
      } else {
        setError(response.data.message || 'Search failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1) return;
    
    setLoading(true);
    setError(null);
    setCurrentPage(newPage);
    
    try {
      const params: any = {
        page: newPage,
        limit: pageSize
      };

      // Add search term if provided
      if (searchTerm.trim()) {
        params.q = searchTerm.trim();
      }

      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });

      const response = await agriculturalAPI.searchIndex(selectedIndex, params);
      if (response.data.success) {
        setResults(response.data.data);
        setTotalResults(response.data.pagination.total);
      } else {
        setError(response.data.message || 'Page load failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Page load failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (fieldName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilters({});
    setResults([]);
    setTotalResults(0);
    setError(null);
  };

  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'text': return FileText;
      case 'keyword': return Tag;
      case 'date': return Calendar;
      case 'integer':
      case 'long':
      case 'float':
      case 'double': return BarChart3;
      default: return Settings;
    }
  };

  const getIndexIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'Database': Database,
      'BarChart3': BarChart3,
      'TrendingUp': TrendingUp,
      'Users': Users,
      'Package': Package,
      'MapPin': MapPin,
      'Calendar': Calendar,
      'FileText': FileText,
      'ShoppingCart': ShoppingCart,
      'Globe': Globe,
      'Heart': Heart,
      'Car': Car,
      'Home': Home,
      'Briefcase': Briefcase,
      'Book': Book,
      'Edit': Edit,
      'Settings': Settings,
      'DollarSign': DollarSign,
      'Leaf': Leaf,
      'Activity': Activity,
      'Zap': Zap,
      'Shield': Shield,
      'Star': Star
    };
    return iconMap[iconName] || Database;
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'green': return 'text-green-600 bg-green-50';
      case 'yellow': return 'text-yellow-600 bg-yellow-50';
      case 'red': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'green': return CheckCircle;
      case 'yellow': return AlertCircle;
      case 'red': return AlertCircle;
      default: return Info;
    }
  };

  const formatFileSize = (size: string) => {
    if (!size) return 'Unknown';
    
    // If size is already formatted (like "365.1mb"), return as is
    if (typeof size === 'string' && size.match(/^\d+(\.\d+)?[kmgt]?b$/i)) {
      return size.toUpperCase();
    }
    
    // If size is in bytes, convert to human readable format
    const bytes = parseInt(size);
    if (isNaN(bytes)) return size;
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderHighlightedText = (text: string, highlights?: string[]) => {
    if (!highlights || highlights.length === 0) {
      return text;
    }
    
    // Combine all highlight fragments
    const combinedHighlights = highlights.join(' ... ');
    
    return (
      <span dangerouslySetInnerHTML={{ __html: combinedHighlights }} />
    );
  };

  const getFieldValue = (result: SearchResult, fieldName: string) => {
    const value = result[fieldName];
    const highlights = result._highlights?.[fieldName];
    
    if (highlights && highlights.length > 0) {
      return renderHighlightedText(String(value), highlights);
    }
    
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Elasticsearch Data Search</h1>
          <p className="text-gray-600">Search across all available data indices</p>
        </div>
        <button 
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          disabled={(results?.length || 0) === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Results
        </button>
      </div>

      {/* Index Selection */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Select Data Index</h2>
          <p className="text-sm text-gray-600">Choose an index to search and explore data</p>
        </div>
        
        <div className="p-6">
          {indices.length === 0 ? (
            <div className="text-center py-8">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No indices available</h3>
              <p className="mt-1 text-sm text-gray-500">
                No Elasticsearch indices found. Please check your Elasticsearch connection.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {indices.map((index) => {
                const IndexIcon = getIndexIcon(index.icon);
                const HealthIcon = getHealthIcon(index.health);
                const isSelected = selectedIndex === index.name;
                const isAvailable = index.status === 'available';
                
                return (
                  <div
                    key={index.name}
                    onClick={() => isAvailable && setSelectedIndex(index.name)}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : isAvailable
                        ? 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <IndexIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {index.displayName}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {index.name}
                          </p>
                        </div>
                      </div>
                      
                      {/* Health Indicator */}
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(index.health)}`}>
                        <HealthIcon className="h-3 w-3" />
                        <span className="capitalize">{index.health}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {index.description}
                    </p>

                    {/* Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>Documents</span>
                        </div>
                        <span className="font-medium">{index.documentCount.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <HardDrive className="h-3 w-3" />
                          <span>Size</span>
                        </div>
                        <span className="font-medium">{formatFileSize(index.size)}</span>
                      </div>
                    </div>

                    {/* Metadata Badge */}
                    {index.hasMetadata && (
                      <div className="absolute top-2 right-2">
                        <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          <Star className="h-3 w-3" />
                          <span>Metadata</span>
                        </div>
                      </div>
                    )}

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 left-2">
                        <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
        
        </div>
      </div>

      {/* Search Form */}
      {selectedIndex && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="space-y-4">
            {/* Search Term */}
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Term
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Search across all fields..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Dynamic Filters */}
            {showFilters && fields.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-700">Filters</h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {fields.length} fields available
                    </span>
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(showAllFilters ? fields : fields.slice(0, 6)).map((field) => {
                    const FieldIcon = getFieldIcon(field.type);
                    return (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <div className="flex items-center">
                            <FieldIcon className="h-4 w-4 mr-1" />
                            {field.displayName}
                          </div>
                        </label>
                        {field.type === 'date' ? (
                          <div className="space-y-2">
                            <input
                              type="date"
                              value={filters[field.name] || ''}
                              onChange={(e) => handleFilterChange(field.name, e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              placeholder={`Select ${field.displayName}`}
                            />
                          </div>
                        ) : field.type === 'integer' || field.type === 'long' || field.type === 'float' || field.type === 'double' ? (
                          <div className="space-y-2">
                            <input
                              type="number"
                              value={filters[field.name] || ''}
                              onChange={(e) => handleFilterChange(field.name, e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              placeholder={`Enter ${field.displayName}`}
                            />
                            {filterValues[field.name] && filterValues[field.name].length > 0 && (
                              <select
                                value={filters[field.name] || ''}
                                onChange={(e) => handleFilterChange(field.name, e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              >
                                <option value="">All {field.displayName}</option>
                                {filterValues[field.name].slice(0, 20).map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.value} ({item.count})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={filters[field.name] || ''}
                              onChange={(e) => handleFilterChange(field.name, e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              placeholder={`Search ${field.displayName}`}
                            />
                            {filterValues[field.name] && filterValues[field.name].length > 0 && (
                              <select
                                value={filters[field.name] || ''}
                                onChange={(e) => handleFilterChange(field.name, e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              >
                                <option value="">All {field.displayName}</option>
                                {filterValues[field.name].slice(0, 50).map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.value} ({item.count})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {fields.length > 6 && (
                  <div className="mt-4 text-center">
                    <button 
                      onClick={() => setShowAllFilters(!showAllFilters)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center justify-center mx-auto"
                    >
                      {showAllFilters ? (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1 rotate-180" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show {fields.length - 6} More Filters
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Results */}
      {(results?.length || 0) > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Search Results ({(totalResults || 0).toLocaleString()})
              </h3>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Showing {(results?.length || 0)} of {(totalResults || 0).toLocaleString()}
                </div>
                {loading && (
                  <div className="flex items-center space-x-2 text-sm text-indigo-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    <span>Loading...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {results.map((result, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Result Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-50">
                          <Database className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            Document {result._id}
                          </h4>
                          <p className="text-sm text-gray-600">
                            From {selectedIndex} index
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Result Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {Object.keys(result).filter(key => !key.startsWith('_')).map((key) => (
                        <div key={key} className="break-words">
                          <span className="font-medium text-gray-700">{key}:</span>
                          <span className="ml-2 text-gray-900">
                            {getFieldValue(result, key)}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Search Score and Highlights */}
                    {result._score && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span>Relevance Score: {result._score.toFixed(2)}</span>
                            {result._highlights && Object.keys(result._highlights).length > 0 && (
                              <span>Found in: {Object.keys(result._highlights).join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalResults > pageSize && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                {/* Page Size Selector */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">Show:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(parseInt(e.target.value))}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-700">per page</span>
                </div>

                {/* Pagination Info */}
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalResults)} of {totalResults.toLocaleString()} results
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  {(() => {
                    const totalPages = Math.ceil(totalResults / pageSize);
                    const maxVisiblePages = 7;
                    const halfVisible = Math.floor(maxVisiblePages / 2);
                    
                    let startPage = Math.max(1, currentPage - halfVisible);
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                    
                    // Adjust start page if we're near the end
                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }
                    
                    const pages = [];
                    
                    // Add first page and ellipsis if needed
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          disabled={loading}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <span key="ellipsis1" className="px-2 py-1 text-sm text-gray-500">
                            ...
                          </span>
                        );
                      }
                    }
                    
                    // Add visible page numbers
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          disabled={loading}
                          className={`px-3 py-1 text-sm border rounded ${
                            i === currentPage
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {i}
                        </button>
                      );
                    }
                    
                    // Add last page and ellipsis if needed
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="ellipsis2" className="px-2 py-1 text-sm text-gray-500">
                            ...
                          </span>
                        );
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          disabled={loading}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {totalPages}
                        </button>
                      );
                    }
                    
                    return pages;
                  })()}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(totalResults / pageSize) || loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(Math.ceil(totalResults / pageSize))}
                    disabled={currentPage >= Math.ceil(totalResults / pageSize) || loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {!loading && (results?.length || 0) === 0 && (searchTerm || Object.values(filters).some(v => v)) && (
        <div className="text-center py-12">
          <SearchIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search terms or filters.
          </p>
          <button
            onClick={clearSearch}
            className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm"
          >
            Clear search and filters
          </button>
        </div>
      )}

      {/* No Index Selected */}
      {!selectedIndex && (
        <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Select a Data Index</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose an index from the dropdown above to start searching.
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;