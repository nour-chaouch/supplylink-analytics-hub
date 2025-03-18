
import React from 'react';
import { Link } from 'react-router-dom';
import { Warehouse, ShoppingCart, Truck, LineChart, FileText, ArrowRight } from 'lucide-react';

const roles = [
  {
    icon: <Warehouse className="h-6 w-6" />,
    title: 'Farmers',
    description: 'Track crop conditions, yield predictions, and receive alerts for potential risks.',
    color: 'farmer',
    link: '/dashboard/farmer'
  },
  {
    icon: <ShoppingCart className="h-6 w-6" />,
    title: 'Retailers',
    description: 'Analyze inventory levels, pricing trends, and match supply with demand.',
    color: 'retailer',
    link: '/dashboard/retailer'
  },
  {
    icon: <Truck className="h-6 w-6" />,
    title: 'Transporters',
    description: 'Optimize delivery routes and track shipment status in real-time.',
    color: 'transporter',
    link: '/dashboard/transporter'
  },
  {
    icon: <LineChart className="h-6 w-6" />,
    title: 'Supply Chain Managers',
    description: 'Access trend analysis, detect bottlenecks, and assess risks.',
    color: 'manager',
    link: '/dashboard/manager'
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: 'Regulators',
    description: 'Monitor compliance with food safety, sustainability, and trade regulations.',
    color: 'regulator',
    link: '/dashboard/regulator'
  }
];

const RoleSection = () => {
  return (
    <section id="dashboards" className="py-24 bg-supply-50 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Tailored solutions for every supply chain stakeholder
          </h2>
          <p className="text-lg text-supply-600 text-balance">
            Each role in the supply chain ecosystem has unique needs and priorities. Our platform provides customized dashboards for every stakeholder.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {roles.map((role, index) => (
            <div 
              key={index}
              className={`role-card role-card-${role.color} bg-white`}
            >
              <div className={`p-2 rounded-full bg-${role.color}/10 text-${role.color} mb-4 inline-flex`}>
                {role.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{role.title}</h3>
              <p className="text-supply-600 mb-4">{role.description}</p>
              <Link 
                to={role.link}
                className={`inline-flex items-center text-sm font-medium text-${role.color} hover:underline`}
              >
                View Dashboard
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 -z-10 bg-grid-pattern"></div>
    </section>
  );
};

export default RoleSection;
