'use client';

import Link from 'next/link';
import { 
  PlusIcon, 
  MapIcon, 
  CalendarIcon, 
  CameraIcon,
  TrendingUpIcon,
  BookOpenIcon,
  GlobeIcon,
  StarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickActionsPanelProps {
  className?: string;
}

export default function QuickActionsPanel({ className }: QuickActionsPanelProps) {
  const quickActions = [
    {
      title: 'Plan New Trip',
      description: 'Start planning your next adventure',
      icon: MapIcon,
      href: '/trips/new',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950'
    },
    {
      title: 'Quick Itinerary',
      description: 'Create a day-by-day plan',
      icon: CalendarIcon,
      href: '/trips/new?quick=true',
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950'
    },
    {
      title: 'Travel Journal',
      description: 'Document your memories',
      icon: BookOpenIcon,
      href: '/trips/new?type=journal',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950'
    },
    {
      title: 'Explore Destinations',
      description: 'Discover new places to visit',
      icon: GlobeIcon,
      href: '/explore',
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950'
    }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Quick Actions
        </h2>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Get started quickly
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <Link
              key={action.title}
              href={action.href}
              className={cn(
                "group relative p-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl",
                "bg-gradient-to-br", action.bgGradient,
                "border border-white/20 dark:border-slate-700/50",
                "animate-fade-in-up"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />
              </div>

              <div className="relative">
                {/* Icon */}
                <div className={cn(
                  "inline-flex p-3 rounded-xl bg-gradient-to-br mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110",
                  action.gradient
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {action.description}
                  </p>
                </div>

                {/* Arrow indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <div className="w-8 h-8 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function CompactQuickActions({ className }: QuickActionsPanelProps) {
  const actions = [
    { icon: PlusIcon, label: 'New Trip', href: '/trips/new', color: 'blue' },
    { icon: CalendarIcon, label: 'Itinerary', href: '/trips/new?quick=true', color: 'emerald' },
    { icon: CameraIcon, label: 'Journal', href: '/trips/new?type=journal', color: 'purple' },
    { icon: GlobeIcon, label: 'Explore', href: '/explore', color: 'orange' }
  ];

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2", className)}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            href={action.href}
            className={cn(
              "flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 hover:scale-105",
              "bg-white dark:bg-slate-800 shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              action.color === 'blue' && "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
              action.color === 'emerald' && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
              action.color === 'purple' && "bg-purple-100 dark:bg-purple-900/30 text-purple-600",
              action.color === 'orange' && "bg-orange-100 dark:bg-orange-900/30 text-orange-600"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
