import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/hub/articles/[slug]/view
 * Increment view count for an article
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { slug } = await params;

    // Increment view count using SQL
    const { data, error } = await supabase.rpc('increment_article_views', {
      article_slug: slug
    });

    if (error) {
      // If function doesn't exist, fall back to manual increment
      const { data: article, error: fetchError } = await supabase
        .from('articles')
        .select('view_count')
        .eq('slug', slug)
        .single();

      if (fetchError) {
        console.error('Error fetching article:', fetchError);
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        );
      }

      const { error: updateError } = await supabase
        .from('articles')
        .update({ view_count: (article.view_count || 0) + 1 })
        .eq('slug', slug);

      if (updateError) {
        console.error('Error updating view count:', updateError);
        return NextResponse.json(
          { error: 'Failed to update view count' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

