import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useSystemSettings, defaultSystemSettings } from '../contexts/SystemSettingsContext';
import { agriculturalAPI } from '../services/api';
import { 
  BarChart3, 
  Search, 
  DollarSign, 
  Leaf, 
  TrendingUp,
  Globe,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Database,
  Users,
  Package,
  MapPin,
  Calendar,
  FileText,
  ShoppingCart,
  Heart,
  Car,
  Home as HomeIcon,
  Briefcase,
  Book,
  Loader2
} from 'lucide-react';

interface IndexInfo {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  documentCount: number;
  status: string;
  health: string;
  size: string;
  lastModified: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    email: string;
  };
  hasMetadata: boolean;
}

const Home: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { settings } = useSystemSettings();
  
  const siteName = settings?.siteName || defaultSystemSettings.siteName;
  const siteDescription = settings?.siteDescription || defaultSystemSettings.siteDescription;
  
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Icon mapping function
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      Database,
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
      HomeIcon,
      Briefcase,
      Book
    };
    return iconMap[iconName] || Database;
  };

  // Color schemes for different indices
  const getColorScheme = (index: number) => {
    const schemes = [
      { color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', iconColor: 'text-blue-600', gradient: 'bg-gradient-to-br from-blue-500 to-blue-600' },
      { color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', iconColor: 'text-green-600', gradient: 'bg-gradient-to-br from-green-500 to-green-600' },
      { color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600', gradient: 'bg-gradient-to-br from-yellow-500 to-yellow-600' },
      { color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600', gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
      { color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', iconColor: 'text-purple-600', gradient: 'bg-gradient-to-br from-purple-500 to-purple-600' },
      { color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-50', iconColor: 'text-pink-600', gradient: 'bg-gradient-to-br from-pink-500 to-pink-600' },
      { color: 'from-indigo-500 to-indigo-600', bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600', gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
      { color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', iconColor: 'text-red-600', gradient: 'bg-gradient-to-br from-red-500 to-red-600' }
    ];
    return schemes[index % schemes.length];
  };

  // Fetch indices on component mount
  useEffect(() => {
    const fetchIndices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await agriculturalAPI.getIndices();
        if (response.data.success) {
          setIndices(response.data.data || []);
        } else {
          setError('Failed to load indices');
        }
      } catch (err: any) {
        console.error('Error fetching indices:', err);
        setError('Failed to load indices');
      } finally {
        setLoading(false);
      }
    };

    fetchIndices();
  }, []);

  const features = [
    {
      title: 'Analytics Dashboard',
      description: 'Comprehensive agricultural data analytics with interactive charts and insights',
      icon: BarChart3,
      href: '/analytics',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      stats: '50+ Metrics',
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    {
      title: 'Smart Search',
      description: 'Advanced search capabilities across agricultural datasets with filters',
      icon: Search,
      href: '/search',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      stats: '10K+ Records',
      gradient: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    {
      title: 'Producer Prices',
      description: 'Real-time producer price data and market trends analysis',
      icon: DollarSign,
      href: '/producer-prices',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      stats: 'Live Data',
      gradient: 'bg-gradient-to-br from-yellow-500 to-yellow-600'
    },
    {
      title: 'Crops & Livestock',
      description: 'Comprehensive data on crop production and livestock statistics',
      icon: Leaf,
      href: '/crops-livestock',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      stats: 'Global Data',
      gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {siteName}
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {siteDescription}
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                Trusted Platform
              </div>
              <div className="flex items-center">
                <Zap className="h-4 w-4 text-blue-400 mr-1" />
                Real-time Data
              </div>
              <div className="flex items-center">
                <Globe className="h-4 w-4 text-green-400 mr-1" />
                Global Coverage
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Panel Button 
      {user?.role === 'admin' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center">
            <Link
              to="/admin"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Shield className="h-5 w-5 mr-2" />
              Access Admin Panel
            </Link>
          </div>
        </div>
      )}
      */}
      

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Explore Our Features
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover powerful tools designed to help you analyze agricultural data and make informed decisions.
          </p>
        </div>

        {/* Dynamic Index Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Loading indices...
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        ) : indices.length === 0 ? (
          <div className="text-center py-12">
            <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No indices available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {indices.map((index, indexNum) => {
              const IconComponent = getIconComponent(index.icon || 'Database');
              const colorScheme = getColorScheme(indexNum);
              const title = index.displayName || index.name;
              const description = index.description || `Explore data in the ${index.name} index`;
              const stats = `${index.documentCount.toLocaleString()} docs`;
              
              return (
                <Link
                  key={index.name}
                  to={`/search?index=${index.name}`}
                  className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 ${colorScheme.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  <div className="relative p-6">
                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${colorScheme.bgColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`h-6 w-6 ${colorScheme.iconColor}`} />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {stats}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-indigo-600">
                {indices.length > 0 ? indices.reduce((sum, index) => sum + index.documentCount, 0).toLocaleString() : '0'}
              </div>
              <div className="text-gray-600">Data Records</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">{indices.length}</div>
              <div className="text-gray-600">Data Sources</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-yellow-600">24/7</div>
              <div className="text-gray-600">Data Updates</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-purple-600">Global</div>
              <div className="text-gray-600">Coverage</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
