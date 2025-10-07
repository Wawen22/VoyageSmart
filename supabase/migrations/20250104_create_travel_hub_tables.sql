-- Migration: Create Travel Hub Tables
-- Description: Creates tables for the Travel Hub content section
-- Date: 2025-01-04

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- Article Categories Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.article_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Icon name for UI (e.g., 'Globe', 'Lightbulb')
  color TEXT, -- Hex color for category badge
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================================================
-- Articles Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown or rich text content
  featured_image_url TEXT,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_avatar_url TEXT,
  category TEXT NOT NULL, -- References article_categories.slug
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  read_time_minutes INTEGER,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- SEO Fields
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[]
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Articles indexes
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON public.articles(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_articles_tags ON public.articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_author ON public.articles(author_id);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_articles_search ON public.articles 
USING GIN(to_tsvector('english', title || ' ' || COALESCE(subtitle, '') || ' ' || excerpt || ' ' || content));

-- Category indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.article_categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.article_categories(display_order);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;

-- Articles: Public read access for published articles
CREATE POLICY "Public can view published articles"
  ON public.articles
  FOR SELECT
  USING (status = 'published');

-- Articles: Admins can do everything
CREATE POLICY "Admins can manage all articles"
  ON public.articles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.preferences->>'isAdmin')::boolean = true
    )
  );

-- Categories: Public read access
CREATE POLICY "Public can view categories"
  ON public.article_categories
  FOR SELECT
  USING (true);

-- Categories: Admins can manage
CREATE POLICY "Admins can manage categories"
  ON public.article_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.preferences->>'isAdmin')::boolean = true
    )
  );

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.article_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate read time
CREATE OR REPLACE FUNCTION calculate_read_time(content_text TEXT)
RETURNS INTEGER AS $$
DECLARE
  word_count INTEGER;
  words_per_minute INTEGER := 200;
BEGIN
  -- Count words (split by whitespace)
  word_count := array_length(regexp_split_to_array(content_text, '\s+'), 1);
  -- Calculate read time in minutes (minimum 1 minute)
  RETURN GREATEST(1, CEIL(word_count::FLOAT / words_per_minute));
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(title_text, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to increment article view count
CREATE OR REPLACE FUNCTION increment_article_views(article_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.articles
  SET view_count = view_count + 1
  WHERE slug = article_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Seed Initial Categories
-- ============================================================================

INSERT INTO public.article_categories (name, slug, description, icon, color, display_order)
VALUES
  ('Destinations', 'destinations', 'Explore countries, cities, and hidden gems around the world', 'Globe', '#3b82f6', 1),
  ('Travel Tips', 'travel-tips', 'Practical advice, hacks, and tips for smarter travel', 'Lightbulb', '#10b981', 2),
  ('Planning & Tools', 'planning-tools', 'Guides for planning trips, booking strategies, and useful tools', 'ClipboardList', '#8b5cf6', 3),
  ('News & Updates', 'news-updates', 'Latest travel news, visa updates, and industry information', 'Newspaper', '#f97316', 4),
  ('Culture & Experience', 'culture-experience', 'Local customs, food, festivals, and cultural insights', 'Users', '#ec4899', 5),
  ('Inspiration', 'inspiration', 'Travel stories, photo essays, and bucket list ideas', 'Sparkles', '#6366f1', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.articles IS 'Stores all Travel Hub articles and blog posts';
COMMENT ON TABLE public.article_categories IS 'Categories for organizing Travel Hub content';
COMMENT ON COLUMN public.articles.status IS 'Article status: draft, published, or archived';
COMMENT ON COLUMN public.articles.is_featured IS 'Whether article should be featured on homepage';
COMMENT ON COLUMN public.articles.view_count IS 'Number of times article has been viewed';
COMMENT ON COLUMN public.articles.read_time_minutes IS 'Estimated reading time in minutes';

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant access to authenticated users (for admin operations)
GRANT SELECT ON public.articles TO authenticated;
GRANT SELECT ON public.article_categories TO authenticated;

-- Grant access to anonymous users (for public viewing)
GRANT SELECT ON public.articles TO anon;
GRANT SELECT ON public.article_categories TO anon;

