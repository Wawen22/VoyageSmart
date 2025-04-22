'use client';

import { ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';
import { ReduxProvider } from './ReduxProvider';
import { ThemeProvider } from 'next-themes';
import TransitionProvider from './TransitionProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ReduxProvider>
        <AuthProvider>
          <TransitionProvider>
            {children}
          </TransitionProvider>
        </AuthProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
