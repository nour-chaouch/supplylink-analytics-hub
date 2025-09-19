import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { useSystemSettings, defaultSystemSettings } from '../contexts/SystemSettingsContext';
import { 
  BarChart3, 
  Users, 
  Database,
  Settings,
  LogOut, 
  Menu, 
  X,
  Home,
  Shield,
  ChevronRight,
  Sliders
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { settings } = useSystemSettings();
  
  const siteName = settings?.siteName || defaultSystemSettings.siteName;

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/admin', icon: Settings },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Elasticsearch', href: '/admin/elasticsearch', icon: Database },
    { name: 'All Settings', href: '/admin/all-settings', icon: Sliders },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-gray-600 opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600 mr-2" />
                <h1 className="text-xl font-bold text-gray-900">{siteName} Admin</h1>
              </div>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive(item.href)
                        ? 'bg-red-100 text-red-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-red-700">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs font-medium text-red-600">Admin</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto flex-shrink-0 bg-white p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <span className="sr-only">Logout</span>
                <LogOut className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-red-600 mr-2" />
                  <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                </div>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive(item.href)
                          ? 'bg-red-100 text-red-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-red-700">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs font-medium text-red-600">Admin</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-auto flex-shrink-0 bg-white p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <span className="sr-only">Logout</span>
                  <LogOut className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <div className="flex items-center">
                <Link 
                  to="/" 
                  className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  <Home className="h-4 w-4 mr-1" />
                  Back to Main Site
                </Link>
              </div>
            </div>
            <div className="ml-4 flex items-center lg:ml-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-gray-700">Admin Access</span>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
