'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Hook for managing reduced motion preferences
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Hook for intersection observer with performance optimizations
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setElement = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);
        
        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasIntersected, options]);

  return { isIntersecting, hasIntersected, setElement };
}

// Hook for debouncing values to improve performance
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttling function calls
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

// Hook for managing component visibility with performance optimizations
export function useVisibility(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold }
    );

    const element = elementRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold]);

  return { isVisible, elementRef };
}

// Hook for optimizing animations based on device capabilities
export function useAnimationOptimization() {
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Check device capabilities
    const isLowEndDevice = () => {
      // Check for low-end device indicators
      const connection = (navigator as any).connection;
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      
      if (connection) {
        const isSlowConnection = connection.effectiveType === 'slow-2g' || 
                               connection.effectiveType === '2g' ||
                               connection.effectiveType === '3g';
        if (isSlowConnection) return true;
      }

      // Low core count might indicate low-end device
      if (hardwareConcurrency <= 2) return true;

      // Check memory if available
      const memory = (performance as any).memory;
      if (memory && memory.usedJSHeapSize > memory.totalJSHeapSize * 0.8) {
        return true;
      }

      return false;
    };

    setShouldAnimate(!prefersReducedMotion && !isLowEndDevice());
  }, [prefersReducedMotion]);

  return {
    shouldAnimate,
    prefersReducedMotion,
    getAnimationClass: (animationClass: string) => 
      shouldAnimate ? animationClass : '',
    getTransitionDuration: (duration: string) => 
      shouldAnimate ? duration : '0ms'
  };
}

// Hook for managing loading states with performance considerations
export function useOptimizedLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setLoadingStartTime(Date.now());
  }, []);

  const stopLoading = useCallback(() => {
    const now = Date.now();
    const minLoadingTime = 300; // Minimum loading time for better UX
    
    if (loadingStartTime && now - loadingStartTime < minLoadingTime) {
      setTimeout(() => {
        setIsLoading(false);
        setLoadingStartTime(null);
      }, minLoadingTime - (now - loadingStartTime));
    } else {
      setIsLoading(false);
      setLoadingStartTime(null);
    }
  }, [loadingStartTime]);

  return {
    isLoading,
    startLoading,
    stopLoading,
    loadingDuration: loadingStartTime ? Date.now() - loadingStartTime : 0
  };
}
