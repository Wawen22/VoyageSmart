'use client';

import { useSubscription } from '@/lib/subscription';
import { Badge } from '@/components/ui/badge';
import { LockIcon, SparklesIcon } from 'lucide-react';
import { useOnboardingModal } from './OnboardingModal';

// Dynamically import tooltip components to handle cases where they might not be available
let TooltipProvider: any;
let Tooltip: any;
let TooltipTrigger: any;
let TooltipContent: any;

try {
  const tooltipModule = require('@/components/ui/tooltip');
  TooltipProvider = tooltipModule.TooltipProvider;
  Tooltip = tooltipModule.Tooltip;
  TooltipTrigger = tooltipModule.TooltipTrigger;
  TooltipContent = tooltipModule.TooltipContent;
} catch (error) {
  console.warn('Tooltip components not available');
}

interface PremiumIndicatorProps {
  feature?: 'journal' | 'photo_gallery' | 'unlimited_trips';
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'icon' | 'text';
}

export default function PremiumIndicator({
  feature,
  showTooltip = true,
  size = 'md',
  variant = 'badge'
}: PremiumIndicatorProps) {
  const { subscription, isSubscribed, upgradeSubscription } = useSubscription();

  // Prova a usare il modal context, ma fallback se non disponibile
  let showModal: (() => void) | null = null;
  try {
    const modalContext = useOnboardingModal();
    showModal = modalContext.showModal;
  } catch (error) {
    // Context non disponibile, useremo il fallback
  }

  // If user has premium, don't show the indicator
  if (isSubscribed('premium')) {
    return null;
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const getTooltipText = () => {
    if (feature === 'journal') {
      return 'Journal entries are a premium feature. Upgrade to access unlimited entries.';
    } else if (feature === 'photo_gallery') {
      return 'Photo gallery is a premium feature. Upgrade to access unlimited photo uploads.';
    } else if (feature === 'unlimited_trips') {
      return 'Free users are limited to 5 trips. Upgrade to create unlimited trips.';
    } else {
      return 'This is a premium feature. Upgrade to access.';
    }
  };

  const content = () => {
    switch (variant) {
      case 'badge':
        return (
          <Badge variant="outline" className="gap-1 border-amber-500 text-amber-500 bg-amber-100/30 dark:bg-amber-900/30 hover:bg-amber-100/50 dark:hover:bg-amber-900/50 transition-colors">
            <SparklesIcon className={`${iconSizes[size]} animate-pulse`} />
            <span className={textSizes[size]}>Premium</span>
          </Badge>
        );
      case 'icon':
        return <SparklesIcon className={`${iconSizes[size]} text-amber-500 animate-pulse`} />;
      case 'text':
        return (
          <span className={`${textSizes[size]} text-amber-500 flex items-center gap-1 bg-amber-100/30 dark:bg-amber-900/30 px-2 py-0.5 rounded-full`}>
            <SparklesIcon className={`${iconSizes[size]} animate-pulse`} />
            Premium
          </span>
        );
      default:
        return null;
    }
  };

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showModal) {
      showModal();
    } else {
      upgradeSubscription();
    }
  };

  if (showTooltip && TooltipProvider && Tooltip && TooltipTrigger && TooltipContent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex cursor-help" onClick={(e) => e.stopPropagation()}>
              {content()}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipText()}</p>
            <button
              className="text-xs text-primary font-medium mt-1 hover:underline"
              onClick={handleUpgradeClick}
            >
              Upgrade now
            </button>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div onClick={handleUpgradeClick} className="cursor-pointer">
      {content()}
    </div>
  );
}
