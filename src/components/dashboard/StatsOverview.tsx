'use client';

import StatsCard from './StatsCard';
import { MapPinIcon, CalendarIcon, TrendingUpIcon, ClockIcon } from 'lucide-react';

interface StatsOverviewProps {
  stats: {
    total: number;
    upcoming: number;
    ongoing: number;
    completed: number;
  };
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const statsData = [
    {
      title: 'Total Trips',
      value: stats.total,
      icon: MapPinIcon,
      color: '#3b82f6',
      description: 'All your adventures'
    },
    {
      title: 'Upcoming',
      value: stats.upcoming,
      icon: CalendarIcon,
      color: '#10b981',
      description: 'Ready to explore'
    },
    {
      title: 'Ongoing',
      value: stats.ongoing,
      icon: ClockIcon,
      color: '#f59e0b',
      description: 'Currently traveling'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: TrendingUpIcon,
      color: '#8b5cf6',
      description: 'Memories made'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 animate-content-fade-in" style={{ animationDelay: '100ms' }}>
      {statsData.map((stat, index) => (
        <div 
          key={stat.title}
          className="animate-content-fade-in"
          style={{ animationDelay: `${150 + index * 50}ms` }}
        >
          <StatsCard {...stat} />
        </div>
      ))}
    </div>
  );
}
