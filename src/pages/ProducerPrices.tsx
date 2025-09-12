import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts'
import { DollarSign, TrendingUp, TrendingDown, Download, Filter } from 'lucide-react'

const ProducerPrices = () => {
  const [selectedItem, setSelectedItem] = useState('all')
  const [selectedArea, setSelectedArea] = useState('all')
  const [chartType, setChartType] = useState('line')

  // Sample producer prices data
  const priceData = [
    { year: 2019, barley: 180, wheat: 220, corn: 160, rice: 400, cotton: 280 },
    { year: 2020, barley: 190, wheat: 240, corn: 170, rice: 420, cotton: 290 },
    { year: 2021, barley: 210, wheat: 260, corn: 185, rice: 450, cotton: 310 },
    { year: 2022, barley: 230, wheat: 280, corn: 200, rice: 480, cotton: 330 },
    { year: 2023, barley: 250, wheat: 300, corn: 220, rice: 500, cotton: 350 },
  ]

  const areaData = [
    { area: 'Algeria', barley: 245, wheat: 285, corn: 205, rice: 485 },
    { area: 'Afghanistan', barley: 235, wheat: 275, corn: 195, rice: 475 },
    { area: 'Brazil', barley: 255, wheat: 295, corn: 215, rice: 495 },
    { area: 'China', barley: 265, wheat: 305, corn: 225, rice: 505 },
    { area: 'India', barley: 275, wheat: 315, corn: 235, rice: 515 },
  ]

  const renderChart = () => {
    const data = selectedArea === 'all' ? priceData : areaData
    const dataKey = selectedArea === 'all' ? 'year' : 'area'

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dataKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="barley" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="wheat" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="corn" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="rice" stroke="#ef4444" strokeWidth={2} />
              {selectedArea === 'all' && <Line type="monotone" dataKey="cotton" stroke="#8b5cf6" strokeWidth={2} />}
            </LineChart>
          </ResponsiveContainer>
        )
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dataKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="barley" fill="#3b82f6" />
              <Bar dataKey="wheat" fill="#10b981" />
              <Bar dataKey="corn" fill="#f59e0b" />
              <Bar dataKey="rice" fill="#ef4444" />
              {selectedArea === 'all' && <Bar dataKey="cotton" fill="#8b5cf6" />}
            </BarChart>
          </ResponsiveContainer>
        )
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dataKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="barley" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="wheat" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="corn" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
              <Area type="monotone" dataKey="rice" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
            </AreaChart>
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
          <h1 className="text-3xl font-bold text-gray-900">Producer Prices</h1>
          <p className="text-gray-600">Agricultural producer price trends and analysis</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
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
              +12.5% from last year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$515.00</div>
            <p className="text-xs text-muted-foreground">Rice in India</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lowest Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$195.00</div>
            <p className="text-xs text-muted-foreground">Corn in Afghanistan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Volatility</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.2%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              -2.1% from last year
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Price Trends Analysis</CardTitle>
              <CardDescription>Producer price trends by commodity and region</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  <SelectItem value="Algeria">Algeria</SelectItem>
                  <SelectItem value="Afghanistan">Afghanistan</SelectItem>
                  <SelectItem value="Brazil">Brazil</SelectItem>
                  <SelectItem value="China">China</SelectItem>
                  <SelectItem value="India">India</SelectItem>
                </SelectContent>
              </Select>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Commodities by Price</CardTitle>
            <CardDescription>Highest average producer prices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { commodity: 'Rice', price: 485, change: '+12.5%', color: '#ef4444' },
                { commodity: 'Wheat', price: 285, change: '+8.2%', color: '#10b981' },
                { commodity: 'Cotton', price: 350, change: '+15.3%', color: '#8b5cf6' },
                { commodity: 'Barley', price: 245, change: '+6.1%', color: '#3b82f6' },
                { commodity: 'Corn', price: 205, change: '+4.7%', color: '#f59e0b' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium">{item.commodity}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${item.price}</div>
                    <div className="text-xs text-green-600">{item.change}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Price Comparison</CardTitle>
            <CardDescription>Average prices by region</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { region: 'Asia', price: 320, change: '+10.2%', flag: '🌏' },
                { region: 'Africa', price: 280, change: '+8.7%', flag: '🌍' },
                { region: 'Europe', price: 350, change: '+12.1%', flag: '🌍' },
                { region: 'Americas', price: 295, change: '+7.3%', flag: '🌎' },
                { region: 'Oceania', price: 310, change: '+9.5%', flag: '🌏' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{item.flag}</span>
                    <span className="font-medium">{item.region}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${item.price}</div>
                    <div className="text-xs text-green-600">{item.change}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProducerPrices







