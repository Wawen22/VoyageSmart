'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterIcon, CalendarIcon, MapPinIcon, DollarSignIcon, ClockIcon, CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetFiltersProps {
  filter: string;
  setFilter: (filter: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  availableYears: number[];
  viewMode: 'grid' | 'timeline' | 'map';
  setViewMode: (mode: 'grid' | 'timeline' | 'map') => void;
}

const filterOptions = [
  { 
    value: 'all', 
    label: 'All Trips', 
    emoji: '🌍', 
    description: 'Show all your trips',
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
  },
  { 
    value: 'upcoming', 
    label: 'Upcoming', 
    emoji: '🚀', 
    description: 'Future adventures',
    color: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
  },
  { 
    value: 'ongoing', 
    label: 'Ongoing', 
    emoji: '✈️', 
    description: 'Currently traveling',
    color: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
  },
  { 
    value: 'past', 
    label: 'Completed', 
    emoji: '📸', 
    description: 'Past memories',
    color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
  }
];

const viewModeOptions = [
  { 
    value: 'grid' as const, 
    label: 'Grid', 
    emoji: '⊞', 
    description: 'Card view',
    icon: '⊞'
  },
  { 
    value: 'timeline' as const, 
    label: 'Timeline', 
    emoji: '📅', 
    description: 'Chronological view',
    icon: '📅'
  },
  { 
    value: 'map' as const, 
    label: 'Map', 
    emoji: '🗺️', 
    description: 'Geographic view',
    icon: '🗺️'
  }
];

export default function BottomSheetFilters({
  filter,
  setFilter,
  selectedYear,
  setSelectedYear,
  availableYears,
  viewMode,
  setViewMode
}: BottomSheetFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filter !== 'all') count++;
    if (selectedYear !== 'all') count++;
    if (viewMode !== 'grid') count++;
    return count;
  };

  const clearAllFilters = () => {
    setFilter('all');
    setSelectedYear('all');
    setViewMode('grid');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="lg:hidden relative"
        >
          <FilterIcon className="h-4 w-4 mr-2" />
          Filters
          {getActiveFiltersCount() > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl bottom-sheet-mobile">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <FilterIcon className="h-5 w-5" />
              Filters & View
            </SheetTitle>
            {getActiveFiltersCount() > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Trip Status Filters */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <MapPinIcon className="h-4 w-4" />
              Trip Status
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={filter === option.value ? "default" : "outline"}
                  className={cn(
                    "h-16 flex-col gap-1 relative filter-button mobile-touch-optimized",
                    filter === option.value && "ring-2 ring-primary/20 active"
                  )}
                  onClick={() => setFilter(option.value)}
                >
                  <span className="text-lg">{option.emoji}</span>
                  <span className="text-xs font-medium">{option.label}</span>
                  {filter === option.value && (
                    <CheckIcon className="absolute top-1 right-1 h-3 w-3" />
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Year Filter */}
          {availableYears.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Year
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedYear === 'all' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedYear('all')}
                  className="relative"
                >
                  All Years
                  {selectedYear === 'all' && (
                    <CheckIcon className="absolute top-0 right-0 h-3 w-3" />
                  )}
                </Button>
                {availableYears.map((year) => (
                  <Button
                    key={year}
                    variant={selectedYear === year.toString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedYear(year.toString())}
                    className="relative"
                  >
                    {year}
                    {selectedYear === year.toString() && (
                      <CheckIcon className="absolute top-0 right-0 h-3 w-3" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* View Mode */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              View Mode
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {viewModeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={viewMode === option.value ? "default" : "outline"}
                  className={cn(
                    "h-16 flex-col gap-1 relative",
                    viewMode === option.value && "ring-2 ring-primary/20"
                  )}
                  onClick={() => setViewMode(option.value)}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-xs font-medium">{option.label}</span>
                  {viewMode === option.value && (
                    <CheckIcon className="absolute top-1 right-1 h-3 w-3" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
