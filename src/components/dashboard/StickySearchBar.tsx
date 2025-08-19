'use client';

import { useState, useEffect } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StickySearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  placeholder?: string;
}

export default function StickySearchBar({ 
  searchTerm, 
  setSearchTerm, 
  placeholder = "Search trips..." 
}: StickySearchBarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky search after scrolling 100px
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={cn(
      "lg:hidden fixed top-0 left-0 right-0 z-50 transition-all duration-300 transform",
      isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
    )}>
      <div className="bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg sticky-search-mobile">
        <div className="px-4 py-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={cn(
                "w-full pl-10 pr-10 py-2.5 bg-background/80 border border-border/50 rounded-lg transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-background",
                isSearchFocused && "shadow-lg"
              )}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <XIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
