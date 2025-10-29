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
  Loader2,
  Sparkles,
  Award,
  Target,
  ChevronRight
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ 
        background: 'linear-gradient(to bottom right, #4f46e5, #005D00, #006400)' 
      }}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8 border border-white/20">
              <Sparkles className="h-4 w-4 text-white mr-2" />
              <span className="text-white text-sm font-medium">Powered by AI Analytics</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Welcome to{' '}
              <span className="block mt-2 bg-gradient-to-r from-yellow-300 via-green-300 to-emerald-300 bg-clip-text text-transparent animate-gradient">
                {siteName}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              {siteDescription}
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-white/90 mb-12">
              <div className="flex items-center group">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg mr-3 group-hover:bg-white/30 transition-all">
                  <Star className="h-5 w-5 text-yellow-300" />
                </div>
                <span className="text-sm font-medium">Trusted Platform</span>
              </div>
              <div className="flex items-center group">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg mr-3 group-hover:bg-white/30 transition-all">
                  <Zap className="h-5 w-5 text-blue-300" />
                </div>
                <span className="text-sm font-medium">Real-time Data</span>
              </div>
              <div className="flex items-center group">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg mr-3 group-hover:bg-white/30 transition-all">
                  <Globe className="h-5 w-5 text-green-300" />
                </div>
                <span className="text-sm font-medium">Global Coverage</span>
              </div>
              <div className="flex items-center group">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg mr-3 group-hover:bg-white/30 transition-all">
                  <Shield className="h-5 w-5 text-green-300" />
                </div>
                <span className="text-sm font-medium">Secure & Reliable</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/search"
                className="group inline-flex items-center px-8 py-4 bg-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                style={{ color: '#005D00' }}
              >
                <Search className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                Start Searching
              </Link>
              <Link
                to="/analytics"
                className="group inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                View Analytics
              </Link>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block h-20 w-full">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white"></path>
          </svg>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 rounded-full mb-4" style={{ backgroundColor: '#E6F4E6', color: '#005D00' }}>
            <span className="text-sm font-semibold">Explore Data Sources</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{
            background: 'linear-gradient(to right, #1a1a1a, #005D00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Discover Agricultural Insights
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Access comprehensive datasets and powerful analytics tools designed to help you make data-driven decisions.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
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
                  className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100"
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 ${colorScheme.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                  
                  {/* Corner Accent */}
                  <div className={`absolute top-0 right-0 w-32 h-32 ${colorScheme.gradient} opacity-0 group-hover:opacity-10 transform rotate-45 translate-x-8 -translate-y-8 transition-all duration-500`}></div>
                  
                  <div className="relative p-8">
                    {/* Icon with Glow Effect */}
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${colorScheme.bgColor} mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-2xl`}>
                      <IconComponent className={`h-8 w-8 ${colorScheme.iconColor}`} />
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-6 right-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        index.status === 'available' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          index.status === 'available' ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        {index.status}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 transition-colors group-hover:!text-[#005D00]">
                      {title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                      {description}
                    </p>

                    {/* Stats with Icons */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center text-gray-600">
                        <Database className="h-4 w-4 mr-2" />
                        <span className="text-sm">{stats}</span>
                      </div>
                      {index.size && (
                        <div className="flex items-center text-gray-600">
                          <Package className="h-4 w-4 mr-2" />
                          <span className="text-sm">{index.size}</span>
                        </div>
                      )}
                    </div>

                    {/* Call to Action */}
                    <div className="flex items-center font-semibold mt-6" style={{ color: '#005D00' }}>
                      <span className="text-sm mr-2">Explore Data</span>
                      <ChevronRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>

                  {/* Bottom Border Effect */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${colorScheme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-24 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full mb-4 backdrop-blur-sm border" style={{ 
              backgroundColor: 'rgba(0, 93, 0, 0.2)', 
              color: '#4CAF50',
              borderColor: 'rgba(0, 93, 0, 0.3)'
            }}>
              <span className="text-sm font-semibold">Platform Insights</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Powering Data-Driven Decisions
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Comprehensive agricultural data analytics at your fingertips
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(0, 93, 0, 0.2)' }}>
                  <Database className="h-8 w-8" style={{ color: '#4CAF50' }} />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {indices.length > 0 ? indices.reduce((sum, index) => sum + index.documentCount, 0).toLocaleString() : '0'}
                </div>
                <div className="text-gray-400 font-medium">Data Records</div>
                <div className="mt-4 text-sm text-gray-500">Served across all sources</div>
              </div>
            </div>
            
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 p-3 bg-green-500/20 rounded-xl">
                  <Award className="h-8 w-8 text-green-400" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{indices.length}</div>
                <div className="text-gray-400 font-medium">Data Sources</div>
                <div className="mt-4 text-sm text-gray-500">Integrated datasets</div>
              </div>
            </div>
            
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 p-3 bg-yellow-500/20 rounded-xl">
                  <Zap className="h-8 w-8 text-yellow-400" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">24/7</div>
                <div className="text-gray-400 font-medium">Data Updates</div>
                <div className="mt-4 text-sm text-gray-500">Real-time synchronization</div>
              </div>
            </div>
            
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 p-3 bg-emerald-500/20 rounded-xl">
                  <Globe className="h-8 w-8 text-emerald-400" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">Global</div>
                <div className="text-gray-400 font-medium">Coverage</div>
                <div className="mt-4 text-sm text-gray-500">Worldwide reach</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
