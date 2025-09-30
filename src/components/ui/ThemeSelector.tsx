'use client';

import { useState } from 'react';
import { PaletteIcon, CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme, type ThemeVariant } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface ThemeSelectorProps {
  className?: string;
  compact?: boolean;
}

export default function ThemeSelector({ className = '', compact = false }: ThemeSelectorProps) {
  const { currentTheme, themes, changeTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeColors = {
    default: '#3b82f6',
    ocean: '#0ea5e9',
    forest: '#10b981',
    sunset: '#f97316',
    midnight: '#8b5cf6',
    lavender: '#ec4899'
  };

  if (compact) {
    return (
      <div className={cn('relative', className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 p-0"
        >
          <PaletteIcon className="h-4 w-4" />
        </Button>

        {isOpen && (
          <div className="absolute top-12 right-0 z-50">
            <Card className="w-48 shadow-lg border border-border/50 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(themes).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => {
                        changeTheme(key as ThemeVariant);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-12 h-12 rounded-lg border-2 transition-all duration-200 hover:scale-110 relative',
                        currentTheme === key ? 'border-foreground shadow-md' : 'border-border/30'
                      )}
                      style={{ backgroundColor: themeColors[key as keyof typeof themeColors] }}
                      title={theme.label}
                    >
                      {currentTheme === key && (
                        <CheckIcon className="h-4 w-4 text-white absolute inset-0 m-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PaletteIcon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Theme</h3>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Choose a color theme for your dashboard
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => changeTheme(key as ThemeVariant)}
                className={cn(
                  'group relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105',
                  currentTheme === key 
                    ? 'border-primary shadow-lg ring-2 ring-primary/20' 
                    : 'border-border/30 hover:border-border/60'
                )}
              >
                {/* Theme preview */}
                <div className="space-y-3">
                  <div 
                    className="w-full h-8 rounded-lg"
                    style={{ backgroundColor: themeColors[key as keyof typeof themeColors] }}
                  />
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-left">
                      {theme.label}
                    </div>
                    <div className="flex gap-1">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: themeColors[key as keyof typeof themeColors] }}
                      />
                      <div className="w-3 h-3 rounded-full bg-muted" />
                      <div className="w-3 h-3 rounded-full bg-muted/50" />
                    </div>
                  </div>
                </div>

                {/* Selected indicator */}
                {currentTheme === key && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <CheckIcon className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              Your theme preference will be saved automatically
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick theme switcher for header
export function QuickThemeSwitch({ className = '' }: { className?: string }) {
  const { currentTheme, themes, changeTheme } = useTheme();

  const nextTheme = (): ThemeVariant => {
    const themeKeys = Object.keys(themes) as ThemeVariant[];
    const currentIndex = themeKeys.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    return themeKeys[nextIndex];
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => changeTheme(nextTheme())}
      className={cn('w-8 h-8 p-0', className)}
      title="Switch theme"
    >
      <PaletteIcon className="h-4 w-4" />
    </Button>
  );
}
