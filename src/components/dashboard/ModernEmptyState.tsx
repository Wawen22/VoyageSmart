'use client';

import Link from 'next/link';
import { 
  PlusIcon, 
  MapIcon, 
  CompassIcon, 
  CameraIcon,
  HeartIcon,
  StarIcon,
  GlobeIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModernEmptyStateProps {
  searchTerm?: string;
  filter?: string;
}

export default function ModernEmptyState({ searchTerm, filter }: ModernEmptyStateProps) {
  const isSearching = !!searchTerm;
  const isFiltered = filter && filter !== 'all';

  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center">
            <CompassIcon className="h-16 w-16 text-slate-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-white text-sm">?</span>
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          No adventures found
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
          We couldn't find any trips matching "<span className="font-semibold text-blue-600">{searchTerm}</span>". 
          Try adjusting your search or explore new destinations.
        </p>
        
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="rounded-xl"
        >
          Clear search
        </Button>
      </div>
    );
  }

  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900 dark:to-teal-800 rounded-full flex items-center justify-center">
            <MapIcon className="h-16 w-16 text-emerald-600" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          No {filter} adventures yet
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
          You don't have any {filter} trips yet. Start planning your next adventure!
        </p>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.location.reload()} className="rounded-xl">
            Show all trips
          </Button>
          <Button asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl">
            <Link href="/trips/new">
              <PlusIcon className="h-4 w-4 mr-2" />
              Plan Adventure
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 rounded-3xl" />
      <div className="absolute inset-0 opacity-40 rounded-3xl">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center py-24 px-6 text-center">
        {/* Animated illustration */}
        <div className="relative mb-12">
          <div className="w-40 h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-float">
            <GlobeIcon className="h-20 w-20 text-white" />
          </div>
          
          {/* Floating elements */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
            <StarIcon className="h-4 w-4 text-white" />
          </div>
          <div className="absolute -top-2 -right-6 w-6 h-6 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '1s' }}>
            <HeartIcon className="h-3 w-3 text-white" />
          </div>
          <div className="absolute -bottom-2 -left-6 w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '1.5s' }}>
            <CameraIcon className="h-5 w-5 text-white" />
          </div>
        </div>
        
        <h3 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
          Your Adventure Awaits
        </h3>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl leading-relaxed">
          Ready to explore the world? Create your first trip and start planning unforgettable adventures. 
          From dream destinations to detailed itineraries, your journey begins here.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Button 
            asChild 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <Link href="/trips/new">
              <PlusIcon className="h-5 w-5 mr-2" />
              Start Your First Adventure
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            asChild 
            className="rounded-xl px-8 py-4 text-lg border-2 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Link href="/support">
              Learn More
            </Link>
          </Button>
        </div>
        
        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <MapIcon className="h-8 w-8 text-white" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Plan Itineraries</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Create detailed day-by-day plans for your trips</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <CompassIcon className="h-8 w-8 text-white" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Track Adventures</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Monitor your travel progress and milestones</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <CameraIcon className="h-8 w-8 text-white" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Capture Memories</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Save photos and memories from your journeys</p>
          </div>
        </div>
      </div>
    </div>
  );
}
