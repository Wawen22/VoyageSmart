import { useState, useEffect } from 'react';

type AnimationType = 
  | 'fade-in'
  | 'slide-in-right'
  | 'slide-in-left'
  | 'slide-in-bottom'
  | 'slide-in-top'
  | 'scale-in'
  | 'flip-in'
  | 'float'
  | 'pulse-once'
  | 'bounce-once'
  | 'shake'
  | 'attention';

interface UseAnimationProps {
  type: AnimationType;
  duration?: number;
  delay?: number;
  triggerOnMount?: boolean;
  triggerOnView?: boolean;
  threshold?: number;
}

export function useAnimation({
  type,
  duration = 300,
  delay = 0,
  triggerOnMount = true,
  triggerOnView = false,
  threshold = 0.1,
}: UseAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (triggerOnMount && !triggerOnView) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [delay, triggerOnMount, triggerOnView]);

  useEffect(() => {
    if (!triggerOnView || !ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, threshold, triggerOnView]);

  const getAnimationClass = () => {
    if (!isVisible) return 'opacity-0';
    
    return `animate-${type}`;
  };

  const style = {
    animationDuration: `${duration}ms`,
    animationDelay: `${delay}ms`,
  };

  return {
    ref: setRef,
    style,
    className: getAnimationClass(),
    isVisible,
  };
}

export default useAnimation;
