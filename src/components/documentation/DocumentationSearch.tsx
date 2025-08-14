'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  DocumentTextIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface SearchResult {
  title: string;
  path: string;
  section: string;
  excerpt: string;
  type: 'page' | 'section';
}

// Enhanced search data with more comprehensive coverage
const searchData: SearchResult[] = [
  // Getting Started
  {
    title: 'Installation',
    path: '/documentation/getting-started/installation',
    section: 'Getting Started',
    excerpt: 'Learn how to install and set up VoyageSmart for development. Includes Node.js setup, dependencies, and environment configuration.',
    type: 'page'
  },
  {
    title: 'Configuration',
    path: '/documentation/getting-started/configuration',
    section: 'Getting Started',
    excerpt: 'Configure environment variables, Supabase connection, and API keys for VoyageSmart.',
    type: 'page'
  },
  {
    title: 'First Steps',
    path: '/documentation/getting-started/first-steps',
    section: 'Getting Started',
    excerpt: 'Get started with VoyageSmart: create your first trip, add participants, and explore features.',
    type: 'page'
  },

  // Architecture
  {
    title: 'Database Schema',
    path: '/documentation/architecture/database-schema',
    section: 'Architecture',
    excerpt: 'Detailed overview of the database structure, tables, relationships, and Row Level Security policies.',
    type: 'page'
  },
  {
    title: 'Frontend Architecture',
    path: '/documentation/architecture/frontend-architecture',
    section: 'Architecture',
    excerpt: 'Next.js app structure, React components, state management with Redux, and styling approach.',
    type: 'page'
  },
  {
    title: 'Backend Architecture',
    path: '/documentation/architecture/backend-architecture',
    section: 'Architecture',
    excerpt: 'API routes, Supabase integration, authentication flow, and server-side logic.',
    type: 'page'
  },
  {
    title: 'Security',
    path: '/documentation/architecture/security',
    section: 'Architecture',
    excerpt: 'Security implementations, authentication, authorization, and data protection measures.',
    type: 'page'
  },

  // Features
  {
    title: 'Trip Management',
    path: '/documentation/features/trip-management',
    section: 'Features',
    excerpt: 'Create, edit, and manage trips with collaborative features. Invite participants and manage permissions.',
    type: 'page'
  },
  {
    title: 'Itinerary Planning',
    path: '/documentation/features/itinerary-planning',
    section: 'Features',
    excerpt: 'Plan your itinerary with activities, calendar view, map integration, and AI-powered suggestions.',
    type: 'page'
  },
  {
    title: 'Accommodations',
    path: '/documentation/features/accommodations',
    section: 'Features',
    excerpt: 'Manage accommodations, bookings, check-in/check-out dates, and location details.',
    type: 'page'
  },
  {
    title: 'Transportation',
    path: '/documentation/features/transportation',
    section: 'Features',
    excerpt: 'Track flights, trains, car rentals, and other transportation with booking details and schedules.',
    type: 'page'
  },
  {
    title: 'Expenses',
    path: '/documentation/features/expenses',
    section: 'Features',
    excerpt: 'Manage trip expenses, split costs among participants, track budgets, and generate reports.',
    type: 'page'
  },
  {
    title: 'Collaboration',
    path: '/documentation/features/collaboration',
    section: 'Features',
    excerpt: 'Collaborate with trip participants, share planning responsibilities, and communicate effectively.',
    type: 'page'
  },
  {
    title: 'AI Features',
    path: '/documentation/features/ai-features',
    section: 'Features',
    excerpt: 'Explore AI-powered features including trip planning, activity suggestions, and intelligent recommendations.',
    type: 'page'
  },

  // Development
  {
    title: 'Code Standards',
    path: '/documentation/development/code-standards',
    section: 'Development',
    excerpt: 'Coding standards, best practices, TypeScript usage, and component structure guidelines.',
    type: 'page'
  },

  {
    title: 'Security Implementations',
    path: '/documentation/development/security-implementations',
    section: 'Development',
    excerpt: 'Security measures, middleware protection, authentication flow, and vulnerability prevention.',
    type: 'page'
  },

  // Integrations
  {
    title: 'Supabase Integration',
    path: '/documentation/integrations/supabase',
    section: 'Integrations',
    excerpt: 'How VoyageSmart integrates with Supabase for authentication, database, and real-time features.',
    type: 'page'
  },
  {
    title: 'Stripe Integration',
    path: '/documentation/integrations/stripe',
    section: 'Integrations',
    excerpt: 'Payment processing, subscription management, and billing integration with Stripe.',
    type: 'page'
  },
  {
    title: 'Mapbox Integration',
    path: '/documentation/integrations/mapbox',
    section: 'Integrations',
    excerpt: 'Maps, geocoding, location services, and interactive map features using Mapbox.',
    type: 'page'
  },
  {
    title: 'Gemini AI Integration',
    path: '/documentation/integrations/gemini-ai',
    section: 'Integrations',
    excerpt: 'AI-powered features using Google Gemini AI for trip planning and recommendations.',
    type: 'page'
  },

  // API
  {
    title: 'API Authentication',
    path: '/documentation/api/authentication',
    section: 'API',
    excerpt: 'Authentication endpoints, JWT tokens, session management, and security implementation.',
    type: 'page'
  },
  {
    title: 'Trips API',
    path: '/documentation/api/trips',
    section: 'API',
    excerpt: 'Trip management endpoints for creating, updating, deleting, and retrieving trip data.',
    type: 'page'
  },
  {
    title: 'Itinerary API',
    path: '/documentation/api/itinerary',
    section: 'API',
    excerpt: 'Itinerary and activity management endpoints for planning and scheduling.',
    type: 'page'
  },
  {
    title: 'Expenses API',
    path: '/documentation/api/expenses',
    section: 'API',
    excerpt: 'Expense tracking and management endpoints for financial features.',
    type: 'page'
  },
  {
    title: 'AI Endpoints',
    path: '/documentation/api/ai-endpoints',
    section: 'API',
    excerpt: 'AI-powered API endpoints for trip planning, activity generation, and recommendations.',
    type: 'page'
  },

  // Tutorials
  {
    title: 'Creating a Trip Tutorial',
    path: '/documentation/tutorials/creating-a-trip',
    section: 'Tutorials',
    excerpt: 'Step-by-step guide to creating your first trip, adding details, and inviting participants.',
    type: 'page'
  },
  {
    title: 'Planning an Itinerary Tutorial',
    path: '/documentation/tutorials/planning-an-itinerary',
    section: 'Tutorials',
    excerpt: 'Learn how to plan your itinerary, add activities, and use the calendar and map views.',
    type: 'page'
  },
  {
    title: 'Managing Expenses Tutorial',
    path: '/documentation/tutorials/managing-expenses',
    section: 'Tutorials',
    excerpt: 'Tutorial on tracking expenses, splitting costs, and managing trip budgets effectively.',
    type: 'page'
  },
  {
    title: 'Using AI Features Tutorial',
    path: '/documentation/tutorials/using-ai-features',
    section: 'Tutorials',
    excerpt: 'Guide to using AI-powered features for trip planning and activity recommendations.',
    type: 'page'
  },

  // Technical Documentation
  {
    title: 'Development Roadmap',
    path: '/documentation/technical/development-roadmap',
    section: 'Technical Documentation',
    excerpt: 'Project roadmap, planned features, development milestones, and future enhancements.',
    type: 'page'
  },
  {
    title: 'Subscription Implementation',
    path: '/documentation/technical/subscription-implementation',
    section: 'Technical Documentation',
    excerpt: 'Subscription system implementation, billing logic, and plan management.',
    type: 'page'
  },
  {
    title: 'Admin User Management',
    path: '/documentation/technical/admin-user-management',
    section: 'Technical Documentation',
    excerpt: 'Admin features, user management, role-based access control, and administrative tools.',
    type: 'page'
  },
  {
    title: 'AI Documentation',
    path: '/documentation/technical/ai-documentation',
    section: 'Technical Documentation',
    excerpt: 'Comprehensive AI implementation details, prompts, and integration architecture.',
    type: 'page'
  },
];

