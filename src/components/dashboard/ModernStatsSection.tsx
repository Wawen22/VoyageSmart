'use client';

import { 
  MapIcon, 
  CalendarIcon, 
  TrendingUpIcon, 
  ClockIcon,
  GlobeIcon,
  StarIcon,
  CameraIcon,
  HeartIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernStatsSectionProps {
  stats: {
    total: number;
    upcoming: number;
    ongoing: number;
    completed: number;
  };
}

export default function ModernStatsSection({ stats }: ModernStatsSectionProps) {
  const statCards = [
    {
      title: 'Total Adventures',
      value: stats.total,
      icon: GlobeIcon,
      gradient: 'from-blue-500 to-cyan-500',
      bgPattern: 'from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950',
      description: 'Your journey collection',
      trend: '+12%'
    },
    {
      title: 'Upcoming Trips',
      value: stats.upcoming,
      icon: CalendarIcon,
      gradient: 'from-emerald-500 to-teal-500',
      bgPattern: 'from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950',
      description: 'Ready to explore',
      trend: '+5%'
    },
    {
      title: 'Active Journey',
      value: stats.ongoing,
      icon: StarIcon,
      gradient: 'from-orange-500 to-red-500',
      bgPattern: 'from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950',
      description: 'Currently traveling',
      trend: stats.ongoing > 0 ? 'Live' : '0%'
    },
    {
      title: 'Memories Made',
      value: stats.completed,
      icon: CameraIcon,
      gradient: 'from-purple-500 to-pink-500',
      bgPattern: 'from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950',
      description: 'Adventures completed',
      trend: '+8%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <div
            key={stat.title}
            className={cn(
              "relative group cursor-pointer transition-all duration-500 hover:scale-105",
              "animate-fade-in-up"
            )}
            style={{ animationDelay: `${index * 150}ms` }}
          >
            {/* Main Card */}
            <div className={cn(
              "relative overflow-hidden rounded-2xl p-6 h-full",
              "bg-gradient-to-br", stat.bgPattern,
              "border border-white/20 dark:border-slate-700/50",
              "shadow-lg hover:shadow-xl transition-all duration-500",
              "backdrop-blur-sm"
            )}>
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />
              </div>

              {/* Icon with gradient background */}
              <div className="relative mb-4">
                <div className={cn(
                  "inline-flex p-3 rounded-xl bg-gradient-to-br", stat.gradient,
                  "shadow-lg group-hover:shadow-xl transition-all duration-300",
                  "group-hover:scale-110"
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                
                {/* Trend indicator */}
                <div className="absolute -top-1 -right-1">
                  <div className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    "bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm",
                    stat.trend === 'Live' 
                      ? "text-orange-600 animate-pulse" 
                      : "text-emerald-600"
                  )}>
                    {stat.trend}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="relative">
                <div className="mb-2">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1 group-hover:scale-105 transition-transform duration-300">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {stat.title}
                  </div>
                </div>
                
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {stat.description}
                </div>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent">
                <div 
                  className={cn("h-full bg-gradient-to-r", stat.gradient, "transition-all duration-1000")}
                  style={{ 
                    width: `${Math.min((stat.value / Math.max(stats.total, 1)) * 100, 100)}%`,
                    animationDelay: `${index * 200 + 500}ms`
                  }}
                />
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Floating elements on hover */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl" />
          </div>
        );
      })}
    </div>
  );
}

// Quick stats component for mobile
export function QuickStats({ stats }: ModernStatsSectionProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 mb-6 lg:hidden">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Total</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-emerald-600">{stats.upcoming}</div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Upcoming</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{stats.ongoing}</div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Active</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Done</div>
      </div>
    </div>
  );
}
