'use client';

import { useState } from 'react';
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
  onEdit: (transportation: Transportation) => void;
  canEdit: boolean;
  getIcon: (type: string) => JSX.Element;
}

export default function TransportationCard({
  transportation,
  onView,
  onEdit,
  canEdit,
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
    <Card
      className="overflow-hidden hover:shadow-md transition-all border-l-4 hover:border-l-primary"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderLeftColor: isHovered ? 'var(--primary)' : getStatusColor(transportation.status)
      }}
    >
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="bg-muted p-2 rounded-full">
                  {getIcon(transportation.type)}
                </div>
                <div>
                  <h3 className="font-medium text-lg">
                    {transportation.provider || transportation.type.charAt(0).toUpperCase() + transportation.type.slice(1)}
                  </h3>
                  {transportation.booking_reference && (
                    <p className="text-xs text-muted-foreground">
                      Ref: {transportation.booking_reference}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                {transportation.status && (
                  <Badge variant={getStatusBadgeVariant(transportation.status) as any} className="text-xs">
                    {getStatusLabel(transportation.status)}
                  </Badge>
                )}

                {transportation.documents && transportation.documents.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {transportation.documents.length} document{transportation.documents.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>

            {transportation.cost !== null && (
              <div className="text-right">
                <p className="text-lg font-medium">
                  {formatCurrency(transportation.cost, transportation.currency)}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 bg-muted/30 p-3 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Departure Info */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase text-muted-foreground font-medium">Departure</h4>
                <div className="flex items-center gap-2">
                  <div className="bg-background p-1.5 rounded-md">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                  </div>
                  {transportation.departure_time ? (
                    <div>
                      <p className="text-sm">{format(parseISO(transportation.departure_time), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(transportation.departure_time), 'HH:mm')}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-background p-1.5 rounded-md">
                    <MapPinIcon className="h-4 w-4 text-primary" />
                  </div>
                  {transportation.departure_location ? (
                    <p className="text-sm">{transportation.departure_location}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                </div>
              </div>

              {/* Arrival Info */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase text-muted-foreground font-medium">Arrival</h4>
                <div className="flex items-center gap-2">
                  <div className="bg-background p-1.5 rounded-md">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                  </div>
                  {transportation.arrival_time ? (
                    <div>
                      <p className="text-sm">{format(parseISO(transportation.arrival_time), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(transportation.arrival_time), 'HH:mm')}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-background p-1.5 rounded-md">
                    <MapPinIcon className="h-4 w-4 text-primary" />
                  </div>
                  {transportation.arrival_location ? (
                    <p className="text-sm">{transportation.arrival_location}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(transportation)}
              className="flex items-center hover:bg-background"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              View
            </Button>

            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(transportation)}
                className="flex items-center hover:bg-background hover:text-primary"
              >
                <EditIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
