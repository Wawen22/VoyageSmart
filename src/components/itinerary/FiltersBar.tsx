import React, { useState } from 'react';
import {
  FilterIcon,
  SearchIcon,
  XIcon,
  CalendarIcon,
  UtensilsIcon,
  LandmarkIcon,
  CarIcon,
  HotelIcon,
  AlertCircleIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FilterState = {
  category: string[];
  priority: number[];
  status: string[];
  searchQuery: string;
  dateRange: { start: Date; end: Date } | null;
};

type FiltersBarProps = {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  totalResults: number;
  isLoading?: boolean;
};

const categories = [
  { value: 'food', label: 'Food', icon: UtensilsIcon, color: 'text-orange-500' },
  { value: 'culture', label: 'Culture', icon: LandmarkIcon, color: 'text-purple-500' },
  { value: 'transport', label: 'Transport', icon: CarIcon, color: 'text-blue-500' },
  { value: 'accommodation', label: 'Hotel', icon: HotelIcon, color: 'text-teal-500' }
];

const priorities = [
  { value: 1, label: 'High', color: 'bg-red-500' },
  { value: 2, label: 'Medium', color: 'bg-orange-500' },
  { value: 3, label: 'Low', color: 'bg-blue-500' }
];

const statuses = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-500' },
  { value: 'confirmed', label: 'Confirmed', color: 'text-green-500' },
  { value: 'completed', label: 'Completed', color: 'text-blue-500' }
];

export default function FiltersBar({
  filters,
  onFiltersChange,
  onClearFilters,
  totalResults,
  isLoading = false
}: FiltersBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filters.category.length > 0 ||
    filters.priority.length > 0 ||
    filters.status.length > 0 ||
    filters.searchQuery.trim() !== '' ||
    filters.dateRange !== null;

  const toggleCategory = (category: string) => {
    const newCategories = filters.category.includes(category)
      ? filters.category.filter(c => c !== category)
      : [...filters.category, category];
    onFiltersChange({ ...filters, category: newCategories });
  };

  const togglePriority = (priority: number) => {
    const newPriorities = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority];
    onFiltersChange({ ...filters, priority: newPriorities });
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatuses });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, searchQuery: e.target.value });
  };

  return (
    <div className="glass-card rounded-2xl border border-white/20 overflow-hidden animate-glass-fade-in">
      {/* Animated Background */}
      <div className="
        absolute -top-20 -right-20 w-48 h-48 
        bg-gradient-to-br from-blue-500/10 to-purple-500/10 
        rounded-full blur-3xl opacity-50
      " />
      
      <div className="relative z-10 p-4 space-y-4">
        {/* Top Row: Search & Toggle */}
        <div className="flex gap-3">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={filters.searchQuery}
              onChange={handleSearchChange}
              className="
                pl-10 pr-10
                bg-background/30 backdrop-blur-sm
                border-white/20 
                focus:border-blue-500/50
                transition-all duration-300
              "
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFiltersChange({ ...filters, searchQuery: '' })}
                className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  p-1 rounded-full
                  hover:bg-white/10
                  transition-colors
                "
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filters Toggle Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              relative overflow-hidden
              ${isExpanded ? 'bg-blue-500/20 border-blue-500/50' : 'border-white/20'}
              hover:bg-blue-500/10 hover:border-blue-500/50
              transition-all duration-300
            `}
          >
            <FilterIcon className="h-4 w-4" />
            {hasActiveFilters && (
              <span className="
                absolute -top-1 -right-1 
                w-3 h-3 rounded-full 
                bg-blue-500 border-2 border-background
                animate-pulse
              " />
            )}
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearFilters}
              className="
                hover:bg-red-500/10 hover:text-red-500
                transition-all duration-300
              "
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-4 animate-slide-in-up">
            {/* Category Filters */}
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const isActive = filters.category.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      onClick={() => toggleCategory(cat.value)}
                      className={`
                        px-3 py-2 rounded-lg
                        flex items-center gap-2
                        border transition-all duration-300
                        ${isActive
                          ? 'bg-blue-500/20 border-blue-500/50 scale-105'
                          : 'bg-background/30 border-white/20 hover:bg-white/5'
                        }
                      `}
                    >
                      <Icon className={`h-4 w-4 ${cat.color}`} />
                      <span className="text-sm font-medium">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Filters */}
            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <div className="flex flex-wrap gap-2">
                {priorities.map(priority => {
                  const isActive = filters.priority.includes(priority.value);
                  return (
                    <button
                      key={priority.value}
                      onClick={() => togglePriority(priority.value)}
                      className={`
                        px-3 py-2 rounded-lg
                        flex items-center gap-2
                        border transition-all duration-300
                        ${isActive
                          ? 'bg-blue-500/20 border-blue-500/50 scale-105'
                          : 'bg-background/30 border-white/20 hover:bg-white/5'
                        }
                      `}
                    >
                      <div className={`w-3 h-3 rounded-full ${priority.color}`} />
                      <span className="text-sm font-medium">{priority.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Filters */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {statuses.map(status => {
                  const isActive = filters.status.includes(status.value);
                  return (
                    <button
                      key={status.value}
                      onClick={() => toggleStatus(status.value)}
                      className={`
                        px-3 py-2 rounded-lg
                        flex items-center gap-2
                        border transition-all duration-300
                        ${isActive
                          ? 'bg-blue-500/20 border-blue-500/50 scale-105'
                          : 'bg-background/30 border-white/20 hover:bg-white/5'
                        }
                      `}
                    >
                      <AlertCircleIcon className={`h-4 w-4 ${status.color}`} />
                      <span className="text-sm font-medium">{status.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              <span>
                {totalResults} {totalResults === 1 ? 'result' : 'results'}
                {hasActiveFilters && ' (filtered)'}
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs hover:bg-red-500/10 hover:text-red-500"
            >
              Clear all filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
