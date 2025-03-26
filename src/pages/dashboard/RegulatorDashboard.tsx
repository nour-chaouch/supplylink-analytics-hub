import React, { useState } from 'react';
import { ShieldCheck, File, AlertTriangle, FileText } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import DataCard from '@/components/DataCard';

const RegulatorDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const cardData = [
    { title: 'Compliance Rate', value: '94%', icon: <ShieldCheck className="h-5 w-5 text-regulator" />, trend: { value: 2.2, isPositive: true } },
    { title: 'Pending Approvals', value: '7', icon: <File className="h-5 w-5 text-regulator" />, trend: { value: 1.8, isPositive: false } },
    { title: 'Safety Violations', value: '2', icon: <AlertTriangle className="h-5 w-5 text-regulator" />, trend: { value: 5.4, isPositive: false } },
    { title: 'Policy Updates', value: '3 New', icon: <FileText className="h-5 w-5 text-regulator" /> }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-supply-50">
      <DashboardSidebar 
        role="regulator"
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div className="flex-1 overflow-y-auto">
        <DashboardHeader 
          title="Regulator Dashboard"
          subtitle="Compliance monitoring and policy insights"
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

export default RegulatorDashboard;
