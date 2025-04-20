'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary dark:bg-secondary/10 backdrop-blur-sm border border-border">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-md transition-all duration-200 ${
          theme === 'light'
            ? 'bg-background text-primary shadow-sm scale-105'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
        }`}
        title="Light mode"
      >
        <SunIcon className="h-4 w-4" />
        <span className="sr-only">Light Mode</span>
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-md transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-background text-primary shadow-sm scale-105'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
        }`}
        title="Dark mode"
      >
        <MoonIcon className="h-4 w-4" />
        <span className="sr-only">Dark Mode</span>
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-md transition-all duration-200 ${
          theme === 'system'
            ? 'bg-background text-primary shadow-sm scale-105'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
        }`}
        title="System preference"
      >
        <ComputerDesktopIcon className="h-4 w-4" />
        <span className="sr-only">System Mode</span>
      </button>
    </div>
  );
}
