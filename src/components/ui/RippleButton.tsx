'use client';

import React, { useState, useRef, ButtonHTMLAttributes } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RippleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  feedbackType?: 'ripple' | 'pulse' | 'bounce' | 'shake' | 'none';
  feedbackColor?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function RippleButton({
  variant = 'default',
  size = 'default',
  feedbackType = 'ripple',
  feedbackColor = 'rgba(255, 255, 255, 0.7)',
  children,
  className,
  onClick,
  ...props
}: RippleButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Call the original onClick handler if provided
    if (onClick) {
      onClick(e);
    }

    // Apply the appropriate feedback animation
    if (feedbackType === 'ripple') {
      // Create a ripple effect at the click position
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate ripple size based on button dimensions
        const size = Math.max(rect.width, rect.height) * 2;
        
        // Add new ripple
        const newRipple = { id: rippleIdRef.current++, x, y, size };
        setRipples((prev) => [...prev, newRipple]);
        
        // Remove ripple after animation completes
        setTimeout(() => {
          setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
        }, 600);
      }
    } else if (feedbackType !== 'none') {
      // For other animation types
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  // Determine animation class based on feedbackType
  const getAnimationClass = () => {
    if (!isAnimating) return '';
    
    switch (feedbackType) {
      case 'pulse':
        return 'animate-pulse-once';
      case 'bounce':
        return 'animate-bounce-once';
      case 'shake':
        return 'animate-shake';
      default:
        return '';
    }
  };

  return (
    <Button
      ref={buttonRef}
      variant={variant}
      size={size}
      className={cn(
        'relative overflow-hidden transition-all',
        getAnimationClass(),
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
      
      {/* Ripple effects */}
      {feedbackType === 'ripple' && ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: feedbackColor,
          }}
        />
      ))}
    </Button>
  );
}
