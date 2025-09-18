'use client';

import { useState, useEffect } from 'react';

export type ThemeVariant = 'default' | 'ocean' | 'forest' | 'sunset' | 'midnight' | 'lavender';

export interface ThemeConfig {
  name: string;
  label: string;
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    accent: string;
    background: string;
    card: string;
    muted: string;
  };
  gradients: {
    primary: string;
    secondary: string;
    background: string;
  };
}

export const themes: Record<ThemeVariant, ThemeConfig> = {
  default: {
    name: 'default',
    label: 'Default Blue',
    colors: {
      primary: '221.2 83.2% 53.3%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96.1%',
      accent: '210 40% 96.1%',
      background: '0 0% 100%',
      card: '0 0% 100%',
      muted: '210 40% 96.1%'
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(221.2 83.2% 53.3%) 0%, hsl(221.2 83.2% 45%) 100%)',
      secondary: 'linear-gradient(135deg, hsl(210 40% 96.1%) 0%, hsl(210 40% 90%) 100%)',
      background: 'linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(210 40% 98%) 100%)'
    }
  },
  ocean: {
    name: 'ocean',
    label: 'Ocean Blue',
    colors: {
      primary: '199 89% 48%',
      primaryForeground: '210 40% 98%',
      secondary: '200 50% 95%',
      accent: '200 50% 95%',
      background: '210 100% 99%',
      card: '210 100% 99%',
      muted: '200 50% 95%'
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(199 89% 48%) 0%, hsl(199 89% 40%) 100%)',
      secondary: 'linear-gradient(135deg, hsl(200 50% 95%) 0%, hsl(200 50% 90%) 100%)',
      background: 'linear-gradient(135deg, hsl(210 100% 99%) 0%, hsl(200 50% 97%) 100%)'
    }
  },
  forest: {
    name: 'forest',
    label: 'Forest Green',
    colors: {
      primary: '142 76% 36%',
      primaryForeground: '355 100% 97%',
      secondary: '138 30% 95%',
      accent: '138 30% 95%',
      background: '120 20% 99%',
      card: '120 20% 99%',
      muted: '138 30% 95%'
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(142 76% 36%) 0%, hsl(142 76% 28%) 100%)',
      secondary: 'linear-gradient(135deg, hsl(138 30% 95%) 0%, hsl(138 30% 90%) 100%)',
      background: 'linear-gradient(135deg, hsl(120 20% 99%) 0%, hsl(138 30% 97%) 100%)'
    }
  },
  sunset: {
    name: 'sunset',
    label: 'Sunset Orange',
    colors: {
      primary: '25 95% 53%',
      primaryForeground: '210 40% 98%',
      secondary: '25 30% 95%',
      accent: '25 30% 95%',
      background: '30 40% 99%',
      card: '30 40% 99%',
      muted: '25 30% 95%'
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(25 95% 53%) 0%, hsl(25 95% 45%) 100%)',
      secondary: 'linear-gradient(135deg, hsl(25 30% 95%) 0%, hsl(25 30% 90%) 100%)',
      background: 'linear-gradient(135deg, hsl(30 40% 99%) 0%, hsl(25 30% 97%) 100%)'
    }
  },
  midnight: {
    name: 'midnight',
    label: 'Midnight Purple',
    colors: {
      primary: '263 70% 50%',
      primaryForeground: '210 40% 98%',
      secondary: '260 20% 95%',
      accent: '260 20% 95%',
      background: '270 20% 99%',
      card: '270 20% 99%',
      muted: '260 20% 95%'
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(263 70% 50%) 0%, hsl(263 70% 42%) 100%)',
      secondary: 'linear-gradient(135deg, hsl(260 20% 95%) 0%, hsl(260 20% 90%) 100%)',
      background: 'linear-gradient(135deg, hsl(270 20% 99%) 0%, hsl(260 20% 97%) 100%)'
    }
  },
  lavender: {
    name: 'lavender',
    label: 'Lavender Pink',
    colors: {
      primary: '316 73% 52%',
      primaryForeground: '210 40% 98%',
      secondary: '315 20% 95%',
      accent: '315 20% 95%',
      background: '320 30% 99%',
      card: '320 30% 99%',
      muted: '315 20% 95%'
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(316 73% 52%) 0%, hsl(316 73% 44%) 100%)',
      secondary: 'linear-gradient(135deg, hsl(315 20% 95%) 0%, hsl(315 20% 90%) 100%)',
      background: 'linear-gradient(135deg, hsl(320 30% 99%) 0%, hsl(315 20% 97%) 100%)'
    }
  }
};

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<ThemeVariant>('default');

  useEffect(() => {
    // Load theme from localStorage (hydration-safe)
    if (typeof window === 'undefined') return;

    const savedTheme = localStorage.getItem('dashboard-theme') as ThemeVariant;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (theme: ThemeVariant) => {
    if (typeof window === 'undefined') return;

    const themeConfig = themes[theme];
    const root = document.documentElement;

    // Apply CSS custom properties
    Object.entries(themeConfig.colors).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--${cssVar}`, value);
    });

    // Apply gradients as data attributes for CSS access
    root.setAttribute('data-theme', theme);

    // Store in localStorage
    localStorage.setItem('dashboard-theme', theme);
  };

  const changeTheme = (theme: ThemeVariant) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  return {
    currentTheme,
    themes,
    changeTheme,
    getCurrentThemeConfig: () => themes[currentTheme]
  };
}
