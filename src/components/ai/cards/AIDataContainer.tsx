'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AITransportationCard from './AITransportationCard';
import AIItineraryView from './AIItineraryView';
import AIAccommodationCard from './AIAccommodationCard';
import AIExpenseCard from './AIExpenseCard';
import {
  PlaneTakeoffIcon,
  CalendarIcon,
  Building2Icon,
  ReceiptIcon,
  InfoIcon
} from 'lucide-react';

interface AIDataContainerProps {
  type: 'transportation' | 'itinerary' | 'accommodations' | 'expenses';
  data: any[];
  title?: string;
  compact?: boolean;
  maxItems?: number;
  showHeader?: boolean;
}

export default function AIDataContainer({ 
  type, 
  data, 
  title, 
  compact = false, 
  maxItems,
  showHeader = true 
}: AIDataContainerProps) {
  const getIcon = () => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'transportation':
        return <PlaneTakeoffIcon className={iconClass} />;
      case 'itinerary':
        return <CalendarIcon className={iconClass} />;
      case 'accommodations':
        return <Building2Icon className={iconClass} />;
      case 'expenses':
        return <ReceiptIcon className={iconClass} />;
      default:
        return <InfoIcon className={iconClass} />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'transportation':
        return 'Trasporti';
      case 'itinerary':
        return 'Itinerario';
      case 'accommodations':
        return 'Alloggi';
      case 'expenses':
        return 'Spese';
      default:
        return 'Dati';
    }
  };

  const displayData = maxItems ? data.slice(0, maxItems) : data;

  if (!data || data.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center">
          <div className="flex flex-col items-center gap-2">
            {getIcon()}
            <p className="text-sm text-muted-foreground">
              Nessun dato disponibile per {getDefaultTitle().toLowerCase()}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderContent = () => {
    switch (type) {
      case 'transportation':
        return (
          <div className="space-y-3">
            {displayData.map((item, index) => (
              <AITransportationCard
                key={item.id || index}
                transportation={item}
                compact={compact}
              />
            ))}
          </div>
        );

      case 'itinerary':
        return (
          <AIItineraryView
            days={displayData}
            compact={compact}
            maxDays={maxItems}
          />
        );

      case 'accommodations':
        return (
          <div className="space-y-3">
            {displayData.map((item, index) => (
              <AIAccommodationCard
                key={item.id || index}
                accommodation={item}
                compact={compact}
              />
            ))}
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-3">
            {displayData.map((item, index) => (
              <AIExpenseCard
                key={item.id || index}
                expense={item}
                compact={compact}
              />
            ))}
          </div>
        );

      default:
        return (
          <div className="text-center p-4">
            <p className="text-sm text-muted-foreground">
              Tipo di dato non supportato: {type}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {showHeader && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {getIcon()}
              {title || getDefaultTitle()}
              {data.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({data.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {renderContent()}

      {maxItems && data.length > maxItems && (
        <Card className="border-dashed">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">
              ... e altri {data.length - maxItems} elementi
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
