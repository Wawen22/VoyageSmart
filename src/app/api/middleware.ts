import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    // Inizializza il client Supabase con i cookies
    const supabase = createRouteHandlerClient({ cookies });

    // Verifica autenticazione
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication error', details: sessionError.message },
        { status: 401 }
      );
    }

    console.log('Auth middleware - Session check result:', session ? 'Session found' : 'No session');

    if (!session) {
      // Prova a ottenere il token dall'header di autorizzazione
      const authHeader = request.headers.get('authorization');

      console.log('Auth middleware - Authorization header:', authHeader ? 'Present' : 'Not present');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('No session or authorization header found');
        return NextResponse.json(
          { error: 'Unauthorized - No active session found' },
          { status: 401 }
        );
      }

      // Estrai il token
      const token = authHeader.split(' ')[1];

      // Verifica il token
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        console.error('Invalid token:', userError);
        return NextResponse.json(
          { error: 'Unauthorized - Invalid token' },
          { status: 401 }
        );
      }

      // Passa l'utente al handler
      return handler(request, user);
    }

    // Passa l'utente della sessione al handler
    return handler(request, session.user);
  } catch (error: any) {
    console.error('Error in auth middleware:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
