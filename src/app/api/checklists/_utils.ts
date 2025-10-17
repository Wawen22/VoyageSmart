import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ChecklistServiceError } from '@/lib/services/checklistService';

type SupabaseResponse = {
  client: SupabaseClient;
  userId: string | null;
};

export async function resolveRequestClient(request: NextRequest): Promise<SupabaseResponse> {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session?.user?.id) {
    return {
      client: supabase,
      userId: session.user.id
    };
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length);
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
      return {
        client: headerClient,
        userId: user.id
      };
    }

    return {
      client: headerClient,
      userId: null
    };
  }

  return {
    client: supabase,
    userId: null
  };
}

export function checklistErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ChecklistServiceError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  ) {
    return NextResponse.json({ error: 'Checklist already exists' }, { status: 409 });
  }

  const details = error instanceof Error ? error.message : undefined;
  return NextResponse.json(
    { error: fallbackMessage, details: details ?? fallbackMessage },
    { status: 500 }
  );
}
