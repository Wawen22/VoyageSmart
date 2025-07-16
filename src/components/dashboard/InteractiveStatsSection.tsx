'use client';

import { useState, useEffect } from 'react';
import { 
  MapIcon, 
  CalendarIcon, 
  TrendingUpIcon, 
  ClockIcon,
  GlobeIcon,
  StarIcon,
  CameraIcon,
  HeartIcon,
  ZapIcon,
  TrophyIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveStatsSectionProps {
  stats: {
    total: number;
    upcoming: number;
    ongoing: number;
    completed: number;
  };
}

export default function InteractiveStatsSection({ stats }: InteractiveStatsSectionProps) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [animatedValues, setAnimatedValues] = useState({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0
  });

  // Animate numbers on mount
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      setAnimatedValues({
        total: Math.floor(stats.total * easeOutQuart),
        upcoming: Math.floor(stats.upcoming * easeOutQuart),
        ongoing: Math.floor(stats.ongoing * easeOutQuart),
        completed: Math.floor(stats.completed * easeOutQuart)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedValues(stats);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [stats]);

  const statCards = [
    {
      title: 'Avventure Totali',
      value: animatedValues.total,
      icon: GlobeIcon,
      gradient: 'from-blue-500 via-purple-500 to-pink-500',
      bgGradient: 'from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950',
      description: 'La tua collezione di viaggi',
      emoji: '🌍',
      particles: 12
    },
    {
      title: 'Prossimi Viaggi',
      value: animatedValues.upcoming,
      icon: CalendarIcon,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      bgGradient: 'from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950',
      description: 'Pronti per partire',
      emoji: '✨',
      particles: 8
    },
    {
      title: 'In Viaggio',
      value: animatedValues.ongoing,
      icon: ZapIcon,
      gradient: 'from-orange-500 via-red-500 to-pink-500',
      bgGradient: 'from-orange-50 via-red-50 to-pink-50 dark:from-orange-950 dark:via-red-950 dark:to-pink-950',
      description: 'Avventure in corso',
      emoji: '🔥',
      particles: 6
    },
    {
      title: 'Completati',
      value: animatedValues.completed,
      icon: TrophyIcon,
      gradient: 'from-purple-500 via-indigo-500 to-blue-500',
      bgGradient: 'from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950',
      description: 'Ricordi indimenticabili',
      emoji: '🏆',
      particles: 10
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const isHovered = hoveredCard === index;
        
        return (
          <div
            key={stat.title}
            className={cn(
              "group relative cursor-pointer transition-all duration-700 hover:scale-110 animate-fade-in-up",
              isHovered && "z-10"
            )}
            style={{ animationDelay: `${index * 200}ms` }}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Glow effect */}
            <div className={cn(
              "absolute -inset-2 bg-gradient-to-r opacity-0 blur-xl transition-all duration-700 rounded-3xl",
              stat.gradient,
              isHovered && "opacity-30"
            )} />

            {/* Main Card */}
            <div className={cn(
              "relative overflow-hidden rounded-3xl p-6 h-full transition-all duration-700",
              "bg-gradient-to-br", stat.bgGradient,
              "border border-white/20 dark:border-slate-700/50",
              "shadow-xl hover:shadow-2xl backdrop-blur-sm",
              isHovered && "transform rotate-1"
            )}>
              {/* Animated particles */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(stat.particles)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "absolute w-1 h-1 bg-white rounded-full opacity-40 animate-float",
                      isHovered && "opacity-80"
                    )}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                      animationDuration: `${2 + Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>

              {/* Icon with emoji */}
              <div className="relative mb-4 flex items-center justify-between">
                <div className={cn(
                  "inline-flex p-4 rounded-2xl bg-gradient-to-br shadow-xl transition-all duration-500",
                  stat.gradient,
                  isHovered && "scale-110 rotate-12"
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                
                <div className={cn(
                  "text-3xl transition-all duration-500",
                  isHovered && "animate-bounce scale-125"
                )}>
                  {stat.emoji}
                </div>
              </div>

              {/* Content */}
              <div className="relative space-y-2">
                <div className={cn(
                  "text-4xl font-bold text-slate-900 dark:text-white transition-all duration-500",
                  isHovered && "scale-110 text-transparent bg-gradient-to-r bg-clip-text",
                  isHovered && stat.gradient
                )}>
                  {stat.value}
                </div>
                
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {stat.title}
                </div>
                
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {stat.description}
                </div>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent">
                <div 
                  className={cn(
                    "h-full bg-gradient-to-r transition-all duration-1000 ease-out",
                    stat.gradient
                  )}
                  style={{ 
                    width: `${Math.min((stat.value / Math.max(stats.total, 1)) * 100, 100)}%`,
                    animationDelay: `${index * 300 + 1000}ms`
                  }}
                />
              </div>

              {/* Hover overlay */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-500",
                isHovered && "opacity-100"
              )} />

              {/* Interactive elements */}
              {isHovered && (
                <div className="absolute top-4 right-4 animate-spin-slow">
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Floating stats for mobile
export function FloatingStats({ stats }: InteractiveStatsSectionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn(
      "lg:hidden fixed bottom-20 left-4 right-4 z-40 transition-all duration-1000",
      isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
    )}>
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 animate-pulse">{stats.total}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Totali</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 animate-pulse">{stats.upcoming}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Prossimi</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 animate-pulse">{stats.ongoing}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Attivi</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 animate-pulse">{stats.completed}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Fatti</div>
          </div>
        </div>
      </div>
    </div>
  );
}
