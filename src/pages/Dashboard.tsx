
import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { LineChart, BarChart3, TrendingUp, User, Package, Map, Calendar, ArrowUpRight } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import DataCard from '@/components/DataCard';

const Dashboard = () => {
  const { role = 'farmer' } = useParams<{ role: 'farmer' | 'retailer' | 'transporter' | 'manager' | 'regulator' }>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Validate role parameter
  const validRoles = ['farmer', 'retailer', 'transporter', 'manager', 'regulator'];
  if (!validRoles.includes(role)) {
    return <Navigate to="/dashboard/farmer" replace />;
  }
  
  // Role-specific dashboard configurations
  const dashboardConfig = {
    farmer: {
      title: 'Farmer Dashboard',
      subtitle: 'Real-time insights for your farm operations',
      cardData: [
        { title: 'Crop Health Index', value: '87%', icon: <TrendingUp className="h-5 w-5 text-farmer" />, trend: { value: 3.2, isPositive: true } },
        { title: 'Soil Moisture', value: '42%', icon: <LineChart className="h-5 w-5 text-farmer" />, trend: { value: 1.8, isPositive: false } },
        { title: 'Harvest Forecast', value: '1,240 tons', icon: <BarChart3 className="h-5 w-5 text-farmer" /> },
        { title: 'Weather Alert', value: 'Low Risk', icon: <Calendar className="h-5 w-5 text-farmer" /> }
      ]
    },
    retailer: {
      title: 'Retailer Dashboard',
      subtitle: 'Inventory and demand management',
      cardData: [
        { title: 'Current Inventory', value: '3,420 units', icon: <Package className="h-5 w-5 text-retailer" />, trend: { value: 5.4, isPositive: true } },
        { title: 'Sales Today', value: '$12,840', icon: <TrendingUp className="h-5 w-5 text-retailer" />, trend: { value: 2.1, isPositive: true } },
        { title: 'Out of Stock Items', value: '12', icon: <BarChart3 className="h-5 w-5 text-retailer" />, trend: { value: 4.3, isPositive: false } },
        { title: 'Demand Forecast', value: 'Increasing', icon: <Calendar className="h-5 w-5 text-retailer" /> }
      ]
    },
    transporter: {
      title: 'Transporter Dashboard',
      subtitle: 'Route optimization and logistics',
      cardData: [
        { title: 'Active Shipments', value: '24', icon: <Truck className="h-5 w-5 text-transporter" />, trend: { value: 2.8, isPositive: true } },
        { title: 'On-Time Delivery', value: '93%', icon: <TrendingUp className="h-5 w-5 text-transporter" />, trend: { value: 1.2, isPositive: true } },
        { title: 'Fleet Utilization', value: '86%', icon: <BarChart3 className="h-5 w-5 text-transporter" />, trend: { value: 3.7, isPositive: true } },
        { title: 'Route Efficiency', value: 'Optimal', icon: <Map className="h-5 w-5 text-transporter" /> }
      ]
    },
    manager: {
      title: 'Supply Chain Manager Dashboard',
      subtitle: 'Performance analytics and risk assessment',
      cardData: [
        { title: 'Supply Chain Score', value: '87/100', icon: <BarChart3 className="h-5 w-5 text-manager" />, trend: { value: 4.1, isPositive: true } },
        { title: 'Cost Efficiency', value: '76%', icon: <TrendingUp className="h-5 w-5 text-manager" />, trend: { value: 2.3, isPositive: true } },
        { title: 'Risk Index', value: 'Low', icon: <AlertTriangle className="h-5 w-5 text-manager" /> },
        { title: 'Total Partners', value: '48', icon: <User className="h-5 w-5 text-manager" />, trend: { value: 1.5, isPositive: true } }
      ]
    },
    regulator: {
      title: 'Regulator Dashboard',
      subtitle: 'Compliance monitoring and policy insights',
      cardData: [
        { title: 'Compliance Rate', value: '94%', icon: <ShieldCheck className="h-5 w-5 text-regulator" />, trend: { value: 2.2, isPositive: true } },
        { title: 'Pending Approvals', value: '7', icon: <File className="h-5 w-5 text-regulator" />, trend: { value: 1.8, isPositive: false } },
        { title: 'Safety Violations', value: '2', icon: <AlertTriangle className="h-5 w-5 text-regulator" />, trend: { value: 5.4, isPositive: false } },
        { title: 'Policy Updates', value: '3 New', icon: <FileText className="h-5 w-5 text-regulator" /> }
      ]
    }
  };
  
  const config = dashboardConfig[role as keyof typeof dashboardConfig];

  // Import required icons based on role
  let Truck, AlertTriangle, ShieldCheck, File, FileText;
  
  // Import icons only when needed, based on the current role
  if (role === 'transporter') {
    // We use dynamic imports to avoid circular dependencies
    import('lucide-react').then(module => {
      Truck = module.Truck;
    });
  }
  
  if (role === 'manager' || role === 'regulator') {
    import('lucide-react').then(module => {
      AlertTriangle = module.AlertTriangle;
      if (role === 'regulator') {
        ShieldCheck = module.ShieldCheck;
        File = module.File;
        FileText = module.FileText;
      }
    });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-supply-50">
      <DashboardSidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        role={role as any}
      />
      
      <div className="flex-1 overflow-y-auto">
        <DashboardHeader 
          title={config.title} 
          subtitle={config.subtitle}
        />
        
        <main className="p-6">
          {/* Main content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {config.cardData.map((card, index) => (
              <DataCard
                key={index}
                title={card.title}
                value={card.value}
                icon={card.icon}
                trend={card.trend}
              />
            ))}
          </div>
          
          {/* Placeholder for data visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
                <span>Performance Overview</span>
                <button className="text-xs text-primary font-medium flex items-center">
                  View Details
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </button>
              </h2>
              <div className="h-72 flex items-center justify-center bg-supply-50 rounded-lg border border-supply-100">
                <p className="text-supply-500">Performance chart will be displayed here</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
                <span>Recent Activity</span>
                <button className="text-xs text-primary font-medium flex items-center">
                  View All
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </button>
              </h2>
              <div className="h-72 flex items-center justify-center bg-supply-50 rounded-lg border border-supply-100">
                <p className="text-supply-500">Activity timeline will be displayed here</p>
              </div>
            </div>
          </div>
          
          {/* Additional data sections */}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
            <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
            <div className="h-80 flex items-center justify-center bg-supply-50 rounded-lg border border-supply-100">
              <p className="text-supply-500">Detailed metrics will be displayed here</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
