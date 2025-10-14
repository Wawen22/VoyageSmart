'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import {
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  ArrowRightIcon,
  StarIcon,
  HeartIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Trip = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  destination: string | null;
  created_at: string;
};

interface ModernTripCardProps {
  trip: Trip;
  isFavorited?: boolean;
  onFavoriteToggle?: () => void;
}

export default function ModernTripCard({ trip, isFavorited = false, onFavoriteToggle }: ModernTripCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBD';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'dd MMM yyyy') : 'Invalid date';
    } catch {
      return 'Invalid date';
    }
  };

  const getStatus = () => {
    if (!trip.start_date || !trip.end_date) return { text: 'Planning', color: 'from-blue-500 to-cyan-500', emoji: '📋' };
    const now = new Date();
    const start = parseISO(trip.start_date);
    const end = parseISO(trip.end_date);
    if (now < start) return { text: 'Upcoming', color: 'from-emerald-500 to-teal-500', emoji: '🚀' };
    if (now >= start && now <= end) return { text: 'Ongoing', color: 'from-orange-500 to-red-500', emoji: '✈️' };
    return { text: 'Completed', color: 'from-purple-500 to-pink-500', emoji: '✅' };
  };

  const getDuration = () => {
    if (!trip.start_date || !trip.end_date) return null;
    try {
      const start = parseISO(trip.start_date);
      const end = parseISO(trip.end_date);
      const days = differenceInDays(end, start) + 1;
      return `${days} day${days !== 1 ? 's' : ''}`;
    } catch {
      return null;
    }
  };

  const status = getStatus();
  const duration = getDuration();

  return (
    <Link href={`/trips/${trip.id}`} className="block group">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="glass-info-card rounded-2xl p-6 hover:scale-[1.02] transition-all duration-500"
      >
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-all duration-700" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-all duration-700" />
        <div className="absolute inset-0 opacity-5 glass-grid-pattern" />

        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <Badge className={cn('text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 border border-white/20', status.color)}>
              <span className="mr-1.5">{status.emoji}</span>
              {status.text}
            </Badge>
            <button
              onClick={(e) => {
                e.preventDefault();
                onFavoriteToggle?.();
              }}
              className={cn(
                'p-1.5 rounded-full transition-all duration-200',
                isFavorited ? 'bg-yellow-400/20 text-yellow-400' : 'bg-white/10 text-white/60 hover:bg-white/20'
              )}
            >
              <StarIcon className={cn('h-4 w-4', isFavorited && 'fill-current')} />
            </button>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-foreground truncate group-hover:text-primary transition-colors mt-4">
            {trip.name}
          </h3>

          {trip.destination && (
            <p className="text-muted-foreground flex items-center gap-2 text-sm mt-2">
              <MapPinIcon className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="truncate">{trip.destination}</span>
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-4">
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
              </span>
            </span>
            {duration && (
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4 flex-shrink-0" />
                {duration}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
            <div className="text-xs text-muted-foreground">
              Created {format(parseISO(trip.created_at), 'dd MMM')}
            </div>
            <div className="flex items-center gap-1 text-primary text-xs font-medium transition-all duration-200 group-hover:translate-x-1">
              <span>Explore</span>
              <ArrowRightIcon className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}