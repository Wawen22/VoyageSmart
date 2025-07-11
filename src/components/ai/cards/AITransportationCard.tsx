'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PlaneTakeoffIcon,
  TrainIcon,
  BusIcon,
  CarIcon,
  ShipIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  DollarSignIcon
} from 'lucide-react';
import { formatTimeLocal, formatCurrency } from '@/lib/utils';

interface Transportation {
  id?: string;
  type: string;
  provider?: string;
  booking_reference?: string;
  departure_time?: string;
  departure_location?: string;
  arrival_time?: string;
  arrival_location?: string;
  cost?: number;
  currency?: string;
  status?: string;
}

interface AITransportationCardProps {
  transportation: Transportation;
  compact?: boolean;
}

export default function AITransportationCard({ transportation, compact = false }: AITransportationCardProps) {
  const getTransportationIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    switch (type.toLowerCase()) {
      case 'flight':
        return <PlaneTakeoffIcon className={iconClass} />;
      case 'train':
        return <TrainIcon className={iconClass} />;
      case 'bus':
        return <BusIcon className={iconClass} />;
      case 'car':
        return <CarIcon className={iconClass} />;
      case 'ferry':
      case 'boat':
        return <ShipIcon className={iconClass} />;
      default:
        return <CarIcon className={iconClass} />;
    }
  };

  const getStatusBadgeVariant = (status: string | undefined) => {
    if (!status) return 'outline';
    switch (status.toLowerCase()) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return '';
    switch (status.toLowerCase()) {
      case 'confirmed': return 'Confermato';
      case 'pending': return 'In attesa';
      case 'cancelled': return 'Cancellato';
      default: return status;
    }
  };

  return (
    <Card className="overflow-hidden border-l-4 border-l-primary/60 hover:shadow-md transition-all duration-200">
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                {getTransportationIcon(transportation.type)}
              </div>
              <div>
                <h4 className="font-medium text-sm">
                  {transportation.provider || transportation.type.charAt(0).toUpperCase() + transportation.type.slice(1)}
                </h4>
                {transportation.booking_reference && (
                  <p className="text-xs text-muted-foreground">
                    Ref: {transportation.booking_reference}
                  </p>
                )}
              </div>
            </div>
            
            {transportation.status && (
              <Badge variant={getStatusBadgeVariant(transportation.status) as any} className="text-xs">
                {getStatusLabel(transportation.status)}
              </Badge>
            )}
          </div>

          {/* Route */}
          <div className="space-y-2">
            {transportation.departure_location && transportation.arrival_location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPinIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">
                  {transportation.departure_location} → {transportation.arrival_location}
                </span>
              </div>
            )}

            {(transportation.departure_time || transportation.arrival_time) && (
              <div className="flex items-center gap-2 text-sm">
                <ClockIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">
                  {transportation.departure_time && formatTimeLocal(transportation.departure_time)}
                  {transportation.departure_time && transportation.arrival_time && ' - '}
                  {transportation.arrival_time && formatTimeLocal(transportation.arrival_time)}
                </span>
              </div>
            )}

            {transportation.cost !== null && transportation.cost !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSignIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="font-medium">
                  {formatCurrency(transportation.cost, transportation.currency || 'EUR')}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
