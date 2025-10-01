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

// PATCH: Aggiorna un utente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verifica il token di amministrazione
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin token' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    const body = await request.json();
    const { role, subscription } = body;

    console.log('Updating user:', userId, 'with data:', { role, subscription });

    const supabase = initSupabaseAdmin();

    // Aggiorna il ruolo dell'utente se fornito
    if (role !== undefined) {
      const { error: roleError } = await supabase
        .from('users')
        .update({
          preferences: { role },
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (roleError) {
        console.error('Error updating user role:', roleError);
        return NextResponse.json(
          { error: 'Error updating user role', details: roleError.message },
          { status: 500 }
        );
      }
    }

    // Aggiorna la sottoscrizione dell'utente se fornita
    if (subscription) {
      const { tier, status, valid_until } = subscription;

      // Prima verifica se l'utente ha già una sottoscrizione
      const { data: existingSubscription, error: checkError } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing subscription:', checkError);
        return NextResponse.json(
          { error: 'Error checking existing subscription', details: checkError.message },
          { status: 500 }
        );
      }

      if (existingSubscription) {
        // Aggiorna la sottoscrizione esistente
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            tier,
            status,
            valid_until,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          return NextResponse.json(
            { error: 'Error updating subscription', details: updateError.message },
            { status: 500 }
          );
        }
      } else {
        // Crea una nuova sottoscrizione
        const { error: createError } = await supabase
          .from('user_subscriptions')
          .insert([{
            user_id: userId,
            tier,
            status,
            valid_until,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (createError) {
          console.error('Error creating subscription:', createError);
          return NextResponse.json(
            { error: 'Error creating subscription', details: createError.message },
            { status: 500 }
          );
        }
      }

      // Registra l'evento nella cronologia delle sottoscrizioni
      const { error: historyError } = await supabase
        .from('subscription_history')
        .insert([{
          user_id: userId,
          event_type: 'admin_update',
          tier,
          status,
          event_timestamp: new Date().toISOString(),
          details: {
            updated_by: 'admin',
            previous_tier: existingSubscription ? 'unknown' : 'none',
            new_tier: tier,
            admin_action: true
          }
        }]);

      if (historyError) {
        console.error('Error recording subscription history:', historyError);
        // Non blocchiamo il processo se la registrazione fallisce
      }
    }

    // Ottieni i dati aggiornati dell'utente
    const { data: updatedUser, error: fetchError } = await supabase
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
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated user:', fetchError);
      return NextResponse.json(
        { error: 'Error fetching updated user', details: fetchError.message },
        { status: 500 }
      );
    }

    // Ottieni la sottoscrizione aggiornata separatamente
    const { data: updatedSubscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error fetching updated subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Error fetching updated subscription', details: subscriptionError.message },
        { status: 500 }
      );
    }

    // Trasforma i dati per il frontend
    const transformedUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      full_name: updatedUser.full_name,
      avatar_url: updatedUser.avatar_url,
      role: updatedUser.preferences?.role || 'user',
      created_at: updatedUser.created_at,
      last_login: updatedUser.last_login,
      subscription: updatedSubscription || {
        tier: 'free',
        status: 'inactive',
        valid_until: null
      }
    };

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: transformedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Elimina un utente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verifica il token di amministrazione
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin token' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    console.log('Deleting user:', userId);

    const supabase = initSupabaseAdmin();

    // Elimina l'utente (le foreign key constraints si occuperanno delle tabelle correlate)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: 'Error deleting user', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
