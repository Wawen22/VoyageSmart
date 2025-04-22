'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import PageTransition from '@/components/ui/PageTransition';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  transitionType?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'none';
  duration?: number;
  delay?: number;
}

export default function PageLayout({
  children,
  className = '',
  transitionType = 'fade',
  duration = 300,
  delay = 0,
}: PageLayoutProps) {
  const pathname = usePathname();

  return (
    <PageTransition
      location={pathname}
      transitionType={transitionType}
      duration={duration}
      delay={delay}
      className={className}
    >
      <div className="page-content">
        {children}
      </div>
    </PageTransition>
  );
}
