'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MapPin,
  Clock,
  DollarSign,
  FileText,
  Edit,
  Trash,
  Landmark,
  Utensils,
  ShoppingBag,
  Palmtree,
  Music,
  Mountain,
  Compass,
  Ticket,
  Star,
  Info,
  Calendar,
  ExternalLink
} from 'lucide-react';

// Type for the activity
type GeneratedActivity = {
  name: string;
  type: string;
  start_time: string;
  end_time: string;
  location: string;
  booking_reference?: string;
  priority: number;
  cost?: number;
  currency?: string;
  notes?: string;
  status: string;
  day_id: string;
  day_date: string;
};

interface ActivityPreviewCardProps {
  activity: GeneratedActivity;
  onEdit?: (activity: GeneratedActivity) => void;
  onRemove?: (activity: GeneratedActivity) => void;
  showActions?: boolean;
}

export default function ActivityPreviewCard({
  activity,
  onEdit,
  onRemove,
  showActions = true
}: ActivityPreviewCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Format time from ISO string to HH:MM
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Rome' // Ensure Italian timezone
      });
    } catch (e) {
      return timeString;
    }
  };

  // Get icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sightseeing':
        return <Landmark className="h-5 w-5" />;
      case 'food':
        return <Utensils className="h-5 w-5" />;
      case 'shopping':
        return <ShoppingBag className="h-5 w-5" />;
      case 'nature':
        return <Palmtree className="h-5 w-5" />;
      case 'culture':
        return <Landmark className="h-5 w-5" />;
      case 'relax':
        return <Palmtree className="h-5 w-5" />;
      case 'entertainment':
        return <Music className="h-5 w-5" />;
      case 'sport':
      case 'adventure':
        return <Mountain className="h-5 w-5" />;
      default:
        return <Compass className="h-5 w-5" />;
    }
  };

  // Get color based on activity type
  const getActivityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sightseeing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'food':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'shopping':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
      case 'nature':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'culture':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'relax':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
      case 'entertainment':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'sport':
      case 'adventure':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Get priority label
  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return 'Alta';
      case 2:
        return 'Media';
      case 3:
      default:
        return 'Bassa';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 2:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 3:
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  // Format currency
  const formatCurrency = (amount: number | undefined, currency: string = 'EUR') => {
    if (amount === undefined) return null;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Calcola la durata dell'attività
  const calculateDuration = () => {
    if (!activity.start_time || !activity.end_time) return null;

    try {
      const start = new Date(activity.start_time);
      const end = new Date(activity.end_time);
      const durationMs = end.getTime() - start.getTime();
      const durationMinutes = Math.round(durationMs / 60000);

      if (durationMinutes < 60) {
        return `${durationMinutes} min`;
      } else {
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
    } catch (e) {
      return null;
    }
  };

  // Genera un link a Google Maps per la posizione
  const getGoogleMapsLink = () => {
    if (!activity.location) return null;
    const query = encodeURIComponent(activity.location);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  // Durata dell'attività
  const duration = calculateDuration();

  // Link a Google Maps
  const mapsLink = getGoogleMapsLink();

  return (
    <TooltipProvider>
      <Card
        className={`mb-3 border-l-4 transition-all duration-300 hover:scale-[1.01] ${isHovered ? 'shadow-md' : 'shadow-sm'}`}
        style={{ borderLeftColor: activity.priority === 1 ? '#ef4444' : activity.priority === 2 ? '#f97316' : '#3b82f6' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-3">
          {/* Header con icona, nome e priorità */}
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-2">
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div>
                <h4 className="font-medium text-sm">{activity.name}</h4>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                  {activity.start_time && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3 mr-0.5 text-muted-foreground" />
                          {formatTime(activity.start_time)}
                          {activity.end_time && ` - ${formatTime(activity.end_time)}`}
                          {duration && ` (${duration})`}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Orario attività</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {activity.location && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center text-[10px] text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-0.5 text-muted-foreground" />
                          <span className="truncate max-w-[120px]">{activity.location}</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Posizione</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className={`text-[10px] px-1.5 py-0.5 ${getPriorityColor(activity.priority)}`}>
                  {getPriorityLabel(activity.priority)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-xs">Priorità: {getPriorityLabel(activity.priority)}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Note dell'attività */}
          {activity.notes && (
            <div className="mt-2 bg-muted/30 p-1.5 rounded-sm">
              <p className="text-[11px] text-muted-foreground line-clamp-2">{activity.notes}</p>
            </div>
          )}

          {/* Footer con costo, riferimento e azioni */}
          <div className="mt-2 pt-1.5 border-t border-border flex justify-between items-center">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {activity.cost !== undefined && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center">
                      <DollarSign className="h-3 w-3 mr-0.5" />
                      {formatCurrency(activity.cost, activity.currency)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Costo stimato</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {activity.booking_reference && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center">
                      <Ticket className="h-3 w-3 mr-0.5" />
                      <span className="truncate max-w-[60px]">{activity.booking_reference}</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Riferimento prenotazione</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {mapsLink && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Apri in Google Maps</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {showActions && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-primary hover:bg-primary/10 transition-colors"
                        onClick={() => onEdit(activity)}
                        aria-label="Edit activity"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Modifica attività</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {onRemove && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => onRemove(activity)}
                        aria-label="Remove activity"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Rimuovi attività</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
