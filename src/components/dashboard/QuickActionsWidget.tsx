'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PlusIcon,
  MapIcon,
  CalendarIcon,
  DollarSignIcon,
  CameraIcon,
  ShareIcon,
  DownloadIcon,
  SearchIcon,
  BotIcon,
  ZapIcon,
  RocketIcon,
  SparklesIcon,
  BarChart3Icon,
  BookOpenIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import AdvancedMetricsModal from './AdvancedMetricsModal';

interface QuickActionsWidgetProps {
  className?: string;
  trips?: any[];
}

export default function QuickActionsWidget({ className, trips = [] }: QuickActionsWidgetProps) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const quickActions = [
    {
      id: 'new-trip',
      title: 'New Trip',
      description: 'Plan your next adventure',
      icon: PlusIcon,
      href: '/trips/new',
      gradient: 'from-blue-500 to-purple-600',
      shortcut: 'Ctrl+N',
      primary: true
    },
    {
      id: 'travel-hub',
      title: 'Travel Hub',
      description: 'Guides, tips & inspiration',
      icon: BookOpenIcon,
      href: '/hub',
      gradient: 'from-indigo-500 to-purple-600',
      shortcut: 'H'
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      description: 'Get help with your travels',
      icon: BotIcon,
      href: '#',
      gradient: 'from-green-500 to-teal-600',
      shortcut: 'Ctrl+K',
      action: 'openAI'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View travel insights',
      icon: BarChart3Icon,
      href: '#',
      gradient: 'from-purple-500 to-pink-600',
      shortcut: 'A',
      action: 'openAnalytics'
    }
  ];

  const handleAction = (action: string) => {
    switch (action) {
      case 'openAI':
        // Trigger AI assistant modal
        window.dispatchEvent(new CustomEvent('openAIAssistant'));
        break;
      case 'openAnalytics':
        // Trigger analytics modal
        window.dispatchEvent(new CustomEvent('openAnalyticsModal'));
        break;
      default:
        break;
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <ZapIcon className="h-5 w-5 text-yellow-500" />
          Quick Actions
          <div className="ml-auto">
            <SparklesIcon className="h-4 w-4 text-yellow-500 animate-pulse" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Action */}
        {quickActions
          .filter(action => action.primary)
          .map(action => {
            const Icon = action.icon;
            return (
              <Link key={action.id} href={action.href}>
                <div
                  className={cn(
                    "relative group p-4 rounded-xl bg-gradient-to-r text-white cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden",
                    action.gradient
                  )}
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{action.title}</h3>
                      <p className="text-white/80 text-sm">{action.description}</p>
                    </div>
                    <div className="text-right">
                      <RocketIcon className="h-5 w-5 mb-1 group-hover:animate-bounce" />
                      <p className="text-xs text-white/60">{action.shortcut}</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

        {/* Secondary Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions
            .filter(action => !action.primary)
            .map(action => {
              const Icon = action.icon;
              const isHovered = hoveredAction === action.id;

              const isLink = action.href !== '#';
              const ActionWrapper = isLink ? Link : 'div';
              const wrapperProps: any = isLink
                ? { href: action.href }
                : { onClick: () => action.action && handleAction(action.action) };

              // Special handling for analytics action
              if (action.action === 'openAnalytics') {
                return (
                  <AdvancedMetricsModal
                    key={action.id}
                    trips={trips}
                    trigger={
                      <div
                        className={cn(
                          "group p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-all duration-300 hover:shadow-md",
                          isHovered && "scale-105"
                        )}
                        onMouseEnter={() => setHoveredAction(action.id)}
                        onMouseLeave={() => setHoveredAction(null)}
                      >
                        <div className="space-y-2">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r transition-all duration-300",
                            action.gradient,
                            isHovered && "scale-110"
                          )}>
                            <BarChart3Icon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-sm group-hover:text-primary transition-colors">
                              {action.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {action.description}
                            </p>
                            {action.shortcut && (
                              <p className="text-xs text-muted-foreground mt-1 font-mono">
                                {action.shortcut}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    }
                  />
                );
              }

              return (
                <ActionWrapper key={action.id} {...wrapperProps}>
                  <div
                    className={cn(
                      "group p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-all duration-300 hover:shadow-md",
                      isHovered && "scale-105"
                    )}
                    onMouseEnter={() => setHoveredAction(action.id)}
                    onMouseLeave={() => setHoveredAction(null)}
                  >
                    <div className="space-y-2">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r transition-all duration-300",
                        action.gradient,
                        isHovered && "scale-110"
                      )}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">
                          {action.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {action.description}
                        </p>
                        {action.shortcut && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            {action.shortcut}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </ActionWrapper>
              );
            })}
        </div>

        {/* Quick Stats */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active shortcuts</span>
            <span className="font-medium">{quickActions.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Last used</span>
            <span className="font-medium">New Trip</span>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Tip</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Use <kbd className="px-1 py-0.5 bg-background rounded text-xs">Ctrl+K</kbd> to open quick search
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
