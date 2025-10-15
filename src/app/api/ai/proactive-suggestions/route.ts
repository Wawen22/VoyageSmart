import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import {
  ProactiveSuggestionStatus,
  triggerProactiveSuggestions,
  listProactiveSuggestions
} from '@/lib/services/proactiveSuggestionService';

export const dynamic = 'force-dynamic';

async function resolveUserId(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session?.user?.id) {
    return session.user.id;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const supabaseAnonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
      error
    } = await supabaseAnonClient.auth.getUser(token);

    if (!error && user?.id) {
      return user.id;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const statusParam = request.nextUrl.searchParams.get('status');
    const statuses = statusParam
      ? statusParam
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean) as ProactiveSuggestionStatus[]
      : undefined;

    const suggestions = await listProactiveSuggestions(userId, {
      status: statuses
    });

    return NextResponse.json({ success: true, suggestions });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch proactive suggestions',
        details: error?.message ?? 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const trigger = body?.trigger ?? 'app_open';

    if (trigger !== 'app_open' && trigger !== 'location_ping') {
      return NextResponse.json(
        { error: 'Invalid trigger value' },
        { status: 400 }
      );
    }

    const context = body?.context;
    const result = await triggerProactiveSuggestions({
      userId,
      trigger,
      context
    });

    return NextResponse.json({
      success: true,
      suggestions: result.suggestions,
      newlyCreated: result.newlyCreated
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to trigger proactive suggestions',
        details: error?.message ?? 'Unknown error'
      },
      { status: 500 }
    );
  }
}
