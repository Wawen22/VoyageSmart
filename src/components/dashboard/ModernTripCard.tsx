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
  UsersIcon,
  CameraIcon,
  HeartIcon
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
  viewMode?: 'grid' | 'list';
  index?: number;
}

export default function ModernTripCard({ trip, viewMode = 'grid', index = 0 }: ModernTripCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date TBD';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
    } catch {
      return 'Invalid date';
    }
  };

  const getStatus = () => {
    if (!trip.start_date || !trip.end_date) return { text: 'Planning', color: 'blue', icon: ClockIcon };
    
    const now = new Date();
    const start = parseISO(trip.start_date);
    const end = parseISO(trip.end_date);
    
    if (now < start) return { text: 'Upcoming', color: 'emerald', icon: CalendarIcon };
    if (now >= start && now <= end) return { text: 'Active', color: 'orange', icon: StarIcon };
    return { text: 'Completed', color: 'purple', icon: CameraIcon };
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
  const StatusIcon = status.icon;

  // Generate a beautiful gradient based on trip name
  const getGradient = () => {
    const gradients = [
      'from-blue-400 via-purple-500 to-pink-500',
      'from-emerald-400 via-teal-500 to-blue-500',
      'from-orange-400 via-red-500 to-pink-500',
      'from-purple-400 via-indigo-500 to-blue-500',
      'from-green-400 via-emerald-500 to-teal-500',
      'from-yellow-400 via-orange-500 to-red-500'
    ];
    const hash = trip.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  if (viewMode === 'list') {
    return (
      <Link href={`/trips/${trip.id}`} className="block group">
        <div 
          className={cn(
            "relative flex items-center gap-6 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-200 dark:border-slate-700",
            "hover:scale-[1.02] hover:-translate-y-1"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Image/Gradient Section */}
          <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
            <div className={cn("absolute inset-0 bg-gradient-to-br", getGradient())} />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPinIcon className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                {trip.name}
              </h3>
              <Badge 
                variant="outline" 
                className={cn(
                  "ml-2 flex-shrink-0",
                  status.color === 'blue' && "border-blue-200 bg-blue-50 text-blue-700",
                  status.color === 'emerald' && "border-emerald-200 bg-emerald-50 text-emerald-700",
                  status.color === 'orange' && "border-orange-200 bg-orange-50 text-orange-700",
                  status.color === 'purple' && "border-purple-200 bg-purple-50 text-purple-700"
                )}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.text}
              </Badge>
            </div>

            {trip.destination && (
              <p className="text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" />
                {trip.destination}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
              {duration && <span>• {duration}</span>}
            </div>
          </div>

          {/* Arrow */}
          <ArrowRightIcon className={cn(
            "h-5 w-5 text-slate-400 transition-all duration-300",
            isHovered ? "text-blue-600 translate-x-1" : ""
          )} />
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/trips/${trip.id}`} className="block group">
      <div 
        className={cn(
          "relative bg-white dark:bg-slate-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-200 dark:border-slate-700",
          "hover:scale-[1.03] hover:-translate-y-2"
        )}
        style={{ animationDelay: `${index * 100}ms` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header with gradient background */}
        <div className="relative h-32 overflow-hidden">
          <div className={cn("absolute inset-0 bg-gradient-to-br", getGradient())} />
          <div className="absolute inset-0 bg-black/10" />
          
          {/* Floating elements */}
          <div className="absolute top-4 left-4">
            <Badge 
              className={cn(
                "backdrop-blur-sm border-white/20",
                status.color === 'blue' && "bg-blue-500/90 text-white",
                status.color === 'emerald' && "bg-emerald-500/90 text-white",
                status.color === 'orange' && "bg-orange-500/90 text-white",
                status.color === 'purple' && "bg-purple-500/90 text-white"
              )}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.text}
            </Badge>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              setIsLiked(!isLiked);
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200"
          >
            <HeartIcon className={cn(
              "h-4 w-4 transition-all duration-200",
              isLiked ? "fill-red-500 text-red-500" : "text-white"
            )} />
          </button>

          {/* Decorative elements */}
          <div className="absolute bottom-0 right-0 w-32 h-32 opacity-20">
            <MapPinIcon className="w-full h-full text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
              {trip.name}
            </h3>
            
            {trip.destination && (
              <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-2">
                <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{trip.destination}</span>
              </p>
            )}

            {trip.description && (
              <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed">
                {trip.description}
              </p>
            )}
          </div>

          {/* Date and Duration */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDate(trip.start_date)}</span>
              <ArrowRightIcon className="h-3 w-3" />
              <span>{formatDate(trip.end_date)}</span>
            </div>
            
            {duration && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <ClockIcon className="h-4 w-4" />
                <span>{duration}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Created {format(parseISO(trip.created_at), 'MMM d')}</span>
            </div>
            
            <div className={cn(
              "flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-medium transition-all duration-300",
              isHovered ? "translate-x-1" : ""
            )}>
              <span>Explore</span>
              <ArrowRightIcon className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Hover overlay */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-blue-600/5 to-transparent opacity-0 transition-opacity duration-300 pointer-events-none",
          isHovered ? "opacity-100" : ""
        )} />
      </div>
    </Link>
  );
}
