/**
 * Type definitions for Travel Hub articles and categories
 */

export type ArticleStatus = 'draft' | 'published' | 'archived';

export type ArticleCategory = 
  | 'destinations'
  | 'travel-tips'
  | 'planning-tools'
  | 'news-updates'
  | 'culture-experience'
  | 'inspiration';

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string;
  featured_image_url?: string;
  author_id?: string;
  author_name: string;
  author_avatar_url?: string;
  category: ArticleCategory;
  tags: string[];
  status: ArticleStatus;
  is_featured: boolean;
  view_count: number;
  read_time_minutes?: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
}

export interface ArticleCategoryData {
  id: string;
  name: string;
  slug: ArticleCategory;
  description?: string;
  icon?: string;
  color?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  featured_image_url?: string;
  author_name: string;
  author_avatar_url?: string;
  category: ArticleCategory;
  tags: string[];
  is_featured: boolean;
  view_count: number;
  read_time_minutes?: number;
  published_at?: string;
}

export interface ArticleFilters {
  category?: ArticleCategory;
  tag?: string;
  search?: string;
  status?: ArticleStatus;
  featured?: boolean;
}

export interface ArticleFormData {
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string;
  featured_image_url?: string;
  author_name: string;
  author_avatar_url?: string;
  category: ArticleCategory;
  tags: string[];
  status: ArticleStatus;
  is_featured: boolean;
  published_at?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
}

export interface ArticleAnalytics {
  total_articles: number;
  published_articles: number;
  draft_articles: number;
  total_views: number;
  most_viewed: ArticleListItem[];
  popular_categories: {
    category: ArticleCategory;
    count: number;
  }[];
  recent_articles: ArticleListItem[];
}

export interface RelatedArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  featured_image_url?: string;
  category: ArticleCategory;
  read_time_minutes?: number;
}

// Category metadata for UI
export const CATEGORY_METADATA: Record<ArticleCategory, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  'destinations': {
    name: 'Destinations',
    description: 'Explore countries, cities, and hidden gems',
    icon: 'Globe',
    color: '#3b82f6'
  },
  'travel-tips': {
    name: 'Travel Tips',
    description: 'Practical advice and travel hacks',
    icon: 'Lightbulb',
    color: '#10b981'
  },
  'planning-tools': {
    name: 'Planning & Tools',
    description: 'Trip planning guides and useful tools',
    icon: 'ClipboardList',
    color: '#8b5cf6'
  },
  'news-updates': {
    name: 'News & Updates',
    description: 'Latest travel news and regulations',
    icon: 'Newspaper',
    color: '#f97316'
  },
  'culture-experience': {
    name: 'Culture & Experience',
    description: 'Local customs and cultural insights',
    icon: 'Users',
    color: '#ec4899'
  },
  'inspiration': {
    name: 'Inspiration',
    description: 'Travel stories and bucket list ideas',
    icon: 'Sparkles',
    color: '#6366f1'
  }
};

