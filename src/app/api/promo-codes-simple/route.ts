import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - don't pre-render this route during build
export const dynamic = 'force-dynamic';

// Inizializza il client Supabase con la chiave anonima
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

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

// GET: Ottieni tutti i codici promo
export async function GET(request: NextRequest) {
  try {
    // Verifica il token di amministrazione
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin token' },
        { status: 401 }
      );
    }

    console.log('Fetching promo codes...');

    // Ottieni tutti i codici promo
    const { data: promoCodes, error: promoCodesError } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (promoCodesError) {
      console.error('Error fetching promo codes:', promoCodesError);
      return NextResponse.json(
        { error: 'Error fetching promo codes', details: promoCodesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ promoCodes }, { status: 200 });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Unexpected error', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Crea un nuovo codice promo
export async function POST(request: NextRequest) {
  try {
    // Verifica il token di amministrazione
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin token' },
        { status: 401 }
      );
    }

    // Ottieni i dati dalla richiesta
    const body = await request.json();
    const { code, tier, max_uses, expires_at } = body;

    console.log('Creating promo code with data:', { code, tier, max_uses, expires_at });

    // Validazione
    if (!code) {
      return NextResponse.json(
        { error: 'Promo code is required' },
        { status: 400 }
      );
    }

    if (!['free', 'premium', 'ai'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be one of: free, premium, ai' },
        { status: 400 }
      );
    }

    // Verifica se il codice esiste già
    const { data: existingCode, error: existingCodeError } = await supabaseAdmin
      .from('promo_codes')
      .select('id')
      .eq('code', code)
      .single();

    if (existingCodeError && existingCodeError.code !== 'PGRST116') {
      console.error('Error checking existing code:', existingCodeError);
      return NextResponse.json(
        { error: 'Error checking existing code', details: existingCodeError.message },
        { status: 500 }
      );
    }

    if (existingCode) {
      return NextResponse.json(
        { error: 'Promo code already exists' },
        { status: 400 }
      );
    }

    // Crea il nuovo codice promo
    const now = new Date().toISOString();
    const promoCodeData = {
      code,
      tier,
      max_uses,
      expires_at: expires_at || null,
      used_count: 0,
      is_active: true,
      description: `Codice promozionale per piano ${tier}`,
      created_at: now,
      updated_at: now,
    };

    console.log('Inserting promo code with data:', promoCodeData);

    const { data: newPromoCode, error: createError } = await supabaseAdmin
      .from('promo_codes')
      .insert([promoCodeData])
      .select()
      .single();

    if (createError) {
      console.error('Error creating promo code:', createError);
      return NextResponse.json(
        { error: 'Error creating promo code', details: createError.message, code: createError.code },
        { status: 500 }
      );
    }

    console.log('Promo code created successfully:', newPromoCode);

    return NextResponse.json({ promoCode: newPromoCode }, { status: 201 });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Unexpected error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Elimina un codice promo
export async function DELETE(request: NextRequest) {
  try {
    // Verifica il token di amministrazione
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin token' },
        { status: 401 }
      );
    }

    // Ottieni l'ID dalla query string
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Promo code ID is required' },
        { status: 400 }
      );
    }

    // Elimina il codice promo
    const { error: deleteError } = await supabaseAdmin
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting promo code:', deleteError);
      return NextResponse.json(
        { error: 'Error deleting promo code', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Unexpected error', details: error.message },
      { status: 500 }
    );
  }
}
