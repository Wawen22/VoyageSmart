'use client';

import { SearchIcon, FilterIcon, SortAscIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FilterSectionProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filter: 'all' | 'upcoming' | 'past';
  setFilter: (filter: 'all' | 'upcoming' | 'past') => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  filteredTripsCount: number;
}

export default function FilterSection({
  searchTerm,
  setSearchTerm,
  filter,
  setFilter,
  sortBy,
  setSortBy,
  filteredTripsCount
}: FilterSectionProps) {
  const filterOptions = [
    { value: 'upcoming', label: 'Upcoming', color: '#10b981' },
    { value: 'all', label: 'All Trips', color: '#3b82f6' },
    { value: 'past', label: 'Past', color: '#8b5cf6' }
  ];

  return (
    <div className="space-y-4 mb-6 animate-filter-slide-in" style={{ animationDelay: '300ms' }}>
      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
          <SearchIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
        </div>
        <input
          type="text"
          placeholder="Search your trips..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-2xl border-input bg-card/50 backdrop-blur-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm py-2.5 sm:py-3 pl-10 sm:pl-12 pr-4 transition-all duration-300 focus:scale-[1.01] focus:shadow-md"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        )}
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <FilterIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value as 'all' | 'upcoming' | 'past')}
                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                  filter === option.value
                    ? 'bg-card text-foreground shadow-sm scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Badge variant="outline" className="ml-2">
            {filteredTripsCount} {filteredTripsCount === 1 ? 'trip' : 'trips'}
          </Badge>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <SortAscIcon className="h-4 w-4 text-muted-foreground" />
          <div className="relative group">
            <select
              className="text-sm bg-card/80 backdrop-blur-sm text-foreground rounded-xl px-4 py-2 pl-3 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 appearance-none cursor-pointer min-w-[140px]"
              onChange={(e) => setSortBy(e.target.value)}
              value={sortBy}
            >
              <option value="created_desc">Newest first</option>
              <option value="created_asc">Oldest first</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="date_asc">Date (nearest first)</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none transition-transform duration-300 group-hover:rotate-180">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-lg border border-border/30">
          {filteredTripsCount > 0 ? (
            <>Found <span className="font-medium text-foreground">{filteredTripsCount}</span> trip{filteredTripsCount !== 1 ? 's' : ''} matching "<span className="font-medium text-foreground">{searchTerm}</span>"</>
          ) : (
            <>No trips found matching "<span className="font-medium text-foreground">{searchTerm}</span>"</>
          )}
        </div>
      )}
    </div>
  );
}
