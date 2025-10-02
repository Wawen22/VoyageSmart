'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3Icon, 
  TrendingUpIcon, 
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  GlobeIcon,
  XIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TravelInsights from './TravelInsights';

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

interface AdvancedMetricsModalProps {
  trips: Trip[];
  trigger?: React.ReactNode;
}

export default function AdvancedMetricsModal({ trips, trigger }: AdvancedMetricsModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const defaultTrigger = (
    <Button variant="outline" className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors">
      <BarChart3Icon className="h-4 w-4" />
      View Analytics
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-6xl h-[90vh] max-h-[90vh] overflow-y-auto p-3 sm:p-6 lg:w-full lg:h-auto lg:max-h-[90vh]">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
            <BarChart3Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary" />
            Travel Analytics & Insights
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4 lg:space-y-6 overflow-y-auto flex-1">
          <TravelInsights trips={trips} />

          {/* Additional Advanced Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Travel Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUpIcon className="h-5 w-5" />
                  Travel Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Most active month</span>
                  <span className="font-medium">July</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Preferred season</span>
                  <span className="font-medium">Summer</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average trip gap</span>
                  <span className="font-medium">3 months</span>
                </div>
              </CardContent>
            </Card>

            {/* Geographic Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GlobeIcon className="h-5 w-5" />
                  Geographic Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Continents visited</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Countries explored</span>
                  <span className="font-medium">{trips.length > 0 ? Math.min(trips.length, 12) : 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Favorite region</span>
                  <span className="font-medium">Europe</span>
                </div>
              </CardContent>
            </Card>

            {/* Time Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClockIcon className="h-5 w-5" />
                  Time Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total travel days</span>
                  <span className="font-medium">{trips.length * 7}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Planning lead time</span>
                  <span className="font-medium">2 months</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Longest trip</span>
                  <span className="font-medium">14 days</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Options - Coming Soon */}
          <Card className="relative overflow-hidden border-dashed border-2 border-muted-foreground/20 bg-gradient-to-br from-muted/30 via-muted/20 to-background">
            {/* Subtle animated background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,currentColor_25%,currentColor_50%,transparent_50%,transparent_75%,currentColor_75%,currentColor)] bg-[length:20px_20px]" />
            </div>

            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <TrendingUpIcon className="h-5 w-5" />
                Export & Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex flex-col items-center justify-center py-8 px-4 space-y-4">
                {/* Icon with subtle animation */}
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-2xl border border-primary/20">
                    <TrendingUpIcon className="h-12 w-12 text-primary/60" />
                  </div>
                </div>

                {/* Coming Soon Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-semibold text-primary">Coming Soon</span>
                </div>

                {/* Description */}
                <div className="text-center space-y-2 max-w-md">
                  <h3 className="text-lg font-semibold text-foreground">
                    Advanced Export Features
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We're working on powerful export and reporting capabilities. Soon you'll be able to generate PDF reports, download CSV data, and share your analytics with ease.
                  </p>
                </div>

                {/* Feature Preview Pills */}
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <div className="px-3 py-1.5 rounded-full bg-background border border-border text-xs font-medium text-muted-foreground">
                    📄 PDF Reports
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-background border border-border text-xs font-medium text-muted-foreground">
                    📊 CSV Export
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-background border border-border text-xs font-medium text-muted-foreground">
                    🔗 Share Analytics
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
