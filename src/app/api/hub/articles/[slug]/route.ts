import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/hub/articles/[slug]
 * Fetch a single article by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { slug } = await params;

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching article:', error);
      return NextResponse.json(
        { error: 'Failed to fetch article', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/hub/articles/[slug]
 * Update an article (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { slug } = await params;
    // TODO: Add admin authentication check
    const body = await request.json();

    // Recalculate read time if content changed
    if (body.content && !body.read_time_minutes) {
      const wordCount = body.content.split(/\s+/).length;
      body.read_time_minutes = Math.max(1, Math.ceil(wordCount / 200));
    }

    // Set published_at if status changed to published
    if (body.status === 'published' && !body.published_at) {
      body.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('articles')
      .update(body)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      console.error('Error updating article:', error);
      return NextResponse.json(
        { error: 'Failed to update article', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/hub/articles/[slug]
 * Delete an article (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { slug } = await params;
    // TODO: Add admin authentication check

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('slug', slug);

    if (error) {
      console.error('Error deleting article:', error);
      return NextResponse.json(
        { error: 'Failed to delete article', details: error.message },
        { status: 500 }
      );
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

