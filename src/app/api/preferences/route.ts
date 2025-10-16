import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { normalizeUserTravelPreferences, userTravelPreferencesSchema } from '@/lib/preferences';
import {
  fetchUserTravelPreferences,
  upsertUserTravelPreferences
} from '@/lib/services/userPreferencesService';

export const dynamic = 'force-dynamic';

async function resolveUserId(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session?.user?.id) {
    return { userId: session.user.id, client: supabase };
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const headerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const {
      data: { user },
      error
    } = await headerClient.auth.getUser(token);

    if (!error && user?.id) {
      return { userId: user.id, client: headerClient };
    }
  }

  return { userId: null, client: supabase };
}

export async function GET(request: NextRequest) {
  try {
    const { userId, client } = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await fetchUserTravelPreferences(client, userId);
    return NextResponse.json({
      success: true,
      preferences: normalizeUserTravelPreferences(preferences)
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to load travel preferences',
        details: error?.message ?? 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, client } = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => undefined);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const parsed = userTravelPreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const preferences = await upsertUserTravelPreferences(client, userId, parsed.data);

    return NextResponse.json({
      success: true,
      preferences: normalizeUserTravelPreferences(preferences)
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to update travel preferences',
        details: error?.message ?? 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
