import fs from 'fs';
import path from 'path';
import { 
  RocketLaunchIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  CodeBracketIcon,
  PuzzlePieceIcon,
  CogIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export interface DocumentationSection {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const sections: Record<string, DocumentationSection> = {
  'getting-started': {
    title: 'Getting Started',
    description: 'Everything you need to know to get up and running with VoyageSmart',
    icon: RocketLaunchIcon,
    color: 'text-blue-500'
  },
  'architecture': {
    title: 'Architecture',
    description: 'Understand how VoyageSmart is built and structured',
    icon: BuildingOfficeIcon,
    color: 'text-purple-500'
  },
  'features': {
    title: 'Features',
    description: 'Detailed documentation of all VoyageSmart features',
    icon: SparklesIcon,
    color: 'text-green-500'
  },
  'development': {
    title: 'Development',
    description: 'Resources and guidelines for developers',
    icon: CodeBracketIcon,
    color: 'text-orange-500'
  },
  'integrations': {
    title: 'Integrations',
    description: 'Learn about external services and APIs',
    icon: PuzzlePieceIcon,
    color: 'text-pink-500'
  },
  'api': {
    title: 'API',
    description: 'API documentation for developers',
    icon: CogIcon,
    color: 'text-indigo-500'
  },
  'tutorials': {
    title: 'Tutorials',
    description: 'Step-by-step guides for common tasks',
    icon: AcademicCapIcon,
    color: 'text-cyan-500'
  },
  'technical': {
    title: 'Technical Documentation',
    description: 'Technical implementation details and roadmaps',
    icon: ClipboardDocumentListIcon,
    color: 'text-red-500'
  }
};

export function getDocumentationSection(sectionKey: string): DocumentationSection | null {
  return sections[sectionKey] || null;
}

export async function getDocumentationContent(section: string, file: string): Promise<string | null> {
  try {
    const documentationPath = path.join(process.cwd(), 'Documentation');
    
    // Handle different file patterns
    let filePath: string;
    
    if (file === 'README') {
      filePath = path.join(documentationPath, section, 'README.md');
    } else {
      // Try different extensions and naming patterns
      const possiblePaths = [
        path.join(documentationPath, section, `${file}.md`),
        path.join(documentationPath, section, `${file.toUpperCase()}.md`),
        path.join(documentationPath, `${file}.md`),
        path.join(documentationPath, `${file.toUpperCase()}.md`),
      ];
      
      // For technical section, check the technical folder
      if (section === 'technical') {
        possiblePaths.unshift(
          path.join(documentationPath, 'technical', `${file}.md`),
          path.join(documentationPath, 'technical', `${file.toUpperCase()}.md`),
          path.join(documentationPath, 'technical', `${file.replace(/-/g, '_').toUpperCase()}.md`)
        );
      }
      
      filePath = '';
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          filePath = possiblePath;
          break;
        }
      }
      
      if (!filePath) {
        console.warn(`Documentation file not found for section: ${section}, file: ${file}`);
        return null;
      }
    }
    
    if (!fs.existsSync(filePath)) {
      console.warn(`Documentation file not found: ${filePath}`);
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading documentation file:', error);
    return null;
  }
}

export async function getAllDocumentationFiles(): Promise<Record<string, string[]>> {
  try {
    const documentationPath = path.join(process.cwd(), 'Documentation');
    const result: Record<string, string[]> = {};
    
    if (!fs.existsSync(documentationPath)) {
      return result;
    }
    
    const sectionDirs = fs.readdirSync(documentationPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const sectionDir of sectionDirs) {
      const sectionPath = path.join(documentationPath, sectionDir);
      const files = fs.readdirSync(sectionPath)
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace('.md', ''));
      
      result[sectionDir] = files;
    }
    
    return result;
  } catch (error) {
    console.error('Error reading documentation structure:', error);
    return {};
  }
}

export function searchDocumentation(query: string): Array<{
  title: string;
  path: string;
  section: string;
  excerpt: string;
}> {
  // This is a simplified search implementation
  // In a real application, you might want to use a more sophisticated search engine
  const results = [];
  
  // Mock search results based on the query
  const mockResults = [
    {
      title: 'Installation',
      path: '/documentation/getting-started/installation',
      section: 'Getting Started',
      excerpt: 'Learn how to install and set up VoyageSmart for development...'
    },
    {
      title: 'Database Schema',
      path: '/documentation/architecture/database-schema',
      section: 'Architecture',
      excerpt: 'Detailed overview of the database structure and relationships...'
    },
    {
      title: 'Trip Management',
      path: '/documentation/features/trip-management',
      section: 'Features',
      excerpt: 'Create, edit, and manage trips with collaborative features...'
    },
    {
      title: 'AI Features',
      path: '/documentation/features/ai-features',
      section: 'Features',
      excerpt: 'Explore AI-powered features including trip planning and recommendations...'
    },
    {
      title: 'Code Standards',
      path: '/documentation/development/code-standards',
      section: 'Development',
      excerpt: 'Coding standards and best practices for VoyageSmart development...'
    },
    {
      title: 'Supabase Integration',
      path: '/documentation/integrations/supabase',
      section: 'Integrations',
      excerpt: 'How VoyageSmart integrates with Supabase for authentication and data...'
    },
    {
      title: 'API Authentication',
      path: '/documentation/api/authentication',
      section: 'API',
      excerpt: 'Authentication endpoints and security implementation...'
    },
    {
      title: 'Creating a Trip Tutorial',
      path: '/documentation/tutorials/creating-a-trip',
      section: 'Tutorials',
      excerpt: 'Step-by-step guide to creating your first trip...'
    }
  ];
  
  if (!query.trim()) {
    return [];
  }
  
  const filtered = mockResults.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.section.toLowerCase().includes(query.toLowerCase()) ||
    item.excerpt.toLowerCase().includes(query.toLowerCase())
  );
  
  return filtered.slice(0, 8);
}
