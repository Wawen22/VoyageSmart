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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3Icon className="h-6 w-6 text-primary" />
            Travel Analytics & Insights
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <TravelInsights trips={trips} />
          
          {/* Additional Advanced Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Travel Timeline Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Travel Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                <div className="text-center space-y-2">
                  <BarChart3Icon className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">Interactive timeline chart</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="h-5 w-5" />
                Export & Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm">
                  Export PDF Report
                </Button>
                <Button variant="outline" size="sm">
                  Download CSV Data
                </Button>
                <Button variant="outline" size="sm">
                  Share Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
