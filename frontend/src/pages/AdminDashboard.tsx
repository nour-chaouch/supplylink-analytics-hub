import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { adminAPI } from '../services/api';
import { Users, BarChart3, TrendingUp, Settings } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getStats();
        setStats(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch admin statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome, {user?.name}! Manage your SupplyLink platform.</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
            Admin
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalUsers || '0'}
              </p>
              <p className="text-xs text-green-600">+12% from last month</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.activeSessions || '0'}
              </p>
              <p className="text-xs text-green-600">+8% from last month</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Requests</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.dataRequests || '0'}
              </p>
              <p className="text-xs text-green-600">+25% from last month</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-2xl font-bold text-gray-900">98.5%</p>
              <p className="text-xs text-green-600">All systems operational</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">User Management</h4>
                  <p className="text-sm text-gray-600">Manage user accounts and permissions</p>
                </div>
                <Users className="h-5 w-5 text-gray-400" />
              </div>
            </button>
            <button className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">System Settings</h4>
                  <p className="text-sm text-gray-600">Configure platform settings</p>
                </div>
                <Settings className="h-5 w-5 text-gray-400" />
              </div>
            </button>
            <button className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Data Analytics</h4>
                  <p className="text-sm text-gray-600">View platform usage statistics</p>
                </div>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">New user registered</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Data export completed</p>
                <p className="text-xs text-gray-500">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">System backup completed</p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Database updated</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
