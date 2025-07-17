'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { 
  MapPinIcon, 
  CalendarIcon, 
  ClockIcon,
  ArrowRightIcon,
  StarIcon,
  HeartIcon,
  ShareIcon,
  MoreHorizontalIcon,
  PlayIcon,
  PauseIcon
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

interface InteractiveTripCardProps {
  trip: Trip;
  viewMode?: 'grid';
  index?: number;
}

export default function InteractiveTripCard({ trip, viewMode = 'grid', index = 0 }: InteractiveTripCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  };

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
    if (!trip.start_date || !trip.end_date) return {
      text: 'Planning',
      color: 'from-blue-500 to-cyan-500',
      emoji: '📋',
      textColor: 'text-blue-700',
      bgSolid: 'bg-blue-100',
      dotColor: 'bg-blue-500',
      shadowColor: 'shadow-blue-500/20',
      glowColor: 'shadow-blue-400/30',
      cardEffect: '',
      pulseColor: 'animate-pulse'
    };

    const now = new Date();
    const start = parseISO(trip.start_date);
    const end = parseISO(trip.end_date);

    if (now < start) return {
      text: 'Upcoming',
      color: 'from-emerald-500 to-teal-500',
      emoji: '🚀',
      textColor: 'text-emerald-700',
      bgSolid: 'bg-emerald-100',
      dotColor: 'bg-emerald-500',
      shadowColor: 'shadow-emerald-500/20',
      glowColor: 'shadow-emerald-400/40',
      cardEffect: 'ring-2 ring-emerald-200/50 ring-offset-2',
      pulseColor: 'animate-bounce'
    };
    if (now >= start && now <= end) return {
      text: 'Ongoing',
      color: 'from-orange-500 to-red-500',
      emoji: '✈️',
      textColor: 'text-orange-700',
      bgSolid: 'bg-orange-100',
      dotColor: 'bg-orange-500',
      shadowColor: 'shadow-orange-500/30',
      glowColor: 'shadow-orange-400/50',
      cardEffect: 'ring-2 ring-orange-300/60 ring-offset-2 animate-pulse',
      pulseColor: 'animate-ping'
    };
    return {
      text: 'Completed',
      color: 'from-purple-500 to-pink-500',
      emoji: '✅',
      textColor: 'text-purple-700',
      bgSolid: 'bg-purple-100',
      dotColor: 'bg-purple-500',
      shadowColor: 'shadow-purple-500/15',
      glowColor: 'shadow-purple-400/20',
      cardEffect: 'opacity-75 saturate-50 contrast-75',
      pulseColor: ''
    };
  };

  const getDuration = () => {
    if (!trip.start_date || !trip.end_date) return null;
    try {
      const start = parseISO(trip.start_date);
      const end = parseISO(trip.end_date);
      const days = differenceInDays(end, start) + 1;
      return `${days} giorn${days !== 1 ? 'i' : 'o'}`;
    } catch {
      return null;
    }
  };

  const status = getStatus();
  const duration = getDuration();

  // Generate dynamic colors based on trip name
  const getCardGradient = () => {
    const gradients = [
      'from-violet-600 via-purple-600 to-blue-600',
      'from-cyan-500 via-blue-500 to-indigo-600',
      'from-emerald-500 via-teal-500 to-cyan-600',
      'from-orange-500 via-red-500 to-pink-600',
      'from-pink-500 via-rose-500 to-red-600',
      'from-indigo-500 via-purple-500 to-pink-600'
    ];
    const hash = trip.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  if (false) { // Removed list view mode
    return (
      <Link href={`/trips/${trip.id}`} className="block group">
        <div
          ref={cardRef}
          className={cn(
            "relative flex items-center gap-3 sm:gap-6 p-3 sm:p-6 bg-card rounded-xl transition-all duration-300 overflow-hidden",
            "shadow-lg hover:shadow-xl",
            status.shadowColor,
            status.cardEffect,
            isHovered && status.glowColor
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Gradient background overlay */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r opacity-5 transition-all duration-300",
            status.bgSolid,
            isHovered && "opacity-10"
          )} />

          {/* Floating status indicator */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full shadow-lg",
              status.dotColor,
              status.pulseColor
            )} />
          </div>

          {/* Shimmer effect for ongoing trips */}
          {status.text === 'Ongoing' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          )}

          {/* Icon Section with magical effects */}
          <div className={cn(
            "relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-xl transition-all duration-300 flex-shrink-0",
            getCardGradient(),
            status.shadowColor,
            isHovered && "scale-110 rotate-3",
            status.text === 'Ongoing' && "animate-pulse"
          )}>
            <MapPinIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />

            {/* Floating status emoji with glow */}
            <div className={cn(
              "absolute -bottom-1 -right-1 text-lg sm:text-xl bg-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center shadow-lg transition-all duration-300",
              status.text === 'Upcoming' && "animate-bounce",
              status.text === 'Ongoing' && "animate-ping",
              isHovered && "scale-110"
            )}>
              {status.emoji}
            </div>

            {/* Glow ring for special states */}
            {(status.text === 'Upcoming' || status.text === 'Ongoing') && (
              <div className={cn(
                "absolute inset-0 rounded-xl opacity-50 transition-all duration-300",
                status.text === 'Upcoming' && "ring-2 ring-emerald-300 animate-pulse",
                status.text === 'Ongoing' && "ring-2 ring-orange-300 animate-ping"
              )} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 sm:mb-3">
              <h3 className="text-lg sm:text-xl font-bold text-foreground truncate group-hover:text-primary transition-colors mb-1 sm:mb-0">
                {trip.name}
              </h3>
              <div className="flex items-center gap-2">
                <Badge className={cn(
                  "text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300",
                  status.bgSolid,
                  status.textColor,
                  "border border-white/20",
                  isHovered && "scale-105 shadow-xl",
                  status.text === 'Ongoing' && "animate-pulse"
                )}>
                  <span className={cn(
                    "mr-1.5 transition-all duration-300",
                    status.text === 'Upcoming' && "animate-bounce",
                    status.text === 'Ongoing' && "animate-pulse"
                  )}>
                    {status.emoji}
                  </span>
                  <span className="hidden sm:inline">{status.text}</span>
                  <span className="sm:hidden">{status.text.split(' ')[0]}</span>
                </Badge>
              </div>
            </div>

            {trip.destination && (
              <p className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
                <MapPinIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                <span className="truncate">{trip.destination}</span>
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">
                  <span className="sm:hidden">{formatDate(trip.start_date)}</span>
                  <span className="hidden sm:inline">{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
                </span>
              </span>
              {duration && (
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  {duration}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsLiked(!isLiked);
              }}
              className={cn(
                "p-1.5 sm:p-2 rounded-full transition-all duration-200",
                isLiked ? "bg-red-100 text-red-500" : "bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-500"
              )}
            >
              <HeartIcon className={cn("h-3 w-3 sm:h-4 sm:w-4", isLiked && "fill-current")} />
            </button>

            <ArrowRightIcon className={cn(
              "h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-all duration-200",
              isHovered ? "text-primary translate-x-1" : ""
            )} />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/trips/${trip.id}`} className="block group">
      <div
        ref={cardRef}
        className={cn(
          "relative bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden",
          "hover:scale-[1.02] hover:-translate-y-1",
          status.shadowColor,
          status.cardEffect,
          isHovered && status.glowColor
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Magical gradient background */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-5 transition-all duration-500",
          status.bgSolid,
          isHovered && "opacity-15"
        )} />

        {/* Floating orb indicator */}
        <div className="absolute top-3 right-3 z-10">
          <div className={cn(
            "w-3 h-3 rounded-full shadow-lg",
            status.dotColor,
            status.pulseColor
          )} />
        </div>

        {/* Shimmer effect for ongoing trips */}
        {status.text === 'Ongoing' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        )}

        {/* Header with gradient */}
        <div className={cn(
          "relative h-24 sm:h-32 bg-gradient-to-br overflow-hidden",
          getCardGradient()
        )}>

          {/* Floating Status Badge */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
            <Badge className={cn(
              "text-xs font-bold px-3 py-1.5 rounded-full shadow-xl backdrop-blur-md transition-all duration-300",
              status.bgSolid,
              status.textColor,
              "border border-white/30",
              isHovered && "scale-105 shadow-2xl",
              status.text === 'Ongoing' && "animate-pulse"
            )}>
              <span className={cn(
                "mr-1.5 transition-all duration-300",
                status.text === 'Upcoming' && "animate-bounce",
                status.text === 'Ongoing' && "animate-pulse"
              )}>
                {status.emoji}
              </span>
              <span className="hidden sm:inline">{status.text}</span>
              <span className="sm:hidden">{status.text.split(' ')[0]}</span>
            </Badge>
          </div>

          {/* Action Button */}
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsLiked(!isLiked);
              }}
              className={cn(
                "p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all duration-200",
                isLiked ? "bg-red-500/20 text-red-400" : "bg-white/20 text-white hover:bg-white/30"
              )}
            >
              <HeartIcon className={cn("h-3 w-3 sm:h-4 sm:w-4", isLiked && "fill-current")} />
            </button>
          </div>

          {/* Magical Central Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "relative w-10 h-10 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center transition-all duration-500 shadow-xl",
              isHovered && "scale-125 rotate-6",
              status.text === 'Ongoing' && "animate-pulse"
            )}>
              <MapPinIcon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />

              {/* Magical glow rings */}
              {(status.text === 'Upcoming' || status.text === 'Ongoing') && (
                <>
                  <div className={cn(
                    "absolute -inset-2 rounded-xl opacity-40 transition-all duration-300",
                    status.text === 'Upcoming' && "ring-2 ring-emerald-300 animate-pulse",
                    status.text === 'Ongoing' && "ring-2 ring-orange-300 animate-ping"
                  )} />
                  <div className={cn(
                    "absolute -inset-4 rounded-xl opacity-20 transition-all duration-500",
                    status.text === 'Upcoming' && "ring-1 ring-emerald-200 animate-pulse",
                    status.text === 'Ongoing' && "ring-1 ring-orange-200 animate-ping"
                  )} />
                </>
              )}

              {/* Floating status emoji with magical effects */}
              <div className={cn(
                "absolute -bottom-1 -right-1 text-sm sm:text-base bg-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow-xl transition-all duration-300",
                status.text === 'Upcoming' && "animate-bounce",
                status.text === 'Ongoing' && "animate-ping",
                isHovered && "scale-125"
              )}>
                {status.emoji}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1 sm:mb-2 group-hover:text-primary transition-colors line-clamp-1">
              {trip.name}
            </h3>

            {trip.destination && (
              <p className="text-muted-foreground flex items-center gap-2 mb-2 text-sm">
                <MapPinIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                <span className="truncate">{trip.destination}</span>
              </p>
            )}

            {trip.description && (
              <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 leading-relaxed hidden sm:block">
                {trip.description}
              </p>
            )}
          </div>

          {/* Date Info */}
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">{formatDate(trip.start_date)}</span>
                <span className="hidden sm:inline">{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
              </span>
            </div>

            {duration && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                <span>{duration}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 sm:pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              <span className="hidden sm:inline">Created </span>{format(parseISO(trip.created_at), 'dd MMM')}
            </div>

            <div className={cn(
              "flex items-center gap-1 sm:gap-2 text-primary text-xs sm:text-sm font-medium transition-all duration-200",
              isHovered ? "translate-x-1" : ""
            )}>
              <span>Explore</span>
              <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </div>
        </div>


      </div>
    </Link>
  );
}