interface DocumentationSearchProps {
  className?: string;
  placeholder?: string;
}

export default function DocumentationSearch({ 
  className = '', 
  placeholder = 'Search documentation...' 
}: DocumentationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Enhanced search function with scoring and highlighting
  const performSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const searchTerms = query.split(' ').filter(term => term.length > 0);

    const scoredResults = searchData.map(item => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const sectionLower = item.section.toLowerCase();
      const excerptLower = item.excerpt.toLowerCase();

      // Exact title match gets highest score
      if (titleLower === query) score += 100;
      else if (titleLower.includes(query)) score += 50;

      // Section match
      if (sectionLower.includes(query)) score += 30;

      // Individual term matching
      searchTerms.forEach(term => {
        if (titleLower.includes(term)) score += 20;
        if (sectionLower.includes(term)) score += 10;
        if (excerptLower.includes(term)) score += 5;
      });

      // Boost score for exact phrase matches in excerpt
      if (excerptLower.includes(query)) score += 15;

      return { ...item, score };
    });

    // Filter and sort by score
    const filtered = scoredResults
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    setResults(filtered);
  };

  // Function to highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    let highlightedText = text;

    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-primary/20 text-primary">$1</mark>');
    });

    return highlightedText;
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    performSearch(value);
    setIsOpen(true);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    router.push(result.path);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Handle clear search
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => document.removeEventListener('keydown', handleKeyboardShortcut);
  }, []);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-input bg-background text-foreground rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
        {!query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-muted-foreground bg-muted rounded border">
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      {/* Search Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto animate-slide-in-top-doc">
          <div className="p-2">
            {results.map((result, index) => (
              <button
                key={result.path}
                onClick={() => handleResultClick(result)}
                className={`w-full text-left p-3 rounded-md transition-all-smooth hover:transform hover:scale-[1.02] animate-fade-in ${
                  index === selectedIndex
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted/50'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start space-x-3">
                  <DocumentTextIcon className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4
                        className="text-sm font-medium text-foreground truncate"
                        dangerouslySetInnerHTML={{ __html: highlightText(result.title, query) }}
                      />
                      <ChevronRightIcon className="h-3 w-3 text-muted-foreground ml-2 flex-shrink-0" />
                    </div>
                    <p
                      className="text-xs text-muted-foreground mt-1"
                      dangerouslySetInnerHTML={{ __html: highlightText(result.section, query) }}
                    />
                    <p
                      className="text-xs text-muted-foreground mt-1 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: highlightText(result.excerpt, query) }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && query && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 animate-slide-in-top-doc">
          <div className="p-4 text-center">
            <MagnifyingGlassIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-muted-foreground">
              No results found for "{query}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
