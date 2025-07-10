'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  RocketLaunchIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  CodeBracketIcon,
  PuzzlePieceIcon,
  CogIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface SidebarSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  items: {
    title: string;
    path: string;
  }[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'Getting Started',
    icon: RocketLaunchIcon,
    path: '/documentation/getting-started',
    items: [
      { title: 'Installation', path: '/documentation/getting-started/installation' },
      { title: 'Configuration', path: '/documentation/getting-started/configuration' },
      { title: 'First Steps', path: '/documentation/getting-started/first-steps' },
    ]
  },
  {
    title: 'Architecture',
    icon: BuildingOfficeIcon,
    path: '/documentation/architecture',
    items: [
      { title: 'Database Schema', path: '/documentation/architecture/database-schema' },
      { title: 'Frontend Architecture', path: '/documentation/architecture/frontend-architecture' },
      { title: 'Backend Architecture', path: '/documentation/architecture/backend-architecture' },
      { title: 'Security', path: '/documentation/architecture/security' },
    ]
  },
  {
    title: 'Features',
    icon: SparklesIcon,
    path: '/documentation/features',
    items: [
      { title: 'Trip Management', path: '/documentation/features/trip-management' },
      { title: 'Itinerary Planning', path: '/documentation/features/itinerary-planning' },
      { title: 'Accommodations', path: '/documentation/features/accommodations' },
      { title: 'Transportation', path: '/documentation/features/transportation' },
      { title: 'Expenses', path: '/documentation/features/expenses' },
      { title: 'Collaboration', path: '/documentation/features/collaboration' },
      { title: 'AI Features', path: '/documentation/features/ai-features' },
    ]
  },
  {
    title: 'Development',
    icon: CodeBracketIcon,
    path: '/documentation/development',
    items: [
      { title: 'Code Standards', path: '/documentation/development/code-standards' },
      { title: 'Testing Framework', path: '/documentation/development/testing-framework' },
      { title: 'Security Implementations', path: '/documentation/development/security-implementations' },
      { title: 'Testing', path: '/documentation/development/testing' },
      { title: 'Deployment', path: '/documentation/development/deployment' },
      { title: 'Contributing', path: '/documentation/development/contributing' },
      { title: 'UI/UX Improvements', path: '/documentation/development/ui-ux-improvements' },
    ]
  },
  {
    title: 'Integrations',
    icon: PuzzlePieceIcon,
    path: '/documentation/integrations',
    items: [
      { title: 'Supabase', path: '/documentation/integrations/supabase' },
      { title: 'Stripe', path: '/documentation/integrations/stripe' },
      { title: 'Mapbox', path: '/documentation/integrations/mapbox' },
      { title: 'Gemini AI', path: '/documentation/integrations/gemini-ai' },
    ]
  },
  {
    title: 'API',
    icon: CogIcon,
    path: '/documentation/api',
    items: [
      { title: 'Authentication', path: '/documentation/api/authentication' },
      { title: 'Trips', path: '/documentation/api/trips' },
      { title: 'Itinerary', path: '/documentation/api/itinerary' },
      { title: 'Expenses', path: '/documentation/api/expenses' },
      { title: 'AI Endpoints', path: '/documentation/api/ai-endpoints' },
    ]
  },
  {
    title: 'Tutorials',
    icon: AcademicCapIcon,
    path: '/documentation/tutorials',
    items: [
      { title: 'Creating a Trip', path: '/documentation/tutorials/creating-a-trip' },
      { title: 'Planning an Itinerary', path: '/documentation/tutorials/planning-an-itinerary' },
      { title: 'Managing Expenses', path: '/documentation/tutorials/managing-expenses' },
      { title: 'Using AI Features', path: '/documentation/tutorials/using-ai-features' },
    ]
  },
  {
    title: 'Technical Documentation',
    icon: ClipboardDocumentListIcon,
    path: '/documentation/technical',
    items: [
      { title: 'Development Roadmap', path: '/documentation/technical/development-roadmap' },
      { title: 'Subscription Implementation', path: '/documentation/technical/subscription-implementation' },
      { title: 'Admin User Management', path: '/documentation/technical/admin-user-management' },
      { title: 'AI Documentation', path: '/documentation/technical/ai-documentation' },
      { title: 'Cron Job Setup', path: '/documentation/technical/cron-job-setup' },
      { title: 'Technical Documentation', path: '/documentation/technical/technical-documentation' },
    ]
  },
];

interface DocumentationSidebarProps {
  className?: string;
}

export default function DocumentationSidebar({ className = '' }: DocumentationSidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Auto-expand section based on current path
  useEffect(() => {
    const currentSection = sidebarSections.find(section => 
      pathname.startsWith(section.path) || 
      section.items.some(item => pathname === item.path)
    );
    
    if (currentSection) {
      setExpandedSections(prev => new Set([...prev, currentSection.path]));
    }
  }, [pathname]);

  const toggleSection = (sectionPath: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionPath)) {
        newSet.delete(sectionPath);
      } else {
        newSet.add(sectionPath);
      }
      return newSet;
    });
  };

  const isActive = (path: string) => pathname === path;
  const isSectionActive = (section: SidebarSection) => 
    pathname.startsWith(section.path) || 
    section.items.some(item => pathname === item.path);

  return (
    <nav className={`h-full overflow-y-auto ${className}`}>
      {/* Navigation Links */}
      <div className="p-4 border-b border-border">
        <div className="space-y-1">
          <Link
            href="/"
            className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
          >
            <HomeIcon className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to App</span>
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {sidebarSections.map((section, sectionIndex) => {
          const Icon = section.icon;
          const isExpanded = expandedSections.has(section.path);
          const sectionActive = isSectionActive(section);

          return (
            <div
              key={section.path}
              className="space-y-1 animate-fade-in"
              style={{ animationDelay: `${sectionIndex * 0.1}s` }}
            >
              <button
                onClick={() => toggleSection(section.path)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all-smooth hover:transform hover:scale-[1.02] ${
                  sectionActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span>{section.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>

              {isExpanded && (
                <div className="ml-6 space-y-1 animate-slide-in-top-doc">
                  {section.items.map((item, index) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`block px-3 py-2 text-sm rounded-md transition-all-smooth hover:transform hover:scale-[1.02] ${
                        isActive(item.path)
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
