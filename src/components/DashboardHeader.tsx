
import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search, User } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

const DashboardHeader = ({ title, subtitle }: DashboardHeaderProps) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-supply-200 bg-white/95 backdrop-blur-sm px-4">
      <div>
        <h1 className="text-2xl font-semibold text-supply-900">{title}</h1>
        {subtitle && <p className="text-sm text-supply-500">{subtitle}</p>}
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-supply-400" />
          <input
            type="search"
            placeholder="Search..."
            className="rounded-md border border-supply-200 bg-white pl-9 pr-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        
        {/* Notifications */}
        <button className="relative rounded-full p-1.5 text-supply-500 hover:bg-supply-100 hover:text-supply-900 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        
        {/* Profile */}
        <Link
          to="/profile"
          className="flex items-center rounded-full p-1 text-supply-500 hover:bg-supply-100 hover:text-supply-900 transition-colors"
        >
          <div className="relative h-8 w-8 rounded-full bg-supply-200 flex items-center justify-center overflow-hidden">
            <User className="h-5 w-5" />
          </div>
        </Link>
      </div>
    </header>
  );
};

export default DashboardHeader;
