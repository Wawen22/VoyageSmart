'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlobeIcon, BarChart3Icon } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdvancedMetricsModal from './AdvancedMetricsModal';

interface Trip {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  budget_total: number | null;
  destination: string | null;
  preferences?: {
    currency?: string;
    destinations?: any;
  };
}

interface TopDestinationsWidgetProps {
  trips: Trip[];
}

export default function TopDestinationsWidget({ trips }: TopDestinationsWidgetProps) {
  const [topDestinations, setTopDestinations] = useState<string[]>([]);

  useEffect(() => {
    calculateTopDestinations();
  }, [trips]);

  const calculateTopDestinations = () => {
    // Most visited countries (simplified)
    const destinations = trips
      .map(trip => trip.destination)
      .filter(Boolean)
      .reduce((acc: any, dest) => {
        const country = dest!.split(',').pop()?.trim() || dest;
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {});
    
    const topCountries = Object.entries(destinations)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([country]) => country);

    setTopDestinations(topCountries);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Top Destinations */}
      <div className="lg:col-span-2">
        {topDestinations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GlobeIcon className="h-5 w-5" />
                Top Destinations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {topDestinations.map((country, index) => (
                  <div
                    key={country}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105",
                      index === 0 && "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg",
                      index === 1 && "bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg",
                      index === 2 && "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                    )}
                  >
                    {index === 0 && '🥇'} {index === 1 && '🥈'} {index === 2 && '🥉'} {country}
                  </div>
                ))}
              </div>
              
              {/* Stats Summary */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{trips.length}</p>
                    <p className="text-xs text-muted-foreground">Total Trips</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{topDestinations.length}</p>
                    <p className="text-xs text-muted-foreground">Countries</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {trips.filter(trip => {
                        if (!trip.start_date) return false;
                        return new Date(trip.start_date) > new Date();
                      }).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Upcoming</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Analytics Button */}
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-dashed border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <BarChart3Icon className="h-8 w-8 text-white" />
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Advanced Analytics</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Dive deeper into your travel patterns, insights, and detailed metrics.
                </p>
              </div>

              <AdvancedMetricsModal 
                trips={trips}
                trigger={
                  <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    View Analytics
                  </button>
                }
              />
              
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-3">
                <span>📊 Charts</span>
                <span>📈 Trends</span>
                <span>🗺️ Maps</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Tip */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-yellow-600 text-sm">💡</span>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Pro Tip</p>
                <p className="text-xs text-muted-foreground">
                  Use the analytics to discover your travel patterns and plan better trips!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
