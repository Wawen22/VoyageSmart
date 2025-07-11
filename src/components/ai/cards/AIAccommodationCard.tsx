'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2Icon,
  CalendarIcon,
  MapPinIcon,
  DollarSignIcon,
  PhoneIcon,
  FileIcon,
  StarIcon
} from 'lucide-react';
import { formatDateLocal, formatCurrency } from '@/lib/utils';

interface Accommodation {
  id?: string;
  name: string;
  type?: string;
  check_in_date?: string;
  check_out_date?: string;
  address?: string;
  contact_info?: string;
  cost?: number;
  currency?: string;
  rating?: number;
  documents?: any[];
  notes?: string;
}

interface AIAccommodationCardProps {
  accommodation: Accommodation;
  compact?: boolean;
}

export default function AIAccommodationCard({ accommodation, compact = false }: AIAccommodationCardProps) {
  const getAccommodationIcon = (type: string | undefined) => {
    const iconClass = "h-4 w-4";
    if (!type) return <Building2Icon className={iconClass} />;
    
    switch (type.toLowerCase()) {
      case 'hotel':
        return <Building2Icon className={iconClass} />;
      case 'apartment':
      case 'airbnb':
        return <Building2Icon className={iconClass} />;
      case 'hostel':
        return <Building2Icon className={iconClass} />;
      case 'resort':
        return <Building2Icon className={iconClass} />;
      default:
        return <Building2Icon className={iconClass} />;
    }
  };

  const getAccommodationTypeLabel = (type: string | undefined) => {
    if (!type) return 'Alloggio';
    
    switch (type.toLowerCase()) {
      case 'hotel': return 'Hotel';
      case 'apartment': return 'Appartamento';
      case 'airbnb': return 'Airbnb';
      case 'hostel': return 'Ostello';
      case 'resort': return 'Resort';
      case 'bed_and_breakfast': return 'B&B';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Europe/Rome'
      });
    } catch (e) {
      return dateString;
    }
  };

  const calculateNights = () => {
    if (!accommodation.check_in_date || !accommodation.check_out_date) return null;
    
    try {
      const checkIn = new Date(accommodation.check_in_date);
      const checkOut = new Date(accommodation.check_out_date);
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      return null;
    }
  };

  const nights = calculateNights();

  return (
    <Card className="overflow-hidden border-l-4 border-l-primary/60 hover:shadow-md transition-all duration-200">
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                {getAccommodationIcon(accommodation.type)}
              </div>
              <div>
                <h4 className="font-medium text-sm line-clamp-1">
                  {accommodation.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {getAccommodationTypeLabel(accommodation.type)}
                  </Badge>
                  {accommodation.rating && (
                    <div className="flex items-center gap-1">
                      <StarIcon className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-muted-foreground">
                        {accommodation.rating}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {accommodation.cost !== null && accommodation.cost !== undefined && (
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatCurrency(accommodation.cost, accommodation.currency || 'EUR')}
                </p>
                {nights && (
                  <p className="text-xs text-muted-foreground">
                    {nights} nott{nights === 1 ? 'e' : 'i'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-2">
            {accommodation.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPinIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">
                  {accommodation.address}
                </span>
              </div>
            )}

            {(accommodation.check_in_date || accommodation.check_out_date) && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">
                  {accommodation.check_in_date && formatDate(accommodation.check_in_date)}
                  {accommodation.check_in_date && accommodation.check_out_date && ' - '}
                  {accommodation.check_out_date && formatDate(accommodation.check_out_date)}
                </span>
              </div>
            )}

            {accommodation.contact_info && (
              <div className="flex items-center gap-2 text-sm">
                <PhoneIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground text-xs">
                  {accommodation.contact_info}
                </span>
              </div>
            )}

            {accommodation.documents && accommodation.documents.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <FileIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground text-xs">
                  {accommodation.documents.length} documento{accommodation.documents.length !== 1 ? 'i' : ''}
                </span>
              </div>
            )}

            {accommodation.notes && (
              <div className="bg-muted/30 rounded p-2 mt-2">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {accommodation.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
