import React, { useState, useEffect } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  location?: string;
  className?: string;
  transitionType?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale';
  duration?: number;
}

export default function PageTransition({
  children,
  location,
  className = '',
  transitionType = 'fade',
  duration = 300,
}: PageTransitionProps) {
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('fadeIn');

  useEffect(() => {
    if (children !== displayChildren) {
      setTransitionStage('fadeOut');

      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('fadeIn');
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [children, displayChildren, duration]);

  useEffect(() => {
    if (location) {
      setTransitionStage('fadeOut');

      const timeout = setTimeout(() => {
        setTransitionStage('fadeIn');
      }, 50);

      return () => clearTimeout(timeout);
    }
  }, [location]);

  const getTransitionClass = () => {
    if (transitionStage === 'fadeOut') {
      switch (transitionType) {
        case 'fade':
          return 'opacity-0';
        case 'slide-up':
          return 'opacity-0 translate-y-4';
        case 'slide-down':
          return 'opacity-0 -translate-y-4';
        case 'slide-left':
          return 'opacity-0 translate-x-4';
        case 'slide-right':
          return 'opacity-0 -translate-x-4';
        case 'scale':
          return 'opacity-0 scale-95';
        default:
          return 'opacity-0';
      }
    }

    // Classes for fade in
    switch (transitionType) {
      case 'fade':
        return 'animate-fade-in';
      case 'slide-up':
        return 'animate-slide-in-bottom';
      case 'slide-down':
        return 'animate-slide-in-top';
      case 'slide-left':
        return 'animate-slide-in-right';
      case 'slide-right':
        return 'animate-slide-in-left';
      case 'scale':
        return 'animate-scale-in';
      default:
        return 'animate-fade-in';
    }
  };

  return (
    <div
      className={`transition-all ease-in-out ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      <div
        className={`transition-all ease-in-out ${getTransitionClass()}`}
        style={{ transitionDuration: `${duration}ms` }}
      >
        {displayChildren}
      </div>
    </div>
  );
}
