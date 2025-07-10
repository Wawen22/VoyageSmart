import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DocumentationLayout from '@/components/documentation/DocumentationLayout';
import { 
  RocketLaunchIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  CodeBracketIcon,
  PuzzlePieceIcon,
  CogIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const sections = [
  {
    title: 'Getting Started',
    description: 'Everything you need to know to get up and running with VoyageSmart',
    icon: RocketLaunchIcon,
    href: '/documentation/getting-started',
    items: ['Installation', 'Configuration', 'First Steps'],
    color: 'text-blue-500'
  },
  {
    title: 'Architecture',
    description: 'Understand how VoyageSmart is built and structured',
    icon: BuildingOfficeIcon,
    href: '/documentation/architecture',
    items: ['Database Schema', 'Frontend Architecture', 'Backend Architecture', 'Security'],
    color: 'text-purple-500'
  },
  {
    title: 'Features',
    description: 'Detailed documentation of all VoyageSmart features',
    icon: SparklesIcon,
    href: '/documentation/features',
    items: ['Trip Management', 'Itinerary Planning', 'Accommodations', 'AI Features'],
    color: 'text-green-500'
  },
  {
    title: 'Development',
    description: 'Resources and guidelines for developers',
    icon: CodeBracketIcon,
    href: '/documentation/development',
    items: ['Code Standards', 'Testing', 'Security', 'Contributing'],
    color: 'text-orange-500'
  },
  {
    title: 'Integrations',
    description: 'Learn about external services and APIs',
    icon: PuzzlePieceIcon,
    href: '/documentation/integrations',
    items: ['Supabase', 'Stripe', 'Mapbox', 'Gemini AI'],
    color: 'text-pink-500'
  },
  {
    title: 'API',
    description: 'API documentation for developers',
    icon: CogIcon,
    href: '/documentation/api',
    items: ['Authentication', 'Trips', 'Itinerary', 'AI Endpoints'],
    color: 'text-indigo-500'
  },
  {
    title: 'Tutorials',
    description: 'Step-by-step guides for common tasks',
    icon: AcademicCapIcon,
    href: '/documentation/tutorials',
    items: ['Creating a Trip', 'Planning Itinerary', 'Managing Expenses'],
    color: 'text-cyan-500'
  },
  {
    title: 'Technical Documentation',
    description: 'Technical implementation details and roadmaps',
    icon: ClipboardDocumentListIcon,
    href: '/documentation/technical',
    items: ['Development Roadmap', 'Subscription System', 'Admin Management'],
    color: 'text-red-500'
  },
];

const quickLinks = [
  { title: 'Installation Guide', href: '/documentation/getting-started/installation', description: 'Get VoyageSmart running locally' },
  { title: 'API Reference', href: '/documentation/api', description: 'Complete API documentation' },
  { title: 'AI Features', href: '/documentation/features/ai-features', description: 'Learn about AI-powered features' },
  { title: 'Contributing', href: '/documentation/development/contributing', description: 'How to contribute to the project' },
];

export default function DocumentationHomePage() {
  return (
    <DocumentationLayout>
      <div className="w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex justify-center animate-float">
            <Image
              src="/images/logo-voyage_smart.png"
              alt="VoyageSmart Logo"
              width={160}
              height={64}
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground animate-slide-in-bottom">
            VoyageSmart Documentation
          </h1>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto animate-slide-in-bottom" style={{ animationDelay: '0.1s' }}>
            Welcome to the official documentation for VoyageSmart, a comprehensive travel planning application
            designed to simplify trip organization, expense management, and collaboration among travelers.
          </p>
        </div>

        {/* Quick Links */}
        <div className="bg-muted/30 rounded-lg p-6 animate-slide-in-bottom" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all-smooth hover:transform hover:scale-[1.02] group animate-fade-in"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <div>
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {link.description}
                  </p>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="space-y-6 animate-slide-in-bottom" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Documentation Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group block p-6 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-lg transition-all-smooth hover:transform hover:scale-[1.02] animate-fade-in"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg bg-muted/50 ${section.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-muted-foreground mt-2 text-sm">
                        {section.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {section.items.slice(0, 3).map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground"
                          >
                            {item}
                          </span>
                        ))}
                        {section.items.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                            +{section.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="https://github.com/Wawen22/VoyageSmart"
              target="_blank"
              className="flex items-center space-x-3 p-3 bg-card/50 rounded-lg hover:bg-card transition-colors"
            >
              <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
                <span className="text-background text-sm font-bold">GH</span>
              </div>
              <div>
                <h3 className="font-medium text-foreground">GitHub Repository</h3>
                <p className="text-xs text-muted-foreground">View source code</p>
              </div>
            </Link>
            <Link
              href="https://voyage-smart.vercel.app"
              target="_blank"
              className="flex items-center space-x-3 p-3 bg-card/50 rounded-lg hover:bg-card transition-colors"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">VS</span>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Live Demo</h3>
                <p className="text-xs text-muted-foreground">Try the application</p>
              </div>
            </Link>
            <Link
              href="https://github.com/Wawen22/VoyageSmart/issues/new"
              target="_blank"
              className="flex items-center space-x-3 p-3 bg-card/50 rounded-lg hover:bg-card transition-colors"
            >
              <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center">
                <span className="text-destructive-foreground text-sm font-bold">!</span>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Report an Issue</h3>
                <p className="text-xs text-muted-foreground">Found a bug?</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DocumentationLayout>
  );
}
