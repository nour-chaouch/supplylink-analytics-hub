
import React from 'react';
import { useComplianceData } from '@/hooks/useDashboardData';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from 'recharts';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const RegulatorCompliance = () => {
  const { data, isLoading, error } = useComplianceData();
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Compliance Overview</h2>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Sector Compliance</h2>
          <Skeleton className="h-[250px] w-full" />
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-red-800 font-medium">Error loading compliance data</h3>
        </div>
        <p className="mt-2 text-red-700">{error.message}</p>
        <p className="mt-2 text-sm text-red-600">Please try again later or contact support if the issue persists.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Compliance Overview</h2>
          <div className="flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full">
            <ShieldCheck className="h-4 w-4 mr-2" />
            <span className="font-medium">{data.complianceRate}% Overall Compliance</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-4 text-supply-700">Compliance by Sector</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.sectors}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="rate"
                  nameKey="name"
                  label={({ name, rate }) => `${name}: ${rate}%`}
                >
                  {data.sectors.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4 text-supply-700">Safety Violations by Sector</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.sectors}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="violations" fill="#ff7875" name="Violations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.sectors.map((sector: any, index: number) => (
          <Card key={index} className="p-4">
            <h3 className="font-medium text-supply-800">{sector.name}</h3>
            <div className="mt-2 flex justify-between items-center">
              <div className="text-2xl font-semibold">{sector.rate}%</div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                sector.violations > 2 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {sector.violations} Violations
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RegulatorCompliance;
