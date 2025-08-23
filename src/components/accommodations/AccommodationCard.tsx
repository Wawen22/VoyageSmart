'use client';

import { memo } from 'react';
import { Accommodation } from '@/lib/features/accommodationSlice';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import {
  Building2Icon,
  CalendarIcon,
  MapPinIcon,
  FileIcon,
  EyeIcon,
  EditIcon
} from 'lucide-react';

interface AccommodationCardProps {
  accommodation: Accommodation;
  onView: (accommodation: Accommodation) => void;
  onEdit: (accommodation: Accommodation) => void;
  canEdit: boolean;
}

function AccommodationCard({
  accommodation,
  onView,
  onEdit,
  canEdit
}: AccommodationCardProps) {
  const getAccommodationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      hotel: 'Hotel',
      apartment: 'Apartment',
      hostel: 'Hostel',
      house: 'House',
      villa: 'Villa',
      resort: 'Resort',
      camping: 'Camping',
      other: 'Other',
    };
    return types[type] || type;
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return '';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-500 md:hover:scale-[1.02] hover:-translate-y-1 accommodation-card-mobile w-full box-border">
      {/* Modern Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

      <div className="relative z-10 p-4 md:p-6 w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-3 mb-4 w-full">
          <div className="flex items-center space-x-3 w-full min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
              <Building2Icon className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base text-foreground group-hover:text-emerald-500 transition-colors duration-300 truncate">
                {accommodation.name}
              </h3>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
            {accommodation.type && (
              <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 flex-shrink-0">
                {getAccommodationTypeLabel(accommodation.type)}
              </div>
            )}

            {accommodation.cost !== null && (
              <div className="flex-shrink-0">
                <div className="glass-info-card px-3 py-1.5 rounded-xl">
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(accommodation.cost, accommodation.currency)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Information Sections */}
        <div className="space-y-3 w-full">
          {/* Dates */}
          {(accommodation.check_in_date || accommodation.check_out_date) && (
            <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10 w-full min-w-0">
              <div className="flex flex-col space-y-2">
                {accommodation.check_in_date && (
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="p-1 rounded-lg bg-blue-500/20 flex-shrink-0">
                      <CalendarIcon className="h-3 w-3 text-blue-500" />
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">Check-in:</span>
                    <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                      {format(parseISO(accommodation.check_in_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}

                {accommodation.check_out_date && (
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="p-1 rounded-lg bg-orange-500/20 flex-shrink-0">
                      <CalendarIcon className="h-3 w-3 text-orange-500" />
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">Check-out:</span>
                    <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                      {format(parseISO(accommodation.check_out_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address */}
          {accommodation.address && (
            <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10 w-full min-w-0">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="p-1 rounded-lg bg-purple-500/20 flex-shrink-0">
                  <MapPinIcon className="h-3 w-3 text-purple-500" />
                </div>
                <p className="text-sm text-foreground truncate flex-1 min-w-0">{accommodation.address}</p>
              </div>
            </div>
          )}

          {/* Documents */}
          {accommodation.documents && accommodation.documents.length > 0 && (
            <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10 w-full min-w-0">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="p-1 rounded-lg bg-amber-500/20 flex-shrink-0">
                  <FileIcon className="h-3 w-3 text-amber-500" />
                </div>
                <p className="text-sm text-foreground truncate flex-1 min-w-0">
                  {accommodation.documents.length} document{accommodation.documents.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => onView(accommodation)}
              className="glass-button flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105"
            >
              <EyeIcon className="h-4 w-4 mr-1.5" />
              View
            </button>

            {canEdit && (
              <button
                onClick={() => onEdit(accommodation)}
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
export default memo(AccommodationCard);
