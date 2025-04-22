'use client';

import { useSubscription } from '@/lib/subscription';
import { Badge } from '@/components/ui/badge';
import { LockIcon, SparklesIcon } from 'lucide-react';

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
  feature?: 'accommodations' | 'transportation' | 'unlimited_trips';
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
    if (feature === 'accommodations') {
      return 'Accommodations management is a premium feature. Upgrade to access.';
    } else if (feature === 'transportation') {
      return 'Transportation tracking is a premium feature. Upgrade to access.';
    } else if (feature === 'unlimited_trips') {
      return 'Free users are limited to 3 trips. Upgrade to create unlimited trips.';
    } else {
      return 'This is a premium feature. Upgrade to access.';
    }
  };

  const content = () => {
    switch (variant) {
      case 'badge':
        return (
          <Badge variant="outline" className="gap-1 border-amber-500 text-amber-500">
            <SparklesIcon className={iconSizes[size]} />
            <span className={textSizes[size]}>Premium</span>
          </Badge>
        );
      case 'icon':
        return <LockIcon className={`${iconSizes[size]} text-amber-500`} />;
      case 'text':
        return (
          <span className={`${textSizes[size]} text-amber-500 flex items-center gap-1`}>
            <SparklesIcon className={iconSizes[size]} />
            Premium
          </span>
        );
      default:
        return null;
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
              onClick={(e) => {
                e.stopPropagation();
                upgradeSubscription();
              }}
            >
              Upgrade now
            </button>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content();
}
