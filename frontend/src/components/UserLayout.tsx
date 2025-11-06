import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { useSystemSettings, defaultSystemSettings } from '../contexts/SystemSettingsContext';
import { 
  Calendar,
  BarChart3,
  Search,
  Home,
  LogOut, 
  Menu, 
  X,
  Shield,
  ChevronRight,
  Sparkles,
  Users
} from 'lucide-react';

const UserLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { settings } = useSystemSettings();
  
  const siteName = settings?.siteName || defaultSystemSettings.siteName;

  const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'teams', href: '/search', icon: Search },
    { name: 'Graphiques', href: '/charts', icon: BarChart3 },
    { name: 'Calendrier', href: '/events', icon: Calendar },
    { name: 'Mes Équipes', href: '/my-teams-events', icon: Users },
  ];

  const adminNavigation = user?.role === 'admin' ? [
    { name: 'Admin Panel', href: '/admin', icon: Shield },
  ] : [];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-gray-900 opacity-75 transition-opacity" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-white to-gray-50 shadow-xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-transform hover:scale-110"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            {/* Logo Section */}
            <div className="flex-shrink-0 flex items-center justify-center px-4 mb-8">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img
                    src="/imagelogo.png"
                    alt="Logo"
                    className="h-20 w-auto object-contain mx-auto drop-shadow-sm"
                  />
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                  </div>
                </div>
                <h2 className="mt-2 text-sm font-semibold text-gray-600">{siteName}</h2>
              </div>
            </div>

            {/* Navigation */}
            <nav className="mt-2 px-3 space-y-1">
              <div className="px-2 mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigation</p>
              </div>
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      active
                        ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    } group flex items-center justify-between px-3 py-3 text-base font-medium rounded-lg transition-all duration-200`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className="flex items-center">
                      <Icon className={`mr-3 h-5 w-5 ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                      <span>{item.name}</span>
                    </div>
                    {active && <ChevronRight className="h-4 w-4 text-white" />}
                  </Link>
                );
              })}

             
            </nav>
          </div>

          {/* User Profile Section */}
          <div className="flex-shrink-0 flex border-t border-gray-200 bg-white p-4">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-600 flex items-center justify-center shadow-md ring-2 ring-white">
                  <span className="text-sm font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs font-medium text-gray-500 capitalize">{user?.role || 'User'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto flex-shrink-0 bg-white p-2 text-gray-400 rounded-lg hover:text-purple-600 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                title="Logout"
              >
                <span className="sr-only">Logout</span>
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-72">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-gradient-to-b from-white via-white to-gray-50 shadow-sm">
            <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
              {/* Logo Section */}
              <div className="flex justify-center mb-10 px-4">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <img
                      src="/imagelogo.png"
                      alt="Logo"
                      className="h-28 w-auto object-contain drop-shadow-md"
                    />
                    <div className="absolute -top-1 -right-1">
                      <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
                    </div>
                  </div>
                  <h2 className="mt-3 text-base font-bold text-gray-800">{siteName}</h2>
                  <div className="mt-1 flex items-center space-x-1">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs text-gray-500">Online</span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="mt-2 flex-1 px-4 space-y-2">
                <div className="px-3 mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigation</p>
                </div>
                {mainNavigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        active
                          ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg transform scale-[1.02]'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      } group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-md`}
                    >
                      <div className="flex items-center">
                        <Icon className={`mr-3 h-5 w-5 transition-transform ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-700 group-hover:scale-110'}`} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      {active && <ChevronRight className="h-4 w-4 text-white animate-pulse" />}
                    </Link>
                  );
                })}

              
              </nav>
            </div>

            {/* User Profile Section */}
            <div className="flex-shrink-0 flex border-t border-gray-200 bg-white p-5 shadow-lg">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-600 flex items-center justify-center shadow-lg ring-2 ring-white ring-offset-2 ring-offset-gray-50">
                    <span className="text-base font-bold text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                  <div className="flex items-center mt-0.5">
                    <p className="text-xs font-medium text-gray-500 capitalize">{user?.role || 'User'}</p>
                    {user?.role === 'admin' && (
                      <Shield className="ml-2 h-3 w-3 text-purple-600" />
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-auto flex-shrink-0 bg-white p-2.5 text-gray-400 rounded-xl hover:text-purple-600 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 hover:shadow-md"
                  title="Logout"
                >
                  <span className="sr-only">Logout</span>
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 lg:hidden transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 px-4 sm:px-6 flex justify-between items-center">
            <div className="flex-1 flex items-center">
              <div className="flex items-center">
                <Link 
                  to="/" 
                  className="flex items-center text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors group"
                >
                  <Home className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span>Back to Main Site</span>
                </Link>
              </div>
            </div>
            <div className="ml-4 flex items-center lg:ml-6">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Active Session</span>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50">
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

export default UserLayout;
