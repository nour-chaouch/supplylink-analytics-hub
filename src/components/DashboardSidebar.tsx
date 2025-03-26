import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BarChart2,
  Map,
  Calendar,
  Settings,
  AlertTriangle,
  Bell,
  FileText,
  Truck,
  ShoppingCart,
  Warehouse,
  FileBarChart,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { logout } from '@/store/slices/authSlice';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  role: 'farmer' | 'retailer' | 'transporter' | 'manager' | 'regulator';
}

const roleConfig = {
  farmer: {
    color: 'bg-farmer text-white',
    icon: <Warehouse className="h-5 w-5" />,
    label: 'Farmer Dashboard',
    items: [
      { name: 'Overview', href: '/dashboard/farmer', icon: <LayoutDashboard className="h-5 w-5" /> },
      { name: 'Crop Analytics', href: '/dashboard/farmer/analytics', icon: <BarChart2 className="h-5 w-5" /> },
      { name: 'Farm Map', href: '/dashboard/farmer/map', icon: <Map className="h-5 w-5" /> },
      { name: 'Forecasts', href: '/dashboard/farmer/forecasts', icon: <Calendar className="h-5 w-5" /> },
      { name: 'Alerts', href: '/dashboard/farmer/alerts', icon: <AlertTriangle className="h-5 w-5" /> },
    ]
  },
  retailer: {
    color: 'bg-retailer text-white',
    icon: <ShoppingCart className="h-5 w-5" />,
    label: 'Retailer Dashboard',
    items: [
      { name: 'Overview', href: '/dashboard/retailer', icon: <LayoutDashboard className="h-5 w-5" /> },
      { name: 'Inventory', href: '/dashboard/retailer/inventory', icon: <BarChart2 className="h-5 w-5" /> },
      { name: 'Demand Forecast', href: '/dashboard/retailer/forecast', icon: <Calendar className="h-5 w-5" /> },
      { name: 'Orders', href: '/dashboard/retailer/orders', icon: <FileText className="h-5 w-5" /> },
      { name: 'Alerts', href: '/dashboard/retailer/alerts', icon: <AlertTriangle className="h-5 w-5" /> },
    ]
  },
  transporter: {
    color: 'bg-transporter text-white',
    icon: <Truck className="h-5 w-5" />,
    label: 'Transporter Dashboard',
    items: [
      { name: 'Overview', href: '/dashboard/transporter', icon: <LayoutDashboard className="h-5 w-5" /> },
      { name: 'Routes', href: '/dashboard/transporter/routes', icon: <Map className="h-5 w-5" /> },
      { name: 'Shipments', href: '/dashboard/transporter/shipments', icon: <Truck className="h-5 w-5" /> },
      { name: 'Schedule', href: '/dashboard/transporter/schedule', icon: <Calendar className="h-5 w-5" /> },
      { name: 'Alerts', href: '/dashboard/transporter/alerts', icon: <AlertTriangle className="h-5 w-5" /> },
    ]
  },
  manager: {
    color: 'bg-manager text-white',
    icon: <FileBarChart className="h-5 w-5" />,
    label: 'Manager Dashboard',
    items: [
      { name: 'Overview', href: '/dashboard/manager', icon: <LayoutDashboard className="h-5 w-5" /> },
      { name: 'Performance', href: '/dashboard/manager/performance', icon: <BarChart2 className="h-5 w-5" /> },
      { name: 'Reports', href: '/dashboard/manager/reports', icon: <FileText className="h-5 w-5" /> },
      { name: 'Forecasts', href: '/dashboard/manager/forecasts', icon: <Calendar className="h-5 w-5" /> },
      { name: 'Risks', href: '/dashboard/manager/risks', icon: <AlertTriangle className="h-5 w-5" /> },
    ]
  },
  regulator: {
    color: 'bg-regulator text-white',
    icon: <ShieldCheck className="h-5 w-5" />,
    label: 'Regulator Dashboard',
    items: [
      { name: 'Overview', href: '/dashboard/regulator', icon: <LayoutDashboard className="h-5 w-5" /> },
      { name: 'Compliance', href: '/dashboard/regulator/compliance', icon: <ShieldCheck className="h-5 w-5" /> },
      { name: 'Reports', href: '/dashboard/regulator/reports', icon: <FileText className="h-5 w-5" /> },
      { name: 'Policies', href: '/dashboard/regulator/policies', icon: <FileText className="h-5 w-5" /> },
      { name: 'Alerts', href: '/dashboard/regulator/alerts', icon: <AlertTriangle className="h-5 w-5" /> },
    ]
  }
};

const DashboardSidebar = ({ collapsed, setCollapsed, role }: SidebarProps) => {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const config = roleConfig[role];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className={cn(
      "h-screen sticky top-0 flex flex-col border-r border-supply-200 bg-white transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header with toggle */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-supply-200">
        <div className="flex items-center">
          <div className={cn(
            "flex items-center justify-center rounded-lg p-1.5",
            config.color
          )}>
            {config.icon}
          </div>
          {!collapsed && (
            <span className="ml-2 font-semibold text-supply-900">{config.label}</span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-supply-500 hover:bg-supply-100"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation links */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {config.items.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive 
                    ? `bg-primary/10 text-primary font-medium` 
                    : "text-supply-600 hover:bg-supply-100 hover:text-supply-900"
                )}
              >
                <span className="mr-3 flex-shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom section with notifications and settings */}
      <div className="border-t border-supply-200 p-3">
        <div className="space-y-1">
          <Link
            to="/notifications"
            className="flex items-center rounded-lg px-3 py-2 text-sm text-supply-600 hover:bg-supply-100 hover:text-supply-900 transition-colors"
          >
            <Bell className="mr-3 h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Notifications</span>}
          </Link>
          <Link
            to="/profile?tab=settings"
            className="flex items-center rounded-lg px-3 py-2 text-sm text-supply-600 hover:bg-supply-100 hover:text-supply-900 transition-colors"
          >
            <Settings className="mr-3 h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>
          <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
            <AlertDialogTrigger asChild>
              <button
                className="flex items-center rounded-lg px-3 py-2 text-sm text-supply-600 hover:bg-supply-100 hover:text-supply-900 transition-colors"
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>Log out</span>}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will need to sign in again to access your dashboard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowLogoutDialog(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>Log out</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
