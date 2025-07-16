import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'black';
  variant?: 'default' | 'dots' | 'pulse' | 'bars' | 'ring';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
  variant = 'default',
  text,
  fullScreen = false,
  className = '',
}: LoadingSpinnerProps) {
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4 border-2';
      case 'md':
        return 'h-8 w-8 border-2';
      case 'lg':
        return 'h-12 w-12 border-3';
      case 'xl':
        return 'h-16 w-16 border-4';
      default:
        return 'h-8 w-8 border-2';
    }
  };

  const getColorClass = () => {
    switch (color) {
      case 'primary':
        return 'border-primary/30 border-t-primary';
      case 'secondary':
        return 'border-secondary/30 border-t-secondary';
      case 'white':
        return 'border-white/30 border-t-white';
      case 'black':
        return 'border-black/30 border-t-black';
      default:
        return 'border-primary/30 border-t-primary';
    }
  };

  const renderSpinner = () => {
    if (variant === 'dots') {
      return (
        <div className="flex items-center justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-full animate-pulse',
                size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2 h-2' : 'w-3 h-3',
                getColorClass().split(' ')[1].replace('border-t-', 'bg-')
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      );
    }

    if (variant === 'bars') {
      return (
        <div className="flex items-end justify-center space-x-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                'animate-pulse',
                size === 'sm' ? 'w-0.5 h-3' : size === 'md' ? 'w-1 h-4' : size === 'lg' ? 'w-1 h-6' : 'w-1.5 h-8',
                getColorClass().split(' ')[1].replace('border-t-', 'bg-')
              )}
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1.2s'
              }}
            />
          ))}
        </div>
      );
    }

    if (variant === 'pulse') {
      return (
        <div
          className={cn(
            'rounded-full animate-pulse',
            getSizeClass().replace('border-2', '').replace('border-3', '').replace('border-4', ''),
            getColorClass().split(' ')[1].replace('border-t-', 'bg-')
          )}
        />
      );
    }

    // Default spinner
    return (
      <div
        className={`rounded-full animate-spin ${getSizeClass()} ${getColorClass()}`}
        role="status"
        aria-label="Loading"
      />
    );
  };

  const spinner = (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      {renderSpinner()}
      {text && (
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
