import React, { useState } from 'react';
import { Truck, TrendingUp, BarChart3, Map } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import DataCard from '@/components/DataCard';

const TransporterDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const cardData = [
    { title: 'Active Shipments', value: '24', icon: <Truck className="h-5 w-5 text-transporter" />, trend: { value: 2.8, isPositive: true } },
    { title: 'On-Time Delivery', value: '93%', icon: <TrendingUp className="h-5 w-5 text-transporter" />, trend: { value: 1.2, isPositive: true } },
    { title: 'Fleet Utilization', value: '86%', icon: <BarChart3 className="h-5 w-5 text-transporter" />, trend: { value: 3.7, isPositive: true } },
    { title: 'Route Efficiency', value: 'Optimal', icon: <Map className="h-5 w-5 text-transporter" /> }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-supply-50">
      <DashboardSidebar 
        role="transporter"
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div className="flex-1 overflow-y-auto">
        <DashboardHeader 
          title="Transporter Dashboard"
          subtitle="Route optimization and logistics"
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

export default TransporterDashboard;
