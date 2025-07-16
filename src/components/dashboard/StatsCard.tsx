'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  description,
  trend 
}: StatsCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-card/80 border border-border/50 animate-stats-card">
      <CardContent className="p-0">
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {/* Header with icon */}
          <div className="flex items-center justify-between">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon
                className="h-5 w-5 sm:h-6 sm:w-6"
                style={{ color: color }}
              />
            </div>
            {trend && (
              <div className={`flex items-center text-xs px-2 py-1 rounded-full ${
                trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                <span className={trend.isPositive ? '↗' : '↘'}>
                  {Math.abs(trend.value)}%
                </span>
              </div>
            )}
          </div>

          {/* Value and title */}
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              {value}
            </div>
            <div className="text-xs sm:text-sm font-medium text-muted-foreground">
              {title}
            </div>
            {description && (
              <div className="text-xs text-muted-foreground/80">
                {description}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ 
                backgroundColor: color,
                width: `${Math.min((value / 10) * 100, 100)}%`
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
