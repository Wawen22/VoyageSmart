'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArticleListItem, CATEGORY_METADATA } from '@/types/article';

interface HubSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function HubSearch({ onSearch, placeholder = 'Search articles...' }: HubSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<ArticleListItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      onSearch('');
      return;
    }

    if (query.trim().length < 2) {
      return;
    }

    setIsSearching(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/hub/search?q=${encodeURIComponent(query)}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }

      // Also trigger the parent search callback
      onSearch(query);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onSearch('');
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-12 pr-12 py-6 text-base rounded-xl border-2 border-border/50 focus:border-primary/50 bg-background/80 backdrop-blur-sm shadow-lg transition-all duration-300"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
            aria-label="Clear search"
          >
            {isSearching ? (
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            ) : (
              <X className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-background/95 backdrop-blur-xl border-2 border-border/50 rounded-xl shadow-2xl overflow-hidden z-50 animate-slide-in-top">
          <div className="p-2 space-y-1">
            {suggestions.map((article) => {
              const categoryMeta = CATEGORY_METADATA[article.category];
              return (
                <Link
                  key={article.id}
                  href={`/hub/${article.slug}`}
                  onClick={() => {
                    setShowSuggestions(false);
                    setQuery('');
                  }}
                  className="block p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    {article.featured_image_url && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={article.featured_image_url}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                        {article.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: `${categoryMeta.color}20`,
                            color: categoryMeta.color
                          }}
                        >
                          {categoryMeta.name}
                        </Badge>
                        {article.read_time_minutes && (
                          <span className="text-xs text-muted-foreground">
                            {article.read_time_minutes} min read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* View All Results */}
          <div className="border-t border-border/50 p-3 bg-muted/30">
            <button
              onClick={() => {
                setShowSuggestions(false);
                onSearch(query);
              }}
              className="w-full text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              View all results for "{query}"
            </button>
          </div>
        </div>
      )}

      {/* No Results */}
      {showSuggestions && query.trim().length >= 2 && suggestions.length === 0 && !isSearching && (
        <div className="absolute top-full mt-2 w-full bg-background/95 backdrop-blur-xl border-2 border-border/50 rounded-xl shadow-2xl p-6 text-center z-50 animate-slide-in-top">
          <p className="text-muted-foreground">No articles found for "{query}"</p>
          <p className="text-sm text-muted-foreground mt-2">Try different keywords or browse by category</p>
        </div>
      )}
    </div>
  );
}

