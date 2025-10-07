'use client';

import { Badge } from '@/components/ui/badge';
import { ArticleCategory, CATEGORY_METADATA } from '@/types/article';
import { 
  Globe, 
  Lightbulb, 
  ClipboardList, 
  Newspaper, 
  Users, 
  Sparkles,
  LucideIcon
} from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: ArticleCategory | 'all';
  onCategoryChange: (category: ArticleCategory | 'all') => void;
  articleCounts?: Record<ArticleCategory | 'all', number>;
}

const ICON_MAP: Record<string, LucideIcon> = {
  'Globe': Globe,
  'Lightbulb': Lightbulb,
  'ClipboardList': ClipboardList,
  'Newspaper': Newspaper,
  'Users': Users,
  'Sparkles': Sparkles,
};

export default function CategoryFilter({ 
  selectedCategory, 
  onCategoryChange,
  articleCounts = {}
}: CategoryFilterProps) {
  const categories: Array<{ slug: ArticleCategory | 'all'; name: string; icon: string; color: string }> = [
    { slug: 'all', name: 'All Articles', icon: 'Globe', color: '#6b7280' },
    ...Object.entries(CATEGORY_METADATA).map(([slug, meta]) => ({
      slug: slug as ArticleCategory,
      name: meta.name,
      icon: meta.icon,
      color: meta.color
    }))
  ];

  return (
    <div className="w-full">
      {/* Desktop: Horizontal Scroll */}
      <div className="hidden md:flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => {
          const Icon = ICON_MAP[category.icon] || Globe;
          const isActive = selectedCategory === category.slug;
          const count = articleCounts[category.slug] || 0;

          return (
            <button
              key={category.slug}
              onClick={() => onCategoryChange(category.slug)}
              className={`
                flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 whitespace-nowrap
                ${isActive
                  ? 'shadow-lg scale-105'
                  : 'hover:scale-105 hover:shadow-md'
                }
              `}
              style={{
                backgroundColor: isActive ? `${category.color}20` : 'transparent',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: isActive ? `${category.color}60` : 'hsl(var(--border))',
                color: isActive ? category.color : 'hsl(var(--foreground))'
              }}
            >
              <Icon className="h-4 w-4" />
              <span>{category.name}</span>
              {count > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 text-xs"
                  style={{
                    backgroundColor: isActive ? `${category.color}30` : 'hsl(var(--muted))',
                    color: isActive ? category.color : 'hsl(var(--muted-foreground))'
                  }}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile: Grid Layout */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {categories.map((category) => {
          const Icon = ICON_MAP[category.icon] || Globe;
          const isActive = selectedCategory === category.slug;
          const count = articleCounts[category.slug] || 0;

          return (
            <button
              key={category.slug}
              onClick={() => onCategoryChange(category.slug)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl font-medium text-sm
                transition-all duration-300
                ${isActive
                  ? 'shadow-lg scale-105'
                  : 'hover:scale-105 hover:shadow-md'
                }
              `}
              style={{
                backgroundColor: isActive ? `${category.color}20` : 'transparent',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: isActive ? `${category.color}60` : 'hsl(var(--border))',
                color: isActive ? category.color : 'hsl(var(--foreground))'
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-center">{category.name}</span>
              {count > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: isActive ? `${category.color}30` : 'hsl(var(--muted))',
                    color: isActive ? category.color : 'hsl(var(--muted-foreground))'
                  }}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

