'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO, isValid } from 'date-fns';
import {
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  ArrowRightIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PremiumIndicator from '@/components/subscription/PremiumIndicator';
import { usePremiumFeature } from '@/hooks/usePremiumFeature';
import { createConsistentDate, isDateInPast, isDateInFuture, getDaysUntilDate, isDateRangeActive } from '@/lib/date-utils';

type Trip = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  destination: string | null;
  created_at: string;
};

interface TripCardProps {
  trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getDuration = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return '';
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      if (!isValid(start) || !isValid(end)) return '';

      const diffInDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''}`;
    } catch (error) {
      return '';
    }
  };

  const isUpcoming = () => {
    return isDateInFuture(trip.start_date);
  };

  const isPast = () => {
    return isDateInPast(trip.end_date);
  };

  const getStatusColor = () => {
    if (isUpcoming()) return 'var(--primary)';
    if (isPast()) return 'var(--muted)';
    return 'var(--border)';
  };

  const getDaysUntil = () => {
    return getDaysUntilDate(trip.start_date);
  };

  const daysUntil = getDaysUntil();

  // Function to determine if a trip is in progress (between start and end dates)
  const isInProgress = () => {
    return isDateRangeActive(trip.start_date, trip.end_date);
  };

  // Get trip status for styling
  const getTripStatus = () => {
    if (isInProgress()) return 'in-progress';
    if (isUpcoming()) return 'upcoming';
    if (isPast()) return 'past';
    return 'default';
  };

  // Get status color and icon
  const getStatusInfo = () => {
    const status = getTripStatus();
    switch (status) {
      case 'in-progress':
        return {
          color: 'var(--success)',
          icon: <ClockIcon className="h-3 w-3" />,
          text: 'In Progress'
        };
      case 'upcoming':
        return {
          color: 'var(--primary)',
          icon: <CalendarIcon className="h-3 w-3" />,
          text: daysUntil !== null ? `In ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}` : 'Upcoming'
        };
      case 'past':
        return {
          color: 'var(--muted)',
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"></path></svg>,
          text: 'Completed'
        };
      default:
        return {
          color: 'var(--border)',
          icon: null,
          text: 'Not scheduled'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Link href={`/trips/${trip.id}`} className="block h-full group">
      <Card
        className="overflow-hidden transition-all duration-500 h-full hover:scale-[1.03] hover:shadow-xl relative bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm border border-border/30 hover:border-primary/20"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Status indicator */}
        <div
          className="absolute top-0 left-0 w-full h-1.5 transition-all duration-300 group-hover:h-2"
          style={{
            background: `linear-gradient(90deg, ${statusInfo.color}, ${statusInfo.color}80)`
          }}
        />

        {/* Floating action indicator */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <div className="w-8 h-8 bg-primary/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-primary/20">
            <ArrowRightIcon className="h-4 w-4 text-primary" />
          </div>
        </div>

        <CardContent className="p-0 relative z-10">
          <div className="p-6 space-y-5">
            {/* Header with title and destination */}
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300">
                    {trip.name}
                  </h3>
                  {trip.destination && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPinIcon className="h-4 w-4 text-primary/70" />
                      <span className="text-sm font-medium">{trip.destination}</span>
                    </div>
                  )}
                </div>

                {/* Status badge */}
                <Badge
                  variant="outline"
                  className="text-xs px-3 py-1 h-6 flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: `${statusInfo.color}15`,
                    color: statusInfo.color,
                    borderColor: `${statusInfo.color}40`
                  }}
                >
                  {statusInfo.icon}
                  <span className="font-medium">{statusInfo.text}</span>
                </Badge>
              </div>

              {/* Description */}
              {trip.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {trip.description}
                </p>
              )}
            </div>

            {/* Dates Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-border/30">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getDuration(trip.start_date, trip.end_date)}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-border/30">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(trip.created_at), 'MMM d')}
                </span>
              </div>
              <div className="flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <span>View trip</span>
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
