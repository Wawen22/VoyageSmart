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

  const isUpcoming = () => {
    if (!trip.start_date) return false;
    try {
      const startDate = parseISO(trip.start_date);
      return isValid(startDate) && startDate > new Date();
    } catch (error) {
      return false;
    }
  };

  const isPast = () => {
    if (!trip.end_date) return false;
    try {
      const endDate = parseISO(trip.end_date);
      return isValid(endDate) && endDate < new Date();
    } catch (error) {
      return false;
    }
  };

  const getStatusColor = () => {
    if (isUpcoming()) return 'var(--primary)';
    if (isPast()) return 'var(--muted)';
    return 'var(--border)';
  };

  const getDaysUntil = () => {
    if (!trip.start_date) return null;
    try {
      const startDate = parseISO(trip.start_date);
      if (!isValid(startDate)) return null;

      const today = new Date();
      const diffTime = startDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return null;
      return diffDays;
    } catch (error) {
      return null;
    }
  };

  const daysUntil = getDaysUntil();

  // Function to determine if a trip is in progress (between start and end dates)
  const isInProgress = () => {
    if (!trip.start_date || !trip.end_date) return false;
    try {
      const startDate = parseISO(trip.start_date);
      const endDate = parseISO(trip.end_date);
      const today = new Date();
      return isValid(startDate) && isValid(endDate) &&
             startDate <= today && endDate >= today;
    } catch (error) {
      return false;
    }
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
        className="overflow-hidden transition-all duration-300 h-full hover:scale-[1.02] hover:shadow-lg relative bg-card/80 backdrop-blur-sm border border-border/50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Status indicator */}
        <div
          className="absolute top-0 left-0 w-full h-1 transition-all duration-300 group-hover:h-1.5"
          style={{ backgroundColor: statusInfo.color }}
        />

        {/* Ripple effect overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md">
          <div
            className={`absolute bg-primary/5 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-700 ease-in-out ${isHovered ? 'scale-[4]' : 'scale-0'}`}
            style={{
              top: '50%',
              left: '50%',
              width: '100px',
              height: '100px',
              opacity: isHovered ? 0.8 : 0
            }}
          />
        </div>

        <CardContent className="p-0">
          <div className="p-5 space-y-4">
            {/* Header with title and status */}
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300">{trip.name}</h3>

                {/* Status badge - always visible */}
                <div className="flex items-center mt-1">
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-0 h-5 flex items-center gap-1 transition-all duration-300"
                    style={{
                      backgroundColor: `${statusInfo.color}10`,
                      color: statusInfo.color,
                      borderColor: `${statusInfo.color}30`
                    }}
                  >
                    {statusInfo.icon}
                    <span>{statusInfo.text}</span>
                  </Badge>

                  {/* Premium indicators */}
                  <div className="flex gap-1 ml-2">
                    <PremiumIndicator feature="accommodations" variant="icon" size="sm" />
                    <PremiumIndicator feature="transportation" variant="icon" size="sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Destination */}
            {trip.destination && (
              <div className="flex items-center text-sm">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                  <MapPinIcon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-foreground line-clamp-1">{trip.destination}</span>
              </div>
            )}

            {/* Dates */}
            <div className="flex items-center text-sm">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                <CalendarIcon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-muted-foreground">
                {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
              </span>
            </div>

            {/* Description */}
            {trip.description && (
              <div className="bg-muted/30 rounded-md p-3 mt-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {trip.description}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 mt-auto flex justify-between items-center border-t border-border">
              <span className="text-xs text-muted-foreground">
                Created {format(parseISO(trip.created_at), 'MMM d, yyyy')}
              </span>
              <div className="flex items-center text-primary text-sm font-medium group/btn">
                <span className="relative">
                  <span className="transition-all duration-300 group-hover/btn:pr-1">View details</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover/btn:w-full"></span>
                </span>
                <ArrowRightIcon className="h-4 w-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
