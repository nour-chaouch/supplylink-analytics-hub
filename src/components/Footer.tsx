
import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer id="contact" className="bg-white border-t border-supply-100">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                E-living Lab
              </span>
            </Link>
            <p className="text-supply-600 mb-4 max-w-md">
              An advanced supply chain data observatory platform connecting stakeholders and providing real-time analytics for enhanced decision-making.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-supply-400 hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="#" className="text-supply-400 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-supply-400 hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="#" className="text-supply-400 hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-supply-900 uppercase tracking-wider mb-4">
              Platform
            </h3>
            <ul className="space-y-2">
              {['Features', 'Dashboards', 'Analytics', 'API', 'Integration'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-supply-600 hover:text-primary transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-supply-900 uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              {['About', 'Blog', 'Careers', 'Press', 'Privacy Policy'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-supply-600 hover:text-primary transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-supply-100 flex flex-col md:flex-row justify-between items-center">
          <p className="text-supply-500 text-sm">
            &copy; {new Date().getFullYear()} E-living Lab. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-supply-500 hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-supply-500 hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-supply-500 hover:text-primary transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
