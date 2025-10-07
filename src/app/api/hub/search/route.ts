import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/hub/search
 * Search articles using full-text search
 * Query params: q (search query), limit
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    // Use PostgreSQL full-text search
    const { data, error } = await supabase
      .from('articles')
      .select('id, slug, title, excerpt, category, featured_image_url, read_time_minutes')
      .eq('status', 'published')
      .textSearch('title', query, {
        type: 'websearch',
        config: 'english'
      })
      .limit(limit);

    if (error) {
      console.error('Error searching articles:', error);
      
      // Fallback to simple ILIKE search if full-text search fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('articles')
        .select('id, slug, title, excerpt, category, featured_image_url, read_time_minutes')
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
        .limit(limit);

      if (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
        return NextResponse.json(
          { error: 'Search failed', details: fallbackError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(fallbackData || []);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

