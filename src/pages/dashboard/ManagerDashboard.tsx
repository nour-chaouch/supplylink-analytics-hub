import React, { useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, User } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import DataCard from '@/components/DataCard';

const ManagerDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const cardData = [
    { title: 'Supply Chain Score', value: '87/100', icon: <BarChart3 className="h-5 w-5 text-manager" />, trend: { value: 4.1, isPositive: true } },
    { title: 'Cost Efficiency', value: '76%', icon: <TrendingUp className="h-5 w-5 text-manager" />, trend: { value: 2.3, isPositive: true } },
    { title: 'Risk Index', value: 'Low', icon: <AlertTriangle className="h-5 w-5 text-manager" /> },
    { title: 'Total Partners', value: '48', icon: <User className="h-5 w-5 text-manager" />, trend: { value: 1.5, isPositive: true } }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-supply-50">
      <DashboardSidebar 
        role="manager"
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div className="flex-1 overflow-y-auto">
        <DashboardHeader 
          title="Supply Chain Manager Dashboard"
          subtitle="Performance analytics and risk assessment"
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

export default ManagerDashboard;
