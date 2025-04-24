'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeatherDisplay from './WeatherDisplay';
import WeatherForecast from './WeatherForecast';
import { TripDestinations, Destination } from '@/lib/types/destination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface TripWeatherProps {
  destinations?: TripDestinations;
  className?: string;
}

export default function TripWeather({ destinations, className = '' }: TripWeatherProps) {
  const [expanded, setExpanded] = useState(false);

  if (!destinations || destinations.destinations.length === 0) {
    return null;
  }

  // Get primary destination or first destination
  const primaryDestination = destinations.primary
    ? destinations.destinations.find(d => d.id === destinations.primary)
    : destinations.destinations[0];

  if (!primaryDestination) {
    return null;
  }

  return (
    <Card className={`${className} overflow-hidden backdrop-blur-sm transition-all duration-300 hover:shadow-md`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/30">
        <CardTitle className="text-md font-medium flex items-center">
          <div className="p-1.5 rounded-full bg-primary/10 mr-2 group-hover:bg-primary/20 transition-colors">
            <CloudIcon className="h-4 w-4 text-primary" />
          </div>
          Weather Forecast
        </CardTitle>
        <div className="flex items-center space-x-2">
          {destinations.destinations.length > 1 && !expanded && (
            <div className="flex -space-x-2 mr-2">
              {destinations.destinations.slice(0, 3).map((destination, index) => (
                <div
                  key={destination.id}
                  className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary border border-background"
                  style={{ zIndex: 10 - index }}
                >
                  {destination.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {destinations.destinations.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary border border-background" style={{ zIndex: 7 }}>
                  +{destinations.destinations.length - 3}
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/20"
          >
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </CardHeader>

      {!expanded && (
        <CardContent className="py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <WeatherDisplay destination={primaryDestination} compact />
            </div>
            <div className="text-xs text-muted-foreground">
              {primaryDestination.name}
            </div>
          </div>
        </CardContent>
      )}

      {expanded && (
        <CardContent>
          {destinations.destinations.length > 1 ? (
            <Tabs defaultValue={primaryDestination.id} className="w-full">
              <TabsList className="mb-4 w-full justify-start overflow-x-auto">
                {destinations.destinations.map(destination => (
                  <TabsTrigger key={destination.id} value={destination.id} className="px-3 py-1.5">
                    {destination.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {destinations.destinations.map(destination => (
                <TabsContent key={destination.id} value={destination.id} className="space-y-4 animate-in fade-in-50 duration-300">
                  <WeatherDisplay destination={destination} />
                  <WeatherForecast destination={destination} compact />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <WeatherDisplay destination={primaryDestination} />
              <WeatherForecast destination={primaryDestination} compact />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
