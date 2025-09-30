'use client';

import React, { ReactNode, useRef, useEffect, useState } from 'react';

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
  initialDelay?: number;
  animationType?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale';
  duration?: number;
  threshold?: number;
  once?: boolean;
}

export default function AnimatedList({
  children,
  className = '',
  itemClassName = '',
  staggerDelay = 50,
  initialDelay = 0,
  animationType = 'fade',
  duration = 300,
  threshold = 0.1,
  once = true,
}: AnimatedListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<boolean[]>(Array(React.Children.count(children)).fill(false));
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Set up animation classes based on animation type
  const getAnimationClass = (isVisible: boolean, index: number) => {
    if (!isVisible) {
      return 'opacity-0 transform';
    }

    const baseClass = 'transition-all ease-in-out';
    const delay = `${initialDelay + index * staggerDelay}ms`;
    const style = { transitionDelay: delay, transitionDuration: `${duration}ms` };

    switch (animationType) {
      case 'fade':
        return isVisible ? baseClass : `${baseClass} opacity-0`;
      case 'slide-up':
        return isVisible ? baseClass : `${baseClass} opacity-0 translate-y-4`;
      case 'slide-down':
        return isVisible ? baseClass : `${baseClass} opacity-0 -translate-y-4`;
      case 'slide-left':
        return isVisible ? baseClass : `${baseClass} opacity-0 translate-x-4`;
      case 'slide-right':
        return isVisible ? baseClass : `${baseClass} opacity-0 -translate-x-4`;
      case 'scale':
        return isVisible ? baseClass : `${baseClass} opacity-0 scale-95`;
      default:
        return isVisible ? baseClass : `${baseClass} opacity-0`;
    }
  };

  useEffect(() => {
    // Reset visible items when children change
    setVisibleItems(Array(React.Children.count(children)).fill(false));
    
    // Initialize refs array
    itemRefs.current = itemRefs.current.slice(0, children.length);
    
    // Set up intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = itemRefs.current.findIndex((ref) => ref === entry.target);
          if (index !== -1) {
            setVisibleItems((prev) => {
              const newState = [...prev];
              newState[index] = entry.isIntersecting || newState[index];
              return newState;
            });
            
            // Unobserve if once is true and item is visible
            if (once && entry.isIntersecting) {
              observerRef.current?.unobserve(entry.target);
            }
          }
        });
      },
      { threshold }
    );

    // Observe all item refs
    itemRefs.current.forEach((ref) => {
      if (ref) {
        observerRef.current?.observe(ref);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [children, once, threshold]);

  return (
    <div className={className} ref={listRef}>
      {React.Children.map(children, (child, index) => (
        <div
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          className={`${getAnimationClass(visibleItems[index], index)} ${itemClassName}`}
          style={{
            transitionDelay: `${initialDelay + index * staggerDelay}ms`,
            transitionDuration: `${duration}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
