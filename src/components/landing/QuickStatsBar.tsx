'use client';

import React from 'react';
import { Target, Zap, Users, Globe } from 'lucide-react';

interface Stat {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export default function QuickStatsBar() {
  const stats: Stat[] = [
    {
      icon: <Target className="h-4 w-4" />,
      label: 'Total Features',
      value: '9'
    },
    {
      icon: <Zap className="h-4 w-4" />,
      label: 'AI-Powered',
      value: '3'
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: 'Collaborative',
      value: 'Yes'
    },
    {
      icon: <Globe className="h-4 w-4" />,
      label: 'Multi-Platform',
      value: 'All Devices'
    }
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5 border-y border-border/50 backdrop-blur-sm py-6">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-center gap-12">
          {stats.map((stat, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-3 group">
                <div className="p-2.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                  <div className="text-primary">
                    {stat.icon}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </div>
              {idx < stats.length - 1 && (
                <div className="w-px h-10 bg-border/50"></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile Layout - Horizontal Scroll */}
        <div className="md:hidden overflow-x-auto scrollbar-hide">
          <div className="flex gap-6 pb-2 min-w-max">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <div className="text-primary">
                    {stat.icon}
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
