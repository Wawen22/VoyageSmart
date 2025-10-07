import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ArticleDetailClient from './ArticleDetailClient';

// Create Supabase client with service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    // Await params as required by Next.js 15
    const { slug } = await params;

    // Fetch article directly from Supabase
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !article) {
      return {
        title: 'Article Not Found | VoyageSmart',
      };
    }

    return {
      title: article.seo_title || `${article.title} | VoyageSmart Travel Hub`,
      description: article.seo_description || article.excerpt,
      keywords: article.seo_keywords || article.tags,
      authors: [{ name: article.author_name }],
      openGraph: {
        title: article.title,
        description: article.excerpt,
        type: 'article',
        publishedTime: article.published_at,
        modifiedTime: article.updated_at,
        authors: [article.author_name],
        images: article.featured_image_url ? [
          {
            url: article.featured_image_url,
            width: 1200,
            height: 630,
            alt: article.title,
          }
        ] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: article.title,
        description: article.excerpt,
        images: article.featured_image_url ? [article.featured_image_url] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Article | VoyageSmart',
    };
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    // Await params as required by Next.js 15
    const { slug } = await params;

    // Fetch article directly from Supabase
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !article) {
      console.error('Error fetching article:', error);
      notFound();
    }

    // Increment view count
    await supabase
      .from('articles')
      .update({ view_count: (article.view_count || 0) + 1 })
      .eq('id', article.id);

    return <ArticleDetailClient article={article} />;
  } catch (error) {
    console.error('Unexpected error in ArticlePage:', error);
    notFound();
  }
}

