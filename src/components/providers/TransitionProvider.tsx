'use client';

import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

interface TransitionProviderProps {
  children: ReactNode;
}

function TransitionProvider({ children }: TransitionProviderProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('fadeIn');
  const [prevPathname, setPrevPathname] = useState(pathname);
  const isClient = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  // Gestione dell'idratazione
  useEffect(() => {
    isClient.current = true;
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Esegui solo lato client e dopo il montaggio iniziale
    if (!isClient.current || !isMounted) return;

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
    } else {
      // Aggiorna i children quando cambiano ma il pathname rimane lo stesso
      setDisplayChildren(children);
    }
  }, [pathname, children, prevPathname, isMounted]);

  // Durante l'idratazione iniziale, renderizza direttamente i children senza animazioni
  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <div
      suppressHydrationWarning
      className={`transition-opacity duration-300 ease-in-out ${
        transitionStage === 'fadeOut' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {displayChildren}
    </div>
  );
}

// Esporta una versione che viene caricata solo lato client
export default dynamic(() => Promise.resolve(TransitionProvider), {
  ssr: false
});
