'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface TransitionProviderProps {
  children: ReactNode;
}

export default function TransitionProvider({ children }: TransitionProviderProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('fadeIn');
  const [prevPathname, setPrevPathname] = useState(pathname);

  useEffect(() => {
    if (pathname !== prevPathname) {
      // Start exit animation
      setTransitionStage('fadeOut');
      
      // After exit animation completes, update children and start entry animation
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('fadeIn');
        setPrevPathname(pathname);
      }, 300); // Match this with your CSS transition duration
      
      return () => clearTimeout(timeout);
    }
  }, [pathname, children, prevPathname]);

  return (
    <div
      className={`transition-opacity duration-300 ease-in-out ${
        transitionStage === 'fadeOut' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {displayChildren}
    </div>
  );
}
