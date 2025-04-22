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

  return (
    <Link href={`/trips/${trip.id}`} className="block h-full">
      <Card
        className="overflow-hidden hover:shadow-md transition-all duration-300 h-full hover:scale-[1.02] border-l-4 hover-lift relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          borderLeftColor: isHovered ? 'var(--primary)' : getStatusColor()
        }}
      >
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
          <div className="p-4 space-y-3">
            {/* Header with title and status */}
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-foreground line-clamp-1">{trip.name}</h3>
              {daysUntil !== null && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  In {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
                </Badge>
              )}
              {isPast() && (
                <Badge variant="outline" className="bg-muted text-muted-foreground">
                  Completed
                </Badge>
              )}
            </div>

            {/* Destination */}
            {trip.destination && (
              <div className="flex items-center text-sm">
                <MapPinIcon className="h-4 w-4 mr-2 text-primary" />
                <span className="text-foreground line-clamp-1">{trip.destination}</span>
              </div>
            )}

            {/* Dates */}
            <div className="flex items-center text-sm">
              <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
              <span className="text-muted-foreground">
                {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
              </span>
            </div>

            {/* Description */}
            {trip.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                {trip.description}
              </p>
            )}

            {/* Footer */}
            <div className="pt-3 mt-auto flex justify-between items-center border-t border-border">
              <span className="text-xs text-muted-foreground">
                Created {format(parseISO(trip.created_at), 'MMM d, yyyy')}
              </span>
              <div className="flex items-center text-primary text-sm font-medium group">
                <span className="relative">
                  <span className="transition-all duration-300 group-hover:pr-1">View details</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
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
