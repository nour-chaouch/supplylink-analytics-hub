
import React from 'react';
import { Database, BarChart, Users, Shield, Server, Network } from 'lucide-react';

const features = [
  {
    icon: <Database className="h-10 w-10 text-primary" />,
    title: 'Centralized Data Repository',
    description: 'Unify your supply chain data from multiple sources into a single, secure, and accessible platform.'
  },
  {
    icon: <BarChart className="h-10 w-10 text-primary" />,
    title: 'Advanced Analytics',
    description: 'Leverage sophisticated data analysis tools to derive actionable insights and optimize decision-making.'
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: 'Role-Based Dashboards',
    description: 'Custom interfaces for each stakeholder, providing relevant information and controls specific to their role.'
  },
  {
    icon: <Shield className="h-10 w-10 text-primary" />,
    title: 'Secure Authentication',
    description: 'Enterprise-grade security with role-based access control to protect sensitive supply chain data.'
  },
  {
    icon: <Server className="h-10 w-10 text-primary" />,
    title: 'Real-time Data Processing',
    description: 'Process and visualize supply chain data in real-time, enabling immediate response to changing conditions.'
  },
  {
    icon: <Network className="h-10 w-10 text-primary" />,
    title: 'Seamless Integration',
    description: 'Connect with external data sources, IoT devices, and third-party systems through robust APIs.'
  }
];

const FeatureSection = () => {
  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            A comprehensive platform for modern supply chains
          </h2>
          <p className="text-lg text-supply-600 text-balance">
            Our observatory integrates cutting-edge technologies to provide a complete view of your supply chain operations.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="glass-card p-6 flex flex-col items-start"
            >
              <div className="p-3 rounded-lg bg-primary/10 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-supply-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-bl-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-blue-100/50 rounded-tr-[100px] -z-10"></div>
    </section>
  );
};

export default FeatureSection;
