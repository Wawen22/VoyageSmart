'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    // Verifica se window è disponibile (client-side)
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Imposta il valore iniziale
      setMatches(media.matches);
      
      // Callback per aggiornare lo stato quando cambia il media query
      const listener = () => {
        setMatches(media.matches);
      };
      
      // Aggiungi il listener
      if (media.addEventListener) {
        media.addEventListener('change', listener);
      } else {
        // Fallback per browser più vecchi
        media.addListener(listener);
      }
      
      // Cleanup
      return () => {
        if (media.removeEventListener) {
          media.removeEventListener('change', listener);
        } else {
          // Fallback per browser più vecchi
          media.removeListener(listener);
        }
      };
    }
    
    // Valore di default per SSR
    return () => {};
  }, [query]);
  
  return matches;
}
