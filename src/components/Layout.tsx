import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store/store'
import { logout } from '@/store/slices/authSlice'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Search, 
  TrendingUp, 
  DollarSign, 
  Wheat, 
  LogOut,
  Home,
  BarChart,
  Shield,
  Users,
  TestTube
} from 'lucide-react'

const Layout = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const { user } = useSelector((state: RootState) => state.auth)

  const handleLogout = () => {
    dispatch(logout())
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Search Data', href: '/search', icon: Search },
    { name: 'Producer Prices', href: '/producer-prices', icon: DollarSign },
    { name: 'Crops & Livestock', href: '/crops-livestock', icon: Wheat },
    { name: 'API Test', href: '/api-test', icon: TestTube },
  ]

  const adminNavigation = [
    { name: 'Admin Panel', href: '/admin-panel', icon: Shield },
    { name: 'Admin Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Manage Users', href: '/admin/users', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mr-2" />
                <h1 className="text-xl font-semibold text-gray-900">SupplyLink Analytics</h1>
              </div>
              
              <div className="hidden md:flex space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
                
                {/* Admin Navigation - Only show for admin users */}
                {user?.role === 'admin' && (
                  <>
                    <div className="h-6 w-px bg-gray-300 mx-2"></div>
                    {adminNavigation.map((item) => {
                      const Icon = item.icon
                      const isActive = location.pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors ${
                            isActive
                              ? 'bg-red-100 text-red-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      )
                    })}
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.name || 'User'}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
