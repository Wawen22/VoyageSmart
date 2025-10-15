import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import {
  ProactiveSuggestionStatus,
  updateProactiveSuggestionStatus
} from '@/lib/services/proactiveSuggestionService';

export const dynamic = 'force-dynamic';

function isValidStatus(status: string): status is ProactiveSuggestionStatus {
  return ['pending', 'delivered', 'read', 'dismissed'].includes(status);
}

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    if (!status || !isValidStatus(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const suggestion = await updateProactiveSuggestionStatus(
      userId,
      params.id,
      status
    );

    return NextResponse.json({ success: true, suggestion });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to update suggestion',
        details: error?.message ?? 'Unknown error'
      },
      { status: 500 }
    );
  }
}
