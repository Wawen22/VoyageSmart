import React from 'react';
import { notFound } from 'next/navigation';
import DocumentationLayout from '@/components/documentation/DocumentationLayout';
import MarkdownRenderer from '@/components/documentation/MarkdownRenderer';
import { getDocumentationContent, getDocumentationSection } from '@/lib/documentation';

interface FilePageProps {
  params: Promise<{
    section: string;
    file: string;
  }>;
}

export default async function FilePage({ params }: FilePageProps) {
  const { section, file } = await params;
  
  try {
    const content = await getDocumentationContent(section, file);
    const sectionInfo = getDocumentationSection(section);
    
    if (!content || !sectionInfo) {
      notFound();
    }

    // Convert file name to title
    const fileTitle = file
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return (
      <DocumentationLayout>
        <div className="space-y-6">
          {/* File Header */}
          <div className="border-b border-border pb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`p-2 rounded-lg bg-muted/50 ${sectionInfo.color}`}>
                <sectionInfo.icon className="h-5 w-5" />
              </div>
              <div className="text-sm text-muted-foreground">
                {sectionInfo.title}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              {fileTitle}
            </h1>
          </div>

          {/* Content */}
          <MarkdownRenderer content={content} />
        </div>
      </DocumentationLayout>
    );
  } catch (error) {
    console.error('Error loading file:', error);
    notFound();
  }
}

// Generate static params for known files
export async function generateStaticParams() {
  // This would ideally be generated from the actual file structure
  // For now, we'll define the known combinations
  const params = [
    // Getting Started
    { section: 'getting-started', file: 'installation' },
    { section: 'getting-started', file: 'configuration' },
    { section: 'getting-started', file: 'first-steps' },
    
    // Architecture
    { section: 'architecture', file: 'database-schema' },
    { section: 'architecture', file: 'frontend-architecture' },
    { section: 'architecture', file: 'backend-architecture' },
    { section: 'architecture', file: 'security' },
    
    // Features
    { section: 'features', file: 'trip-management' },
    { section: 'features', file: 'itinerary-planning' },
    { section: 'features', file: 'accommodations' },
    { section: 'features', file: 'transportation' },
    { section: 'features', file: 'expenses' },
    { section: 'features', file: 'collaboration' },
    { section: 'features', file: 'ai-features' },
    
    // Development
    { section: 'development', file: 'code-standards' },
    { section: 'development', file: 'security-implementations' },
    { section: 'development', file: 'testing' },
    { section: 'development', file: 'deployment' },
    { section: 'development', file: 'contributing' },
    { section: 'development', file: 'ui-ux-improvements' },
    
    // Integrations
    { section: 'integrations', file: 'supabase' },
    { section: 'integrations', file: 'stripe' },
    { section: 'integrations', file: 'mapbox' },
    { section: 'integrations', file: 'gemini-ai' },
    
    // API
    { section: 'api', file: 'authentication' },
    { section: 'api', file: 'trips' },
    { section: 'api', file: 'itinerary' },
    { section: 'api', file: 'expenses' },
    { section: 'api', file: 'ai-endpoints' },
    
    // Tutorials
    { section: 'tutorials', file: 'creating-a-trip' },
    { section: 'tutorials', file: 'planning-an-itinerary' },
    { section: 'tutorials', file: 'managing-expenses' },
    { section: 'tutorials', file: 'using-ai-features' },
    
    // Technical
    { section: 'technical', file: 'development-roadmap' },
    { section: 'technical', file: 'subscription-implementation' },
    { section: 'technical', file: 'admin-user-management' },
    { section: 'technical', file: 'ai-documentation' },
    { section: 'technical', file: 'cron-job-setup' },
    { section: 'technical', file: 'technical-documentation' },
  ];

  return params;
}
