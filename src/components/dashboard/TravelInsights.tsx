'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUpIcon, 
  MapPinIcon, 
  DollarSignIcon, 
  CalendarIcon,
  GlobeIcon,
  ClockIcon,
  BarChart3Icon,
  PieChartIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createConsistentDate } from '@/lib/date-utils';

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

interface TravelInsightsProps {
  trips: Trip[];
}

export default function TravelInsights({ trips }: TravelInsightsProps) {
  const [insights, setInsights] = useState({
    totalBudget: 0,
    averageTripDuration: 0,
    mostVisitedCountries: [] as string[],
    monthlyTrends: [] as any[],
    upcomingBudget: 0,
    travelFrequency: 0
  });

  useEffect(() => {
    calculateInsights();
  }, [trips]);

  const calculateInsights = () => {
    // Use a consistent date for SSR/hydration
    const now = createConsistentDate();
    
    // Total budget
    const totalBudget = trips.reduce((sum, trip) => sum + (trip.budget_total || 0), 0);
    
    // Average trip duration
    const tripsWithDates = trips.filter(trip => trip.start_date && trip.end_date);
    const averageDuration = tripsWithDates.length > 0 
      ? tripsWithDates.reduce((sum, trip) => {
          const start = new Date(trip.start_date!);
          const end = new Date(trip.end_date!);
          return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / tripsWithDates.length
      : 0;

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

    // Upcoming budget
    const upcomingTrips = trips.filter(trip => 
      trip.start_date && new Date(trip.start_date) > now
    );
    const upcomingBudget = upcomingTrips.reduce((sum, trip) => sum + (trip.budget_total || 0), 0);

    // Travel frequency (trips per year)
    const currentYear = now.getFullYear();
    const thisYearTrips = trips.filter(trip => 
      trip.start_date && new Date(trip.start_date).getFullYear() === currentYear
    );

    setInsights({
      totalBudget,
      averageTripDuration: Math.round(averageDuration),
      mostVisitedCountries: topCountries,
      monthlyTrends: [], // TODO: Implement monthly trends
      upcomingBudget,
      travelFrequency: thisYearTrips.length
    });
  };

  const insightCards = [
    {
      title: 'Average Duration',
      value: `${insights.averageTripDuration} days`,
      icon: ClockIcon,
      description: 'Per trip',
      gradient: 'from-blue-500 to-cyan-600',
      change: '+2 days'
    },
    {
      title: 'Travel Frequency',
      value: `${insights.travelFrequency}/year`,
      icon: TrendingUpIcon,
      description: 'This year',
      gradient: 'from-purple-500 to-pink-600',
      change: '+1 trip'
    },
    {
      title: 'Total Destinations',
      value: `${insights.mostVisitedCountries.length}`,
      icon: GlobeIcon,
      description: 'Countries visited',
      gradient: 'from-emerald-500 to-teal-600',
      change: 'Explored'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insightCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <CardContent className="p-0">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r",
                      card.gradient
                    )}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                      {card.change}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {card.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top Destinations */}
      {insights.mostVisitedCountries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GlobeIcon className="h-5 w-5" />
              Top Destinations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.mostVisitedCountries.map((country, index) => (
                <div
                  key={country}
                  className={cn(
                    "px-3 py-2 rounded-full text-sm font-medium",
                    index === 0 && "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
                    index === 1 && "bg-gradient-to-r from-green-500 to-teal-600 text-white",
                    index === 2 && "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                  )}
                >
                  {index === 0 && '🥇'} {index === 1 && '🥈'} {index === 2 && '🥉'} {country}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
}
