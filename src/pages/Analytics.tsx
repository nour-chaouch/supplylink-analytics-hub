import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Wheat, Users, Globe } from 'lucide-react'

const Analytics = () => {
  const [selectedChart, setSelectedChart] = useState('line')
  const [selectedMetric, setSelectedMetric] = useState('prices')

  // Sample data - replace with real API data
  const priceData = [
    { year: '2019', barley: 180, wheat: 220, corn: 160, rice: 400 },
    { year: '2020', barley: 190, wheat: 240, corn: 170, rice: 420 },
    { year: '2021', barley: 210, wheat: 260, corn: 185, rice: 450 },
    { year: '2022', barley: 230, wheat: 280, corn: 200, rice: 480 },
    { year: '2023', barley: 250, wheat: 300, corn: 220, rice: 500 },
  ]

  const productionData = [
    { year: '2019', area: 1200, yield: 850, production: 1020 },
    { year: '2020', area: 1250, yield: 880, production: 1100 },
    { year: '2021', area: 1300, yield: 920, production: 1196 },
    { year: '2022', area: 1350, yield: 950, production: 1283 },
    { year: '2023', area: 1400, yield: 980, production: 1372 },
  ]

  const pieData = [
    { name: 'Grains', value: 45, color: '#3b82f6' },
    { name: 'Vegetables', value: 25, color: '#10b981' },
    { name: 'Fruits', value: 20, color: '#f59e0b' },
    { name: 'Livestock', value: 10, color: '#ef4444' },
  ]

  const renderChart = () => {
    switch (selectedChart) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={selectedMetric === 'prices' ? priceData : productionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetric === 'prices' ? (
                <>
                  <Line type="monotone" dataKey="barley" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="wheat" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="corn" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="rice" stroke="#ef4444" strokeWidth={2} />
                </>
              ) : (
                <>
                  <Line type="monotone" dataKey="area" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="yield" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="production" stroke="#f59e0b" strokeWidth={2} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        )
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={selectedMetric === 'prices' ? priceData : productionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetric === 'prices' ? (
                <>
                  <Bar dataKey="barley" fill="#3b82f6" />
                  <Bar dataKey="wheat" fill="#10b981" />
                  <Bar dataKey="corn" fill="#f59e0b" />
                  <Bar dataKey="rice" fill="#ef4444" />
                </>
              ) : (
                <>
                  <Bar dataKey="area" fill="#3b82f6" />
                  <Bar dataKey="yield" fill="#10b981" />
                  <Bar dataKey="production" fill="#f59e0b" />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        )
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive agricultural data analysis</p>
        </div>
        <div className="flex space-x-2">
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prices">Prices</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedChart} onValueChange={setSelectedChart}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$245.50</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Production</CardTitle>
            <Wheat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,372K tons</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              +8.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Farmers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              -2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              +3 new this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agricultural Trends</CardTitle>
          <CardDescription>
            {selectedMetric === 'prices' ? 'Producer price trends over time' : 'Production metrics analysis'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>
    </div>
  )
}

export default Analytics









