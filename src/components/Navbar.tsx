import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();
  const isDashboard = location.pathname.includes('/dashboard');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { 
      name: 'Dashboards', 
      href: '#dashboards',
      children: [
        { name: 'Farmer', href: '/dashboard/farmer' },
        { name: 'Retailer', href: '/dashboard/retailer' },
        { name: 'Transporter', href: '/dashboard/transporter' },
        { name: 'Manager', href: '/dashboard/manager' },
        { name: 'Regulator', href: '/dashboard/regulator' },
      ]
    },
    { name: 'Contact', href: '#contact' },
  ];

  if (isDashboard) {
    return null; // Don't show navbar in dashboard
  }

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4",
        isScrolled 
          ? "bg-white/80 backdrop-blur-md shadow-sm" 
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-2"
          >
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              SupplyLink
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navItems.map((item) => 
              item.children ? (
                <div key={item.name} className="relative group">
                  <button className="flex items-center text-sm font-medium text-supply-700 hover:text-primary transition-colors">
                    {item.name}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  <div className="absolute left-0 mt-2 w-48 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                    <div className="py-1 rounded-md bg-white">
                      {item.children.map(child => (
                        <Link
                          key={child.name}
                          to={child.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-sm font-medium text-supply-700 hover:text-primary transition-colors"
                >
                  {item.name}
                </Link>
              )
            )}
          </div>

          <div className="hidden md:flex md:items-center md:space-x-4">
            {!user && (
              <Link 
                to="/login" 
                className="text-sm font-medium text-supply-700 hover:text-primary transition-colors"
              >
                Log in
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="inline-flex md:hidden items-center justify-center p-2 rounded-md text-supply-500 hover:text-supply-900 hover:bg-supply-100 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-supply-100 animate-fade-in">
          <div className="pt-2 pb-3 space-y-1 px-4">
            {navItems.map((item) => 
              item.children ? (
                <div key={item.name} className="py-2">
                  <div className="flex items-center text-base font-medium text-supply-700">
                    {item.name}
                  </div>
                  <div className="mt-2 pl-4 border-l-2 border-supply-100 space-y-2">
                    {item.children.map(child => (
                      <Link
                        key={child.name}
                        to={child.href}
                        className="block text-sm text-supply-600 hover:text-primary"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block py-2 text-base font-medium text-supply-700 hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              )
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-supply-100">
            <div className="flex items-center px-4 space-x-3">
              {!user && (
                <Link 
                  to="/login" 
                  className="block w-full text-center py-2 text-base font-medium text-supply-700 hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Log in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
