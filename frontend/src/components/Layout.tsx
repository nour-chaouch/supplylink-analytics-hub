import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { useSystemSettings, defaultSystemSettings } from '../contexts/SystemSettingsContext';
import { 
  BarChart3, 
  Search, 
  DollarSign, 
  Leaf, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Home,
  LogIn,
  UserPlus,
  Database
} from 'lucide-react';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { settings } = useSystemSettings();
  
  const siteName = settings?.siteName || defaultSystemSettings.siteName;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Producer Prices', href: '/producer-prices', icon: DollarSign },
    { name: 'Crops & Livestock', href: '/crops-livestock', icon: Leaf },
  ];

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/admin', icon: Settings },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Elasticsearch', href: '/admin/elasticsearch', icon: Database },
  ];

  const handleLogout = () => {
    dispatch(logout());
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-gray-900">{siteName}</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive(item.href)
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  >
                    <Icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                );
              })}
              {user?.role === 'admin' && (
                <>
                  <div className="border-t border-gray-200 my-4"></div>
                  {adminNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`${
                          isActive(item.href)
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                      >
                        <Icon className="mr-4 h-6 w-6" />
                        {item.name}
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">{siteName}</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive(item.href)
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
                {user?.role === 'admin' && (
                  <>
                    <div className="border-t border-gray-200 my-4"></div>
                    {adminNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`${
                            isActive(item.href)
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                        >
                          <Icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </>
                )}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              {user ? (
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                    <p className="text-xs font-medium text-gray-500">{user?.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-auto flex-shrink-0 bg-white p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
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

export default Layout;
