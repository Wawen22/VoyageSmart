import React from 'react';
import { notFound } from 'next/navigation';
import DocumentationLayout from '@/components/documentation/DocumentationLayout';
import MarkdownRenderer from '@/components/documentation/MarkdownRenderer';
import { getDocumentationContent, getDocumentationSection } from '@/lib/documentation';

interface SectionPageProps {
  params: Promise<{
    section: string;
  }>;
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { section } = await params;
  
  try {
    // Try to get the main README for the section
    const content = await getDocumentationContent(section, 'README');
    const sectionInfo = getDocumentationSection(section);
    
    if (!content || !sectionInfo) {
      notFound();
    }

    return (
      <DocumentationLayout>
        <div className="space-y-6">
          {/* Section Header */}
          <div className="border-b border-border pb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-lg bg-muted/50 ${sectionInfo.color}`}>
                <sectionInfo.icon className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                {sectionInfo.title}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              {sectionInfo.description}
            </p>
          </div>

          {/* Content */}
          <MarkdownRenderer content={content} />
        </div>
      </DocumentationLayout>
    );
  } catch (error) {
    console.error('Error loading section:', error);
    notFound();
  }
}

// Generate static params for known sections
export async function generateStaticParams() {
  const sections = [
    'getting-started',
    'architecture', 
    'features',
    'development',
    'integrations',
    'api',
    'tutorials',
    'technical'
  ];

  return sections.map((section) => ({
    section,
  }));
}
