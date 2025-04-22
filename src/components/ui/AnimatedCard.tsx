'use client';

import React, { ReactNode } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import useAnimation from '@/hooks/useAnimation';

type AnimationType = 
  | 'fade-in'
  | 'slide-in-right'
  | 'slide-in-left'
  | 'slide-in-bottom'
  | 'slide-in-top'
  | 'scale-in'
  | 'flip-in'
  | 'float'
  | 'pulse-once'
  | 'bounce-once'
  | 'shake'
  | 'attention';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  animation?: AnimationType;
  duration?: number;
  delay?: number;
  triggerOnView?: boolean;
  hoverEffect?: 'lift' | 'scale' | 'none';
  header?: ReactNode;
  footer?: ReactNode;
}

export default function AnimatedCard({
  children,
  className = '',
  animation = 'fade-in',
  duration = 300,
  delay = 0,
  triggerOnView = true,
  hoverEffect = 'none',
  header,
  footer,
}: AnimatedCardProps) {
  const { ref, className: animationClass, style } = useAnimation({
    type: animation,
    duration,
    delay,
    triggerOnMount: !triggerOnView,
    triggerOnView,
  });

  const getHoverClass = () => {
    switch (hoverEffect) {
      case 'lift':
        return 'hover-lift';
      case 'scale':
        return 'hover-scale';
      default:
        return '';
    }
  };

  return (
    <div
      ref={ref}
      className={`${animationClass} ${getHoverClass()}`}
      style={style}
    >
      <Card className={`overflow-hidden ${className}`}>
        {header && <CardHeader>{header}</CardHeader>}
        <CardContent>{children}</CardContent>
        {footer && <CardFooter>{footer}</CardFooter>}
      </Card>
    </div>
  );
}
