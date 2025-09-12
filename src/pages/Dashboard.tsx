import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { RootState } from '@/store/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
} from 'lucide-react'

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 700 },
]

const Dashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth)

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
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SupplyLink Analytics Hub</h1>
          <p className="text-gray-600">Welcome back, {user?.name || 'User'}! Here's your agricultural data overview.</p>
        </div>
        <Button>Export Data</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground">+15.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+5.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">-2.1% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access key features and data analysis tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon
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
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Analytics</CardTitle>
            <CardDescription>Overview of your supply chain performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Data Updates</CardTitle>
          <CardDescription>Latest agricultural data entries from FAO STAT</CardDescription>
        </CardHeader>
        <CardContent>
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
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
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
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
