'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import DocumentationSidebar from './DocumentationSidebar';
import DocumentationSearch from './DocumentationSearch';

interface DocumentationLayoutProps {
  children: React.ReactNode;
}

export default function DocumentationLayout({ children }: DocumentationLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Get breadcrumb from pathname
  const getBreadcrumb = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    if (segments.length > 1) {
      breadcrumbs.push({
        name: 'Documentation',
        href: '/documentation'
      });
      
      for (let i = 1; i < segments.length; i++) {
        const segment = segments[i];
        const href = '/' + segments.slice(0, i + 1).join('/');
        const name = segment.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        breadcrumbs.push({
          name,
          href
        });
      }
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumb();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-all-smooth lg:translate-x-0 lg:absolute lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link href="/documentation" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">VS</span>
            </div>
            <span className="font-semibold text-foreground">Documentation</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <DocumentationSearch />
        </div>

        {/* Sidebar Content */}
        <DocumentationSidebar className="flex-1" />
      </div>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Mobile menu button - only visible on mobile */}
        <div className="lg:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            <span className="ml-3 font-medium text-foreground">Documentation</span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 w-full">
          <div className="w-full px-6 py-6 lg:py-8 animate-fade-in">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-muted/30">
          <div className="px-6 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="text-sm text-muted-foreground">
                © 2025 Voyage Smart. All rights reserved.
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <Link 
                  href="https://github.com/Wawen22/VoyageSmart" 
                  target="_blank"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </Link>
                <Link 
                  href="https://github.com/Wawen22/VoyageSmart/issues" 
                  target="_blank"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Report Issue
                </Link>
                <Link 
                  href="/documentation/development/contributing" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contribute
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
