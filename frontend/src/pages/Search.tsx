'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { agriculturalAPI, chartsAPI } from '../services/api';
import {
  Search as SearchIcon,
  Filter,
  Download,
  Database,
  ChevronDown,
  X,
  Calendar,
  FileText,
  Tag,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Info,
  Plus,
  TrendingUp,
  PieChart,
  AreaChart,
  Eye,
  Edit,
  Trash2,
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

interface Chart {
  id: string;
  name: string;
  type: string;
  indexName: string;
  description?: string;
  metadata?: {
    tags?: string[];
    isPublic?: boolean;
    createdAt?: string;
  };
}

const Search: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();

  const [selectedIndex, setSelectedIndex] = useState<string>('');
  const [indices, setIndices] = useState<Index[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [filterValues, setFilterValues] = useState<{ [key: string]: FilterValue[] }>({});
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

  // Charts state
  const [charts, setCharts] = useState<Chart[]>([]);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartsError, setChartsError] = useState<string | null>(null);

  // UI: active section toggle (search | charts)
  const [activeTab, setActiveTab] = useState<'search' | 'charts'>('search');

  // Load indices on mount
  useEffect(() => {
    loadIndices();
    loadCharts();
  }, []);

  // Load fields & filter values when index changes
  useEffect(() => {
    if (selectedIndex) {
      loadFields(selectedIndex);
      loadAllFilterValues(selectedIndex);
      setFilters({});
      setResults([]);
      setTotalResults(0);
      setShowAllFilters(false);
    }
  }, [selectedIndex]);

  const loadIndices = async () => {
    try {
      const response = await agriculturalAPI.getIndices();
      if (response.data.success) {
        setIndices(response.data.data);
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
        const allFilterValues: { [key: string]: FilterValue[] } = {};
        const isQCL = indexName.toLowerCase().includes('crops') || indexName.toLowerCase().includes('livestock');

        // Use terms endpoint for Element and Item in QCL to get proper counts with domain filter
        for (const fieldName of Object.keys(response.data.data.filterValues)) {
          const lowerField = fieldName.toLowerCase();
          if (isQCL && (lowerField === 'element' || lowerField === 'item')) {
            try {
              const termsRes = await agriculturalAPI.getIndexTerms(indexName, {
                field: lowerField,
                size: lowerField === 'element' ? 50 : 100,
                filters: { domain: 'Crops and livestock products' }
              });
              if (termsRes.data.success) {
                allFilterValues[fieldName] = termsRes.data.data;
              } else {
                allFilterValues[fieldName] = response.data.data.filterValues[fieldName].values;
              }
            } catch (e) {
              console.error(`Failed to load ${fieldName} terms:`, e);
              allFilterValues[fieldName] = response.data.data.filterValues[fieldName].values;
            }
          } else {
            allFilterValues[fieldName] = response.data.data.filterValues[fieldName].values;
          }
        }

        setFilterValues(allFilterValues);
      }
    } catch (err) {
      console.error('Failed to load filter values:', err);
      setFilterValues({});
    }
  };

  const loadFilterValues = async (fieldName: string) => {
    if (!selectedIndex || filterValues[fieldName]) return;
    try {
      const isQCL = selectedIndex.toLowerCase().includes('crops') || selectedIndex.toLowerCase().includes('livestock');
      const lowerField = fieldName.toLowerCase();
      
      // Use terms endpoint for Element and Item in QCL to get proper counts with domain filter
      if (isQCL && (lowerField === 'element' || lowerField === 'item')) {
        try {
          const termsRes = await agriculturalAPI.getIndexTerms(selectedIndex, {
            field: lowerField,
            size: lowerField === 'element' ? 50 : 100,
            filters: { domain: 'Crops and livestock products' }
          });
          if (termsRes.data.success) {
            setFilterValues(prev => ({
              ...prev,
              [fieldName]: termsRes.data.data
            }));
            return;
          }
        } catch (e) {
          console.error(`Failed to load ${fieldName} terms:`, e);
        }
      }
      
      // Fallback to regular endpoint
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
      const params: any = { page: 1, limit: pageSize };
      if (searchTerm.trim()) params.q = searchTerm.trim();
      
      // Map field names for QCL (use lowercase for element, item, domain)
      const isQCL = selectedIndex.toLowerCase().includes('crops') || selectedIndex.toLowerCase().includes('livestock');
      const fieldMapping: { [key: string]: string } = {};
      if (isQCL) {
        fieldMapping['Element'] = 'element';
        fieldMapping['Item'] = 'item';
        fieldMapping['Domain'] = 'domain';
        fieldMapping['Area'] = 'area';
      }
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          const mappedKey = fieldMapping[key] || key;
          params[mappedKey] = filters[key];
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
      const params: any = { page: newPage, limit: pageSize };
      if (searchTerm.trim()) params.q = searchTerm.trim();
      
      // Map field names for QCL (use lowercase for element, item, domain)
      const isQCL = selectedIndex.toLowerCase().includes('crops') || selectedIndex.toLowerCase().includes('livestock');
      const fieldMapping: { [key: string]: string } = {};
      if (isQCL) {
        fieldMapping['Element'] = 'element';
        fieldMapping['Item'] = 'item';
        fieldMapping['Domain'] = 'domain';
        fieldMapping['Area'] = 'area';
      }
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          const mappedKey = fieldMapping[key] || key;
          params[mappedKey] = filters[key];
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
    setFilters(prev => ({ ...prev, [fieldName]: value }));
  };

  const clearFilters = () => setFilters({});
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
      default: return FileText;
    }
  };

  const getIndexIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Database, BarChart3, FileText, Tag, Calendar,
    };
    return iconMap[iconName] || Database;
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'green': return CheckCircle;
      case 'yellow':
      case 'red': return AlertCircle;
      default: return Info;
    }
  };

  const formatFileSize = (size: string) => {
    if (!size) return 'Unknown';
    if (typeof size === 'string' && size.match(/^\d+(\.\d+)?[kmgt]?b$/i)) {
      return size.toUpperCase();
    }
    const bytes = parseInt(size);
    if (isNaN(bytes)) return size;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderHighlightedText = (text: string, highlights?: string[]) => {
    if (!highlights || highlights.length === 0) return text;
    const combined = highlights.join(' ... ');
    return <span dangerouslySetInnerHTML={{ __html: combined }} />;
  };

  const getFieldValue = (result: SearchResult, fieldName: string) => {
    const value = result[fieldName];
    const highlights = result._highlights?.[fieldName];
    if (highlights && highlights.length > 0) {
      return renderHighlightedText(String(value), highlights);
    }
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  };

  // Charts functions
  const loadCharts = async () => {
    try {
      setChartsLoading(true);
      setChartsError(null);
      const response = await chartsAPI.getCharts();
      if (response.data.success) {
        setCharts(response.data.data);
      } else {
        setChartsError(response.data.message || 'Error loading charts');
      }
    } catch (err: any) {
      console.error('Error fetching charts:', err);
      setChartsError(err.response?.data?.message || 'Error loading charts');
    } finally {
      setChartsLoading(false);
    }
  };

  const handleViewChart = (chartId: string) => {
    navigate(`/charts/${chartId}`);
  };

  const handleEditChart = (chartId: string) => {
    navigate(`/charts/${chartId}/edit`);
  };

  const handleDeleteChart = async (chartId: string) => {
    if (!window.confirm('Are you sure you want to delete this chart?')) {
      return;
    }

    try {
      await chartsAPI.deleteChart(chartId);
      await loadCharts();
    } catch (err: any) {
      console.error('Error deleting chart:', err);
      alert('Error deleting the chart');
    }
  };

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return BarChart3;
      case 'line':
        return TrendingUp;
      case 'pie':
      case 'doughnut':
        return PieChart;
      case 'area':
        return AreaChart;
      default:
        return BarChart3;
    }
  };

  const getChartTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      bar: 'Bars',
      line: 'Lines',
      pie: 'Pie',
      doughnut: 'Doughnut',
      area: 'Area',
      scatter: 'Scatter',
      table: 'Table'
    };
    return labels[type] || type;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-start gap-8">
          <button
            onClick={() => setActiveTab('search')}
            aria-pressed={activeTab === 'search'}
            className={`text-left transition-colors ${activeTab === 'search' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <h1 className="text-3xl font-bold">Data Explorer</h1>
            <p className="text-sm mt-1 ${activeTab === 'search' ? 'text-gray-600' : 'text-gray-500'}">Search and explore data across available indices</p>
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            aria-pressed={activeTab === 'charts'}
            className={`text-left transition-colors ${activeTab === 'charts' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <h2 className="text-3xl font-bold">My Charts</h2>
            <p className="text-sm mt-1 ${activeTab === 'charts' ? 'text-gray-600' : 'text-gray-500'}">Visualize and manage your created charts</p>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'charts' && (
            <button
              onClick={() => navigate('/charts/create')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Chart
            </button>
          )}
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            disabled={!results.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </button>
        </div>
      </div>

      {activeTab === 'search' && (
      <>
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
                No Elasticsearch indices found. Please check your connection.
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
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                          <IndexIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{index.displayName}</h3>
                          <p className="text-xs text-gray-500 truncate">{index.name}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{index.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>Documents</span>
                        </div>
                        <span className="font-medium">{index.documentCount.toLocaleString()}</span>
                      </div>
                    </div>
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

      {/* Search Interface */}
      {selectedIndex && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Term</label>
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

            {/* Filters */}
            {showFilters && fields.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-700">Filters</h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {fields.length} fields available
                    </span>
                  </div>
                  <button onClick={clearFilters} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
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
                          <input
                            type="date"
                            value={filters[field.name] || ''}
                            onChange={(e) => handleFilterChange(field.name, e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          />
                        ) : ['integer', 'long', 'float', 'double'].includes(field.type) ? (
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Search Results ({totalResults.toLocaleString()})
              </h3>
              <div className="text-sm text-gray-500">
                Showing {results.length} of {totalResults.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {results.map((result, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <Database className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Document {result._id}</h4>
                        <p className="text-sm text-gray-600">From {selectedIndex} index</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {Object.keys(result)
                        .filter(key => !key.startsWith('_'))
                        .map((key) => (
                          <div key={key} className="break-words">
                            <span className="font-medium text-gray-700">{key}:</span>
                            <span className="ml-2 text-gray-900">{getFieldValue(result, key)}</span>
                          </div>
                        ))}
                    </div>

                    {result._score && (
                      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                        Relevance Score: {result._score.toFixed(2)}
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
                </div>

                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalResults)} of {totalResults.toLocaleString()}
                </div>

                <div className="flex items-center space-x-1">
                  <button onClick={() => handlePageChange(1)} disabled={currentPage === 1 || loading} className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">
                    First
                  </button>
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">
                    Previous
                  </button>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= Math.ceil(totalResults / pageSize) || loading} className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">
                    Next
                  </button>
                  <button onClick={() => handlePageChange(Math.ceil(totalResults / pageSize))} disabled={currentPage >= Math.ceil(totalResults / pageSize) || loading} className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && (searchTerm || Object.values(filters).some(v => v)) && (
        <div className="text-center py-12">
          <SearchIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms or filters.</p>
          <button onClick={clearSearch} className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm">
            Clear search and filters
          </button>
        </div>
      )}

      {/* No Index Selected */}
      {!selectedIndex && (
        <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Select a Data Index</h3>
          <p className="mt-1 text-sm text-gray-500">Choose an index from above to start searching.</p>
        </div>
      )}
      </>
      )}

      {activeTab === 'charts' && (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Charts</h2>
              <p className="text-sm text-gray-600">Visualize and manage your created charts</p>
            </div>
            <button
              onClick={() => navigate('/charts/create')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Chart
            </button>
          </div>
        </div>

        <div className="p-6">
          {chartsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : chartsError ? (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              <div className="flex items-center justify-between">
                <span>{chartsError}</span>
                <button onClick={loadCharts} className="text-red-400 hover:text-red-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : charts.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No charts created</h3>
              <p className="mt-1 text-sm text-gray-500">Create your first chart to start visualizing your data</p>
              <button
                onClick={() => navigate('/charts/create')}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Create my first chart
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {charts.map((chart) => {
                const ChartIcon = getChartIcon(chart.type);
                return (
                  <div
                    key={chart.id}
                    className="relative p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 flex-shrink-0">
                          <ChartIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{chart.name}</h3>
                          <p className="text-xs text-gray-500 truncate">{chart.indexName}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                            {getChartTypeLabel(chart.type)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {chart.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{chart.description}</p>
                    )}

                    {chart.metadata?.tags && chart.metadata.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {chart.metadata.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleViewChart(chart.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-xs font-medium"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditChart(chart.id)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-xs font-medium"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteChart(chart.id)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs font-medium"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default Search;