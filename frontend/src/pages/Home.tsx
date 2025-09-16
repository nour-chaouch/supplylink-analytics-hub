import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
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
  Shield
} from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

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
                SupplyLink
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your comprehensive agricultural analytics platform. Explore data, gain insights, and make informed decisions with our powerful tools.
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

      {/* Admin Panel Button */}
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

        {/* Main Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                to={feature.href}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative p-6">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bgColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {feature.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {feature.stats}
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
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-indigo-600">10K+</div>
              <div className="text-gray-600">Data Records</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">50+</div>
              <div className="text-gray-600">Countries</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-yellow-600">100+</div>
              <div className="text-gray-600">Crop Types</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-purple-600">24/7</div>
              <div className="text-gray-600">Data Updates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
