
import React from 'react';
import { cn } from '@/lib/utils';
import { InfoIcon } from 'lucide-react';

interface DataCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  children?: React.ReactNode;
}

const DataCard = ({
  title,
  value,
  icon,
  description,
  trend,
  className,
  children,
}: DataCardProps) => {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-supply-500">{title}</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold text-supply-900">{value}</p>
            {trend && (
              <span className={cn(
                "ml-2 text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs text-supply-500 flex items-center">
              <InfoIcon className="mr-1 h-3 w-3" />
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-full p-2 bg-primary/10">
            {icon}
          </div>
        )}
      </div>
      
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default DataCard;
