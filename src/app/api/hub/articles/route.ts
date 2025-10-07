import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/hub/articles
 * Fetch articles with optional filters
 * Query params: category, tag, search, status, featured, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'published';
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Order by published date (newest first)
    query = query.order('published_at', { ascending: false, nullsFirst: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching articles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch articles', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      articles: data || [],
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hub/articles
 * Create a new article (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const body = await request.json();

    // Calculate read time if content is provided
    let readTime = body.read_time_minutes;
    if (!readTime && body.content) {
      const wordCount = body.content.split(/\s+/).length;
      readTime = Math.max(1, Math.ceil(wordCount / 200));
    }

    // Generate slug if not provided
    let slug = body.slug;
    if (!slug && body.title) {
      slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    const articleData = {
      ...body,
      slug,
      read_time_minutes: readTime,
      published_at: body.status === 'published' && !body.published_at 
        ? new Date().toISOString() 
        : body.published_at
    };

    const { data, error } = await supabase
      .from('articles')
      .insert(articleData)
      .select()
      .single();

    if (error) {
      console.error('Error creating article:', error);
      return NextResponse.json(
        { error: 'Failed to create article', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

