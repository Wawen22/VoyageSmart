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
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-medium text-lg flex items-center">
                <Building2Icon className="h-4 w-4 mr-2 text-primary" />
                {accommodation.name}
              </h3>

              {accommodation.type && (
                <Badge variant="outline" className="text-xs">
                  {getAccommodationTypeLabel(accommodation.type)}
                </Badge>
              )}
            </div>

            {accommodation.cost !== null && (
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatCurrency(accommodation.cost, accommodation.currency)}
                </p>
              </div>
            )}
          </div>

          {/* Dates */}
          {(accommodation.check_in_date || accommodation.check_out_date) && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
              {accommodation.check_in_date && (
                <div className="flex items-center">
                  <CalendarIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                  <span className="text-muted-foreground mr-1">In:</span>
                  <span>{format(parseISO(accommodation.check_in_date), 'MMM d, yyyy')}</span>
                </div>
              )}

              {accommodation.check_out_date && (
                <div className="flex items-center">
                  <CalendarIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                  <span className="text-muted-foreground mr-1">Out:</span>
                  <span>{format(parseISO(accommodation.check_out_date), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          )}

          {/* Address */}
          {accommodation.address && (
            <div className="flex items-center text-sm">
              <MapPinIcon className="h-3 w-3 mr-1 text-muted-foreground" />
              <p className="truncate">{accommodation.address}</p>
            </div>
          )}

          {/* Documents */}
          {accommodation.documents && accommodation.documents.length > 0 && (
            <div className="flex items-center text-sm">
              <FileIcon className="h-3 w-3 mr-1 text-muted-foreground" />
              <p>{accommodation.documents.length} document{accommodation.documents.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 flex justify-end gap-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(accommodation)}
        >
          <EyeIcon className="h-4 w-4 mr-1" />
          View
        </Button>

        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(accommodation)}
          >
            <EditIcon className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(AccommodationCard);
