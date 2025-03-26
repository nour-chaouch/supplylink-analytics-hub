import React from 'react';
import { ChartBar, Users, Globe, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: <ChartBar className="w-6 h-6" />,
    title: "Real-time Analytics",
    description: "Monitor and analyze your supply chain data in real-time, enabling quick decision-making and proactive problem-solving."
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Stakeholder Collaboration",
    description: "Connect all stakeholders in your supply chain ecosystem through a unified platform, enhancing communication and coordination."
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Global Visibility",
    description: "Gain complete visibility into your supply chain operations across different geographical locations and time zones."
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Predictive Insights",
    description: "Leverage advanced analytics and machine learning to predict trends and optimize your supply chain performance."
  }
];

const AboutSection = () => {
  return (
    <section 
      className="min-h-screen relative overflow-hidden bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: 'url("/img/agrtech.jpg")',
      }}
    >
      {/* Overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/80"></div>

      <div className="relative z-10 container mx-auto px-4 py-24">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
            Transforming Supply Chain Management Through{' '}
            <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-primary">
              Data Intelligence
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600">
            Our platform empowers businesses to make data-driven decisions by providing comprehensive analytics
            and real-time insights into their supply chain operations.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 
                        hover:bg-white/20 hover:border-primary/30 transition-all duration-300 
                        hover:shadow-lg hover:shadow-primary/20"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center 
                              text-primary group-hover:scale-110 group-hover:bg-primary/30 transition-transform duration-300">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "99.9%", label: "Uptime" },
            { value: "24/7", label: "Monitoring" },
            { value: "150+", label: "Active Users" },
            { value: "50+", label: "Countries" }
          ].map((stat, index) => (
            <div
              key={index}
              className="group p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 
                        hover:bg-white/10 hover:border-primary/30 transition-all duration-300
                        hover:transform hover:-translate-y-1"
            >
              <div className="text-2xl md:text-3xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                {stat.value}
              </div>
              <div className="text-gray-600 group-hover:text-gray-700 transition-colors">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
