'use client';

import { ReactNode } from 'react';
import { usePremiumFeature } from '@/hooks/usePremiumFeature';

interface PremiumFeatureWrapperProps {
  feature: 'premium' | 'ai' | 'unlimited_trips' | 'accommodations' | 'transportation';
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Wrapper component che gestisce automaticamente l'accesso alle funzionalità premium
 * Mostra il modal di upgrade se l'utente non ha accesso
 */
export default function PremiumFeatureWrapper({
  feature,
  children,
  onClick,
  href,
  className = '',
  disabled = false
}: PremiumFeatureWrapperProps) {
  const { hasAccess, withPremiumAccess } = usePremiumFeature();

  const handleClick = () => {
    if (disabled) return;
    
    if (onClick) {
      onClick();
    } else if (href) {
      window.location.href = href;
    }
  };

  // Se l'utente ha accesso, comportamento normale
  if (hasAccess(feature)) {
    return (
      <div className={className} onClick={handleClick}>
        {children}
      </div>
    );
  }

  // Se non ha accesso, usa il wrapper premium
  return (
    <div 
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={disabled ? undefined : withPremiumAccess(feature, handleClick)}
    >
      {children}
    </div>
  );
}
