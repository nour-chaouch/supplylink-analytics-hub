import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../store/store';
import { 
  TrendingUp, 
  DollarSign, 
  Wheat, 
  Users, 
  Globe, 
  BarChart3, 
  Search, 
  Leaf,
  ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 700 },
];

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const quickActions = [
    {
      title: 'Analytics Dashboard',
      description: 'Comprehensive agricultural data analysis',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-blue-500'
    },
    {
      title: 'Search Data',
      description: 'Find specific agricultural statistics',
      icon: Search,
      href: '/search',
      color: 'bg-green-500'
    },
    {
      title: 'Producer Prices',
      description: 'Agricultural price trends and analysis',
      icon: DollarSign,
      href: '/producer-prices',
      color: 'bg-yellow-500'
    },
    {
      title: 'Crops & Livestock',
      description: 'Production and livestock statistics',
      icon: Leaf,
      href: '/crops-livestock',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SupplyLink Analytics Hub</h1>
          <p className="text-gray-600">Welcome back, {user?.name || 'User'}! Here's your agricultural data overview.</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
          Export Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
              <p className="text-xs text-green-600">+20.1% from last month</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">$45,231</p>
              <p className="text-xs text-green-600">+15.3% from last month</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">89</p>
              <p className="text-xs text-green-600">+5.2% from last month</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">23</p>
              <p className="text-xs text-red-600">-2.1% from last month</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Wheat className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <p className="text-sm text-gray-600 mb-4">Access key features and data analysis tools</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} to={action.href}>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{action.title}</h3>
                        <p className="text-xs text-gray-600">{action.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Analytics</h3>
          <p className="text-sm text-gray-600 mb-4">Overview of your supply chain performance</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Data Updates</h3>
        <p className="text-sm text-gray-600 mb-4">Latest agricultural data entries from FAO STAT</p>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">PP</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">A</span>
                </div>
                <h3 className="font-semibold">Barley Producer Price</h3>
                <p className="text-gray-600">Producer Price (USD/tonne) - Algeria</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>📍 Algeria</span>
                  <span>📅 1991</span>
                  <span>📊 $124.50 USD</span>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">QCL</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">A</span>
                </div>
                <h3 className="font-semibold">Almonds Area Harvested</h3>
                <p className="text-gray-600">Area harvested - Afghanistan</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>📍 Afghanistan</span>
                  <span>📅 2019</span>
                  <span>📊 29,203 ha</span>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

