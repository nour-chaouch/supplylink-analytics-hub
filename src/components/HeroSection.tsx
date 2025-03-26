import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const HeroSection = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      
      const { clientX, clientY } = e;
      const rect = heroRef.current.getBoundingClientRect();
      
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;
      
      heroRef.current.style.setProperty('--mouse-x', `${x}`);
      heroRef.current.style.setProperty('--mouse-y', `${y}`);
    };
    
    const heroElement = heroRef.current;
    if (heroElement) {
      heroElement.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (heroElement) {
        heroElement.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  const handleLearnMoreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div 
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid-pattern"
      style={{ 
        '--mouse-x': '0.5', 
        '--mouse-y': '0.5',
        backgroundImage: 'url("/img/agr.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } as React.CSSProperties}
    >
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-background/50"></div>
      
      {/* Gradient background */}
      <div 
        className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent opacity-70"
        style={{
          background: `radial-gradient(circle at calc(var(--mouse-x) * 100%) calc(var(--mouse-y) * 100%), rgba(59, 130, 246, 0.15), transparent 10%)`
        }}
      ></div>
      
      {/* Content container */}
      <div className="container px-4 py-32 md:py-40 mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-primary/10 text-primary mb-6 animate-fade-in">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Supply Chain Data Observatory
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight md:leading-tight lg:leading-tight mb-6 animate-slide-up text-balance">
            <span className="text-gradient">Revolutionize</span> your supply chain with real-time analytics
          </h1>
          
          <p className="text-lg md:text-xl text-supply-600 max-w-2xl mx-auto mb-8 animate-slide-up animation-delay-150 text-balance">
            A comprehensive data platform that connects stakeholders across the supply chain ecosystem, providing actionable insights and enhancing operational efficiency.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-slide-up animation-delay-300">
            <a
              href="#about"
              onClick={handleLearnMoreClick}
              className="inline-flex h-12 items-center justify-center rounded-md border border-supply-200 bg-white px-6 text-sm font-medium text-supply-900 shadow-sm transition-all duration-300 hover:bg-supply-50 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-1/4 left-10 w-16 h-16 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
        <div className="absolute top-1/3 right-10 w-24 h-24 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-1/3 right-1/4 w-16 h-16 bg-orange-100 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-6000"></div>
      </div>
    </div>
  );
};

export default HeroSection;
