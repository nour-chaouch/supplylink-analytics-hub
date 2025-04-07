import React, { useState } from 'react';
import { TrendingUp, LineChart, BarChart3, Calendar } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import DataCard from '@/components/DataCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useGetAvailableCropsQuery, useGetAvailableCountriesQuery, useGetCropDataQuery } from '@/store/slices/faostatApiSlice';

interface CropData {
  country: string;
  latest_production: string;
  production_change: number;
  average_yield: string;
  yield_change: number;
  current_price: string;
  trade_volume: string;
  production_trend: Array<{ year: number; value: number; unit: string }>;
  yield_trend: Array<{ year: number; value: number; unit: string }>;
}

interface Crops {
  [key: string]: string;
}

interface Countries {
  [key: string]: string;
}

const FarmerDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState("15"); // Default to Wheat
  const [selectedCountry, setSelectedCountry] = useState("212"); // Default to Tunisia
  const [yearRange, setYearRange] = useState({ start: 2010, end: 2023 });

  // Fetch data using RTK Query
  const { data: availableCrops, isLoading: cropsLoading } = useGetAvailableCropsQuery({}) as { data: Crops | undefined; isLoading: boolean };
  const { data: availableCountries, isLoading: countriesLoading } = useGetAvailableCountriesQuery({}) as { data: Countries | undefined; isLoading: boolean };
  const { data: cropData, isLoading: dataLoading, error: dataError } = useGetCropDataQuery({
    cropCode: selectedCrop,
    countryCode: selectedCountry,
    yearStart: yearRange.start,
    yearEnd: yearRange.end,
  }) as { data: CropData | undefined; isLoading: boolean; error: any };

  const cardData = [
    {
      title: 'Production',
      value: cropData?.latest_production || 'Loading...',
      icon: <TrendingUp className="h-5 w-5 text-farmer" />,
      trend: {
        value: cropData?.production_change || 0,
        isPositive: (cropData?.production_change || 0) > 0
      }
    },
    {
      title: 'Average Yield',
      value: cropData?.average_yield || 'Loading...',
      icon: <LineChart className="h-5 w-5 text-farmer" />,
      trend: {
        value: cropData?.yield_change || 0,
        isPositive: (cropData?.yield_change || 0) > 0
      }
    },
    {
      title: 'Market Price',
      value: cropData?.current_price || 'N/A',
      icon: <BarChart3 className="h-5 w-5 text-farmer" />
    },
    {
      title: 'Trade Volume',
      value: cropData?.trade_volume || 'Loading...',
      icon: <Calendar className="h-5 w-5 text-farmer" />
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-supply-50">
      <DashboardSidebar
        role="farmer"
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div className="flex-1 overflow-y-auto">
        <DashboardHeader
          title={`FAOSTAT Agricultural Dashboard - ${cropData?.country || ''}`}
          subtitle={`${availableCrops?.[selectedCrop] || 'Crop'} Data from ${yearRange.start} to ${yearRange.end}`}
        />

        {/* Selection Controls */}
        <div className="flex flex-wrap items-center gap-4 p-4">
          <Select
            value={selectedCrop}
            onValueChange={setSelectedCrop}
            disabled={cropsLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select crop" />
            </SelectTrigger>
            <SelectContent>
              {availableCrops && Object.entries(availableCrops).map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedCountry}
            onValueChange={setSelectedCountry}
            disabled={countriesLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {availableCountries && Object.entries(availableCountries).map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setYearRange(prev => ({ ...prev, start: prev.start - 1 }))}
              disabled={yearRange.start <= 2000}
            >
              - Year
            </Button>
            <span className="text-sm text-gray-500">
              {yearRange.start} - {yearRange.end}
            </span>
            <Button
              variant="outline"
              onClick={() => setYearRange(prev => ({ ...prev, start: prev.start + 1 }))}
              disabled={yearRange.start >= yearRange.end - 1}
            >
              + Year
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {dataError && (
          <div className="p-4 m-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>Error fetching data: {dataError.data?.error || 'Unknown error'}</p>
            <p className="text-sm">Try selecting different parameters or check your connection.</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          {cardData.map((card, index) => (
            <DataCard key={index} {...card} />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
          <Card>
            <CardHeader>
              <CardTitle>Production Trends</CardTitle>
              <CardDescription>Historical production data from FAOSTAT</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {dataLoading ? (
                <div className="flex items-center justify-center h-full">Loading...</div>
              ) : dataError ? (
                <div className="flex items-center justify-center h-full text-red-500">Error loading chart data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={cropData?.production_trend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} ${cropData?.production_trend?.[0]?.unit || 'tons'}`, 'Production']} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Production"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yield Analysis</CardTitle>
              <CardDescription>Historical yield data from FAOSTAT</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {dataLoading ? (
                <div className="flex items-center justify-center h-full">Loading...</div>
              ) : dataError ? (
                <div className="flex items-center justify-center h-full text-red-500">Error loading chart data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={cropData?.yield_trend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} ${cropData?.yield_trend?.[0]?.unit || 'tons/ha'}`, 'Yield']} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Yield"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
