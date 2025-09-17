import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Search as SearchIcon, Filter, Download, Database, ChevronDown, X } from 'lucide-react';

interface IndexInfo {
  health: string;
  status: string;
  index: string;
  uuid: string;
  pri: string;
  rep: string;
  'docs.count': string;
  'docs.deleted': string;
  'store.size': string;
  'pri.store.size': string;
  'dataset.size': string;
}

interface FieldInfo {
  name: string;
  type: string;
  description: string;
  example: string;
  required: boolean;
}

interface SearchFilters {
  [key: string]: string | number | boolean;
}

const Search: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<string>('');
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [indexFields, setIndexFields] = useState<FieldInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortField, setSortField] = useState('_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showFilters, setShowFilters] = useState(false);

  // Load indices on component mount
  useEffect(() => {
    loadIndices();
  }, []);

  // Load index fields when index is selected
  useEffect(() => {
    if (selectedIndex) {
      loadIndexFields(selectedIndex);
    } else {
      setIndexFields([]);
      setFilters({});
    }
  }, [selectedIndex]);

  const loadIndices = async () => {
    try {
      const response = await adminAPI.getElasticsearchIndices();
      if (response.data.success) {
        setIndices(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load indices:', err);
    }
  };

  const loadIndexFields = async (indexName: string) => {
    try {
      const response = await adminAPI.getIndexSchema(indexName);
      if (response.data.success) {
        setIndexFields(response.data.data.fields);
        // Reset filters when changing index
        setFilters({});
      }
    } catch (err) {
      console.error('Failed to load index fields:', err);
      setError('Failed to load index schema');
    }
  };

  const handleSearch = async () => {
    if (!selectedIndex || (!searchTerm.trim() && Object.keys(filters).length === 0)) {
      setError('Please select an index and enter a search term or apply filters');
      return;
    }
    
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    
    try {
      const params: any = {
        page: 1,
        size: pageSize,
        sortField,
        sortOrder
      };

      // Add search term if provided
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
          params[`filter.${key}`] = filters[key];
        }
      });

      const response = await adminAPI.getDocuments(selectedIndex, params);
      console.log('Search response:', response.data);
      if (response.data.success) {
        console.log('Documents found:', response.data.data.documents.length);
        console.log('First document:', response.data.data.documents[0]);
        setResults(response.data.data.documents);
        setTotalResults(response.data.data.total);
      } else {
        setError(response.data.message || 'Search failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (fieldName: string, value: string | number | boolean) => {
    // Convert string values to appropriate types based on field type
    let processedValue = value;
    
    if (typeof value === 'string') {
      const field = indexFields.find(f => f.name === fieldName);
      if (field) {
        switch (field.type) {
          case 'integer':
          case 'long':
            processedValue = value === '' ? '' : parseInt(value, 10);
            break;
          case 'float':
          case 'double':
            processedValue = value === '' ? '' : parseFloat(value);
            break;
          case 'boolean':
            processedValue = value === 'true' ? true : value === 'false' ? false : '';
            break;
          default:
            processedValue = value;
        }
      }
    }
    
    setFilters(prev => ({
      ...prev,
      [fieldName]: processedValue
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

  const renderFilterInput = (field: FieldInfo) => {
    const value = filters[field.name] || '';

    switch (field.type) {
      case 'integer':
      case 'long':
      case 'float':
      case 'double':
        return (
          <input
            type="number"
            value={value === '' ? '' : String(value)}
            onChange={(e) => handleFilterChange(field.name, e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            placeholder={`Filter by ${field.name}`}
            step={field.type === 'float' || field.type === 'double' ? 'any' : '1'}
          />
        );
      
      case 'boolean':
        return (
          <select
            value={typeof value === 'boolean' ? value.toString() : String(value)}
            onChange={(e) => handleFilterChange(field.name, e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">All</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={String(value)}
            onChange={(e) => handleFilterChange(field.name, e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => handleFilterChange(field.name, e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            placeholder={`Filter by ${field.name}`}
          />
        );
    }
  };

  const getFieldDisplayName = (fieldName: string) => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Search</h1>
          <p className="text-gray-600">Search across Elasticsearch indices with dynamic filters</p>
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
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Select Index</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indices.map((index) => (
              <div
                key={index.index}
                onClick={() => setSelectedIndex(index.index)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedIndex === index.index
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{index.index}</h4>
                  {selectedIndex === index.index && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <p>{parseInt(index['docs.count'] || '0').toLocaleString()} documents</p>
                  <p>{index['store.size'] || 'Unknown'}</p>
                  <p className="text-xs">Status: {index.status}</p>
                </div>
              </div>
            ))}
          </div>
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
            {showFilters && indexFields.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Filters</h4>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {indexFields.slice(0, 12).map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {getFieldDisplayName(field.name)}
                        <span className="text-xs text-gray-500 ml-1">({field.type})</span>
                      </label>
                      {renderFilterInput(field)}
                    </div>
                  ))}
                </div>
                
                {indexFields.length > 12 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Showing first 12 fields. More fields available in the index schema.
                  </p>
                )}
              </div>
            )}

            {/* Sort Options */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="_score">Relevance</option>
                    <option value="createdAt">Created Date</option>
                    <option value="updatedAt">Updated Date</option>
                    {indexFields
                      .filter(field => ['keyword', 'integer', 'long', 'float', 'double', 'date'].includes(field.type))
                      .map(field => (
                        <option key={field.name} value={field.name}>
                          {getFieldDisplayName(field.name)}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>
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
              <div className="text-sm text-gray-500">
                Showing {(results?.length || 0)} of {(totalResults || 0).toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {results.map((result, index) => {
              console.log('Rendering result:', result);
              return (
              <div key={index} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(result._source || {}).map(([key, value]) => {
                        if (key.startsWith('_')) return null;
                        return (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-gray-700">
                              {getFieldDisplayName(key)}:
                            </span>
                            <span className="ml-2 text-gray-900">
                              {value !== null && value !== undefined ? String(value) : 'N/A'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && (results?.length || 0) === 0 && (searchTerm || Object.keys(filters).length > 0) && (
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">Select an index to search</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose an index from the list above to start searching.
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;