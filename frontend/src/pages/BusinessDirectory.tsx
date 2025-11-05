import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { businessAPI } from '../services/api';
import {
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building2,
  Tag,
  Users,
  Calendar,
  Star,
  Briefcase,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

interface Business {
  _id: string;
  name: string;
  category?: string;
  industry?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  tags?: string[];
  products?: string[];
  services?: string[];
  employees?: number;
  yearFounded?: number;
  revenue?: number;
  rating?: number;
  verified?: boolean;
  featured?: boolean;
  logo?: string;
  createdAt?: string;
}

interface Category {
  name: string;
  count: number;
}

interface Industry {
  name: string;
  count: number;
}

const BusinessDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBusinesses, setTotalBusinesses] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const limit = 12;

  useEffect(() => {
    loadCategories();
    loadIndustries();
    loadBusinesses();
  }, [currentPage, searchQuery, selectedCategory, selectedIndustry, selectedCity]);

  const loadBusinesses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
        limit,
      };

      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      if (selectedIndustry) {
        params.industry = selectedIndustry;
      }
      if (selectedCity) {
        params.city = selectedCity;
      }

      const response = await businessAPI.getBusinesses(params);
      if (response.data.success) {
        setBusinesses(response.data.data);
        setTotalPages(response.data.pagination.pages);
        setTotalBusinesses(response.data.pagination.total);
      } else {
        setError(response.data.message || 'Failed to load businesses');
      }
    } catch (err: any) {
      console.error('Error loading businesses:', err);
      setError(err.response?.data?.message || 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await businessAPI.getCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadIndustries = async () => {
    try {
      const response = await businessAPI.getIndustries();
      if (response.data.success) {
        setIndustries(response.data.data);
      }
    } catch (err) {
      console.error('Error loading industries:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadBusinesses();
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    loadBusinesses();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedIndustry('');
    setSelectedCity('');
    setCurrentPage(1);
  };

  const getBusinessAddress = (business: Business): string => {
    if (!business.address) return 'Address not available';
    const parts = [
      business.address.street,
      business.address.city,
      business.address.state,
      business.address.zipCode,
    ].filter(Boolean);
    return parts.join(', ') || 'Address not available';
  };

  const formatCurrency = (amount?: number): string => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Briefcase className="h-8 w-8 mr-3 text-green-600" />
                Business Directory
              </h1>
              <p className="mt-2 text-gray-600">
                Discover and connect with businesses in the agricultural supply chain
              </p>
            </div>
            {totalBusinesses > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Businesses</p>
                <p className="text-2xl font-bold text-green-600">{totalBusinesses.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search businesses by name, products, or services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-6 py-2 border rounded-lg transition-colors flex items-center ${
                  showFilters
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="border-t pt-4 mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        handleFilterChange();
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name} ({cat.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <select
                      value={selectedIndustry}
                      onChange={(e) => {
                        setSelectedIndustry(e.target.value);
                        handleFilterChange();
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">All Industries</option>
                      {industries.map((ind) => (
                        <option key={ind.name} value={ind.name}>
                          {ind.name} ({ind.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="Enter city..."
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value);
                        handleFilterChange();
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {(selectedCategory || selectedIndustry || selectedCity || searchQuery) && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-gray-600">
                      Active filters: {[selectedCategory, selectedIndustry, selectedCity, searchQuery].filter(Boolean).length}
                    </span>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-sm text-green-600 hover:text-green-700 flex items-center"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-2 text-gray-600">Loading businesses...</span>
          </div>
        )}

        {/* Business Grid */}
        {!loading && businesses.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No businesses found</h3>
            <p className="text-gray-600">
              {searchQuery || selectedCategory || selectedIndustry || selectedCity
                ? 'Try adjusting your search or filters'
                : 'No businesses available at the moment'}
            </p>
          </div>
        )}

        {!loading && businesses.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {businesses.map((business) => (
                <div
                  key={business._id}
                  className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer border-2 ${
                    business.featured ? 'border-green-500' : 'border-transparent'
                  }`}
                  onClick={() => navigate(`/businesses/${business._id}`)}
                >
                  {business.featured && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">
                        Featured
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      {business.name}
                      {business.verified && (
                        <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                      )}
                    </h3>
                  </div>

                  {business.category && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Tag className="h-4 w-4 mr-1" />
                      {business.category}
                    </div>
                  )}

                  {business.industry && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Building2 className="h-4 w-4 mr-1" />
                      {business.industry}
                    </div>
                  )}

                  {business.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {business.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-gray-600">
                    {business.address?.city && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {getBusinessAddress(business)}
                      </div>
                    )}

                    {business.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        {business.phone}
                      </div>
                    )}

                    {business.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        {business.email}
                      </div>
                    )}

                    {business.website && (
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        <a
                          href={business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    {business.rating && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm font-medium">{business.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {business.employees && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-1" />
                        {business.employees} employees
                      </div>
                    )}
                  </div>

                  {business.tags && business.tags.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex flex-wrap gap-2">
                        {business.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {business.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs text-gray-500">
                            +{business.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-lg shadow-sm px-6 py-4">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalBusinesses)} of {totalBusinesses} businesses
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      currentPage === 1
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            currentPage === pageNum
                              ? 'bg-green-600 text-white border-green-600'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      currentPage === totalPages
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default BusinessDirectory;

