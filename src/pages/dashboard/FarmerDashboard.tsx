import React, { useState } from 'react';
import { TrendingUp, LineChart, BarChart3, Calendar } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import DataCard from '@/components/DataCard';

const FarmerDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const cardData = [
    { title: 'Crop Health Index', value: '87%', icon: <TrendingUp className="h-5 w-5 text-farmer" />, trend: { value: 3.2, isPositive: true } },
    { title: 'Soil Moisture', value: '42%', icon: <LineChart className="h-5 w-5 text-farmer" />, trend: { value: 1.8, isPositive: false } },
    { title: 'Harvest Forecast', value: '1,240 tons', icon: <BarChart3 className="h-5 w-5 text-farmer" /> },
    { title: 'Weather Alert', value: 'Low Risk', icon: <Calendar className="h-5 w-5 text-farmer" /> }
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
          title="Farmer Dashboard"
          subtitle="Real-time insights for your farm operations"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          {cardData.map((card, index) => (
            <DataCard key={index} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
