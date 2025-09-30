'use client';

import { useState, memo } from 'react';
import { format, parseISO } from 'date-fns';
import { Transportation } from '@/lib/features/transportationSlice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  DollarSignIcon,
  EditIcon,
  EyeIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface TransportationCardProps {
  transportation: Transportation;
  onView: (transportation: Transportation) => void;
  onEdit?: (transportation: Transportation) => void;
  canEdit?: boolean;
  getIcon: (type: string) => JSX.Element;
}

function TransportationCard({
  transportation,
  onView,
  onEdit,
  canEdit = false,
  getIcon
}: TransportationCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusBadgeVariant = (status: string | null) => {
    if (!status) return 'outline';
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'var(--border)';
    switch (status) {
      case 'confirmed': return 'var(--success)';
      case 'pending': return 'var(--warning)';
      case 'cancelled': return 'var(--destructive)';
      default: return 'var(--border)';
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return 'Not specified';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div
      className="glass-card rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-500 md:hover:scale-[1.02] hover:-translate-y-1 transportation-card-mobile w-full max-w-full box-border"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Modern Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

      {/* Status Border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300"
        style={{ backgroundColor: isHovered ? 'var(--primary)' : getStatusColor(transportation.status) }}
      ></div>

      <div className="relative z-10 p-4 md:p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                {getIcon(transportation.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-sky-500 transition-colors duration-300 truncate">
                  {transportation.provider || transportation.type.charAt(0).toUpperCase() + transportation.type.slice(1)}
                </h3>
                {transportation.booking_reference && (
                  <p className="text-xs text-muted-foreground truncate">
                    Ref: {transportation.booking_reference}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {transportation.status && (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeVariant(transportation.status) === 'success' ? 'bg-green-500/20 text-green-600 border-green-500/30' : 'bg-sky-500/20 text-sky-600 border-sky-500/30'}`}>
                  {getStatusLabel(transportation.status)}
                </span>
              )}

              {transportation.documents && transportation.documents.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-600 border border-indigo-500/30">
                  {transportation.documents.length} document{transportation.documents.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {transportation.cost !== null && (
            <div className="flex-shrink-0 sm:text-right sm:ml-4">
              <div className="glass-info-card px-3 py-1.5 rounded-xl">
                <p className="text-sm font-bold text-foreground">
                  {formatCurrency(transportation.cost, transportation.currency)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Travel Information Section */}
        <div className="space-y-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Departure Info */}
            <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10 w-full min-w-0">
              <h4 className="text-xs uppercase text-muted-foreground font-semibold mb-3 flex items-center">
                <div className="p-1 rounded-lg bg-green-500/20 mr-2 flex-shrink-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                Departure
              </h4>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="p-1 rounded-lg bg-blue-500/20 flex-shrink-0">
                    <CalendarIcon className="h-3 w-3 text-blue-500" />
                  </div>
                  {transportation.departure_time ? (
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{format(parseISO(transportation.departure_time), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(transportation.departure_time), 'HH:mm')}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                </div>

                <div className="flex items-center space-x-2 min-w-0">
                  <div className="p-1 rounded-lg bg-purple-500/20 flex-shrink-0">
                    <MapPinIcon className="h-3 w-3 text-purple-500" />
                  </div>
                  {transportation.departure_location ? (
                    <p className="text-sm font-medium text-foreground truncate flex-1 min-w-0">{transportation.departure_location}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                </div>
              </div>
            </div>

            {/* Arrival Info */}
            <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10 w-full min-w-0">
              <h4 className="text-xs uppercase text-muted-foreground font-semibold mb-3 flex items-center">
                <div className="p-1 rounded-lg bg-red-500/20 mr-2 flex-shrink-0">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                Arrival
              </h4>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="p-1 rounded-lg bg-blue-500/20 flex-shrink-0">
                    <CalendarIcon className="h-3 w-3 text-blue-500" />
                  </div>
                  {transportation.arrival_time ? (
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{format(parseISO(transportation.arrival_time), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(transportation.arrival_time), 'HH:mm')}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                </div>

                <div className="flex items-center space-x-2 min-w-0">
                  <div className="p-1 rounded-lg bg-purple-500/20 flex-shrink-0">
                    <MapPinIcon className="h-3 w-3 text-purple-500" />
                  </div>
                  {transportation.arrival_location ? (
                    <p className="text-sm font-medium text-foreground truncate flex-1 min-w-0">{transportation.arrival_location}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex justify-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(transportation);
              }}
              className="glass-button flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105"
            >
              <EyeIcon className="h-4 w-4 mr-1.5" />
              View
            </button>

            {canEdit && onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(transportation);
                }}
                className="glass-button-primary flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                <EditIcon className="h-4 w-4 mr-1.5" />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(TransportationCard);
