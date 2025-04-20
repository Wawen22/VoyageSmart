import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'black';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
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

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`rounded-full animate-spin ${getSizeClass()} ${getColorClass()}`}
        role="status"
        aria-label="Loading"
      />
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
