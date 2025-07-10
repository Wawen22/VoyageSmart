import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Token di amministrazione hardcoded (in un'app di produzione, usare un sistema più sicuro)
const ADMIN_TOKEN = 'voyagesmart-admin';

// Funzione per verificare il token di amministrazione
function verifyAdminToken(request: NextRequest) {
  const token = request.headers.get('X-Admin-Token');
  if (token !== ADMIN_TOKEN) {
    return false;
  }
  return true;
}

// Funzione per inizializzare Supabase con privilegi admin
function initSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET: Ottieni tutti gli utenti con filtri
export async function GET(request: NextRequest) {
  try {
    // Verifica il token di amministrazione
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin token' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const tier = url.searchParams.get('tier') || '';
    const status = url.searchParams.get('status') || '';
    const role = url.searchParams.get('role') || '';

    const offset = (page - 1) * limit;



    const supabase = initSupabaseAdmin();

    // Query base per gli utenti
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        preferences,
        created_at,
        last_login
      `)
      .order('created_at', { ascending: false });

    // Applica filtri di ricerca
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Ottieni tutti i risultati per il conteggio totale
    const { data: allUsers, error: countError } = await query;

    if (countError) {
      return NextResponse.json(
        { error: 'Error counting users', details: countError.message },
        { status: 500 }
      );
    }

    // Ottieni le sottoscrizioni per tutti gli utenti
    const userIds = allUsers?.map(user => user.id) || [];
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .in('user_id', userIds)
      .order('updated_at', { ascending: false });

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      return NextResponse.json(
        { error: 'Error fetching subscriptions', details: subscriptionsError.message },
        { status: 500 }
      );
    }

    // Crea una mappa delle sottoscrizioni per user_id
    const subscriptionMap = new Map();
    subscriptions?.forEach(sub => {
      subscriptionMap.set(sub.user_id, sub);
    });

    // Combina utenti con le loro sottoscrizioni
    let usersWithSubscriptions = allUsers?.map(user => ({
      ...user,
      subscription: subscriptionMap.get(user.id) || {
        tier: 'free',
        status: 'inactive',
        valid_until: null
      }
    })) || [];

    // Filtra i risultati in base ai criteri
    if (tier) {
      usersWithSubscriptions = usersWithSubscriptions.filter(user =>
        user.subscription.tier === tier
      );
    }

    if (status) {
      usersWithSubscriptions = usersWithSubscriptions.filter(user =>
        user.subscription.status === status
      );
    }

    if (role) {
      usersWithSubscriptions = usersWithSubscriptions.filter(user =>
        user.preferences?.role === role || (role === 'user' && !user.preferences?.role)
      );
    }

    const totalCount = usersWithSubscriptions.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Applica paginazione
    const paginatedUsers = usersWithSubscriptions.slice(offset, offset + limit);

    // Trasforma i dati per il frontend
    const transformedUsers = paginatedUsers.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      role: user.preferences?.role || 'user',
      created_at: user.created_at,
      last_login: user.last_login,
      subscription: user.subscription
    }));

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
