'use client';

import React from 'react';

export type CardSize = 'featured' | 'medium' | 'standard' | 'compact';

interface BentoGridProps {
  children: React.ReactNode;
  isTransitioning?: boolean;
}

export default function BentoGrid({ children, isTransitioning = false }: BentoGridProps) {
  return (
    <div 
      className={`bento-grid transition-opacity duration-300 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {children}
    </div>
  );
}

// Grid styles to be added to globals.css or as Tailwind plugin
export const bentoGridStyles = `
  .bento-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    grid-auto-rows: 280px;
  }

  @media (min-width: 768px) {
    .bento-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .bento-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
  }

  @media (min-width: 1280px) {
    .bento-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  /* Card size variants */
  .card-featured {
    grid-row: span 2;
    grid-column: span 2;
  }

  .card-medium {
    grid-row: span 2;
    grid-column: span 1;
  }

  .card-standard {
    grid-row: span 1;
    grid-column: span 1;
  }

  .card-compact {
    grid-row: span 1;
    grid-column: span 1;
  }

  /* Mobile adjustments */
  @media (max-width: 767px) {
    .bento-grid {
      grid-template-columns: 1fr;
      grid-auto-rows: auto;
    }
    
    .card-featured,
    .card-medium,
    .card-standard,
    .card-compact {
      grid-row: span 1;
      grid-column: span 1;
    }
  }

  /* Tablet adjustments */
  @media (min-width: 768px) and (max-width: 1023px) {
    .card-featured {
      grid-row: span 1;
      grid-column: span 2;
    }
  }
`;
