import React, { useState } from 'react';
import { Package, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import DataCard from '@/components/DataCard';

const RetailerDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const cardData = [
    { title: 'Current Inventory', value: '3,420 units', icon: <Package className="h-5 w-5 text-retailer" />, trend: { value: 5.4, isPositive: true } },
    { title: 'Sales Today', value: '$12,840', icon: <TrendingUp className="h-5 w-5 text-retailer" />, trend: { value: 2.1, isPositive: true } },
    { title: 'Out of Stock Items', value: '12', icon: <BarChart3 className="h-5 w-5 text-retailer" />, trend: { value: 4.3, isPositive: false } },
    { title: 'Demand Forecast', value: 'Increasing', icon: <Calendar className="h-5 w-5 text-retailer" /> }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-supply-50">
      <DashboardSidebar 
        role="retailer"
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div className="flex-1 overflow-y-auto">
        <DashboardHeader 
          title="Retailer Dashboard"
          subtitle="Inventory and demand management"
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

export default RetailerDashboard;
