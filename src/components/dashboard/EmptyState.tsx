'use client';

import Link from 'next/link';
import { PlusIcon, MapPinIcon, CalendarIcon, CameraIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  searchTerm?: string;
  filter?: string;
}

export default function EmptyState({ searchTerm, filter }: EmptyStateProps) {
  const isSearching = !!searchTerm;
  const isFiltered = filter && filter !== 'all';

  if (isSearching) {
    return (
      <Card className="border-dashed border-2 border-border/50 bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 mx-auto mb-6 text-muted-foreground/50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No trips found</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            We couldn't find any trips matching "<span className="font-medium text-foreground">{searchTerm}</span>". 
            Try adjusting your search terms or filters.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Clear search
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isFiltered) {
    return (
      <Card className="border-dashed border-2 border-border/50 bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 mx-auto mb-6 text-muted-foreground/50">
            <CalendarIcon className="w-full h-full" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No {filter} trips</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            You don't have any {filter} trips yet. Try changing your filter or create a new trip.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Show all trips
            </Button>
            <Button asChild>
              <Link href="/trips/new">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Trip
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-2 border-border/50 bg-gradient-to-br from-muted/20 to-muted/10">
      <CardContent className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4">
            <MapPinIcon className="w-12 h-12 text-primary" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-secondary/30 to-secondary/20 rounded-full flex items-center justify-center">
            <CameraIcon className="w-4 h-4 text-secondary-foreground/70" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-foreground mb-3">Start Your Journey</h3>
        <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
          Ready to explore the world? Create your first trip and start planning your next adventure. 
          Organize itineraries, track expenses, and make memories that last a lifetime.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/trips/new">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Trip
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/documentation">
              Learn More
            </Link>
          </Button>
        </div>
        
        <div className="mt-8 grid grid-cols-3 gap-4 text-center max-w-md">
          <div className="space-y-2">
            <div className="w-8 h-8 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Plan Itineraries</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
              <MapPinIcon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Track Locations</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
              <CameraIcon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Save Memories</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
