'use client';

import { useState, useRef, ButtonHTMLAttributes } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';

interface InteractiveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  feedbackType?: 'ripple' | 'pulse' | 'bounce' | 'glow' | 'none';
  feedbackColor?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function InteractiveButton({
  variant = 'default',
  size = 'default',
  loading = false,
  success = false,
  error = false,
  feedbackType = 'ripple',
  feedbackColor = 'rgba(255, 255, 255, 0.7)',
  children,
  className,
  onClick,
  disabled,
  ...props
}: InteractiveButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Trigger feedback animation
    if (feedbackType === 'ripple') {
      createRipple(e);
    } else if (feedbackType !== 'none') {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }

    // Call the original onClick handler
    if (onClick) {
      onClick(e);
    }
  };

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      id: rippleIdRef.current++,
      x,
      y,
      size
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  const getAnimationClass = () => {
    if (loading) return 'animate-pulse';
    if (success) return 'animate-bounce-once';
    if (error) return 'animate-shake';
    if (!isAnimating) return '';

    switch (feedbackType) {
      case 'pulse':
        return 'animate-pulse-once';
      case 'bounce':
        return 'animate-bounce-once';
      case 'glow':
        return 'animate-card-glow';
      default:
        return '';
    }
  };

  const getStateClasses = () => {
    if (success) return 'bg-green-500 hover:bg-green-600 border-green-500';
    if (error) return 'bg-red-500 hover:bg-red-600 border-red-500';
    return '';
  };

  return (
    <Button
      ref={buttonRef}
      variant={variant}
      size={size}
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        getAnimationClass(),
        getStateClasses(),
        className
      )}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {/* Content with loading state */}
      <span className={cn('flex items-center gap-2', loading && 'opacity-0')}>
        {children}
      </span>

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner 
            size="sm" 
            variant="default"
            color="white"
          />
        </div>
      )}

      {/* Success indicator */}
      {success && !loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Error indicator */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}

      {/* Ripple effects */}
      {feedbackType === 'ripple' && ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: feedbackColor,
          }}
        />
      ))}

      {/* Glow effect */}
      {feedbackType === 'glow' && isAnimating && (
        <div className="absolute inset-0 rounded-md bg-white/20 animate-pulse" />
      )}
    </Button>
  );
}

// Preset button variants
export function SuccessButton(props: Omit<InteractiveButtonProps, 'success'>) {
  return <InteractiveButton {...props} success feedbackType="bounce" />;
}

export function LoadingButton(props: Omit<InteractiveButtonProps, 'loading'>) {
  return <InteractiveButton {...props} loading />;
}

export function ErrorButton(props: Omit<InteractiveButtonProps, 'error'>) {
  return <InteractiveButton {...props} error feedbackType="shake" />;
}
