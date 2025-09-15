import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Settings, 
  Users, 
  BarChart3, 
  Database,
  Server,
  Lock,
  Activity,
  AlertCircle,
  Plus,
  Search,
  Filter
} from 'lucide-react'

const AdminPanel = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-red-600" />
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              </div>
              <Badge variant="destructive" className="ml-4">
                Admin Only
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Activity className="h-4 w-4 text-green-500" />
                <span>System Online</span>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Admin Panel</h2>
          <p className="text-gray-600">Manage your system with powerful administrative tools</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">
                All services running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Currently online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Connected</div>
              <p className="text-xs text-muted-foreground">
                MongoDB active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Secure</div>
              <p className="text-xs text-muted-foreground">
                JWT authentication
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Database Tools
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  System Settings
                </Button>
              </CardContent>
            </Card>

            {/* System Alerts */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-4">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No alerts at this time</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Admin Dashboard</CardTitle>
                    <CardDescription>System overview and management</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Empty State */}
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Shield className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Admin Panel Ready
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    This is your administrative control panel. Add your custom admin features and tools here.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button variant="outline">
                      Configure Settings
                    </Button>
                    <Button>
                      Get Started
                    </Button>
                  </div>
                </div>

                {/* Placeholder Content */}
                <div className="mt-8 space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-2">User Management</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Manage user accounts, roles, and permissions
                    </p>
                    <Button variant="outline" size="sm">
                      View Users
                    </Button>
                  </div>

                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-2">System Monitoring</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Monitor system performance and health
                    </p>
                    <Button variant="outline" size="sm">
                      View Metrics
                    </Button>
                  </div>

                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Data Management</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Manage application data and backups
                    </p>
                    <Button variant="outline" size="sm">
                      Manage Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Admin Panel v1.0.0 | JWT Authentication Enabled | System Secure</p>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
