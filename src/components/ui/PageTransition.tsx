import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
  location?: string;
  className?: string;
  transitionType?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'none';
  duration?: number;
  delay?: number;
  onAnimationComplete?: () => void;
}

export default function PageTransition({
  children,
  location,
  className = '',
  transitionType = 'fade',
  duration = 300,
  delay = 0,
  onAnimationComplete,
}: PageTransitionProps) {
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('fadeIn');
  const pathname = usePathname();
  const firstRender = useRef(true);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use pathname as location if not provided
  const effectiveLocation = location || pathname;

  // Handle children changes (for nested transitions)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (children !== displayChildren && transitionType !== 'none') {
      setTransitionStage('fadeOut');

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      animationTimeoutRef.current = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('fadeIn');

        // Call onAnimationComplete after the fade in animation
        if (onAnimationComplete) {
          setTimeout(onAnimationComplete, duration);
        }
      }, duration);

      return () => {
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
      };
    } else if (transitionType === 'none') {
      setDisplayChildren(children);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }
  }, [children, displayChildren, duration, transitionType, onAnimationComplete]);

  // Handle location/pathname changes
  useEffect(() => {
    if (firstRender.current) {
      return;
    }

    if (effectiveLocation && transitionType !== 'none') {
      setTransitionStage('fadeOut');

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      animationTimeoutRef.current = setTimeout(() => {
        setTransitionStage('fadeIn');

        // Call onAnimationComplete after the fade in animation
        if (onAnimationComplete) {
          setTimeout(onAnimationComplete, duration);
        }
      }, 50);

      return () => {
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
      };
    } else if (transitionType === 'none' && onAnimationComplete) {
      onAnimationComplete();
    }
  }, [effectiveLocation, transitionType, duration, onAnimationComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const getTransitionClass = () => {
    if (transitionType === 'none') {
      return '';
    }

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

  const delayStyle = delay > 0 ? { animationDelay: `${delay}ms`, transitionDelay: `${delay}ms` } : {};

  return (
    <div
      className={`transition-all ease-in-out ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        ...delayStyle
      }}
    >
      <div
        className={`transition-all ease-in-out ${getTransitionClass()}`}
        style={{
          transitionDuration: `${duration}ms`,
          ...delayStyle
        }}
      >
        {displayChildren}
      </div>
    </div>
  );
}
