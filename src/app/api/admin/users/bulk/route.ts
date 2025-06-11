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

// POST: Azioni bulk sugli utenti
export async function POST(request: NextRequest) {
  try {
    // Verifica il token di amministrazione
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, userIds, data } = body;

    console.log('Bulk action:', action, 'for users:', userIds, 'with data:', data);

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: action and userIds are required' },
        { status: 400 }
      );
    }

    const supabase = initSupabaseAdmin();
    const results = [];
    const errors = [];

    switch (action) {
      case 'updateRole':
        if (!data?.role) {
          return NextResponse.json(
            { error: 'Role is required for updateRole action' },
            { status: 400 }
          );
        }

        for (const userId of userIds) {
          try {
            const { error } = await supabase
              .from('users')
              .update({
                preferences: { role: data.role },
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);

            if (error) {
              errors.push({ userId, error: error.message });
            } else {
              results.push({ userId, success: true });
            }
          } catch (err: any) {
            errors.push({ userId, error: err.message });
          }
        }
        break;

      case 'updateSubscription':
        if (!data?.tier || !data?.status) {
          return NextResponse.json(
            { error: 'Tier and status are required for updateSubscription action' },
            { status: 400 }
          );
        }

        for (const userId of userIds) {
          try {
            // Verifica se l'utente ha già una sottoscrizione
            const { data: existingSubscription, error: checkError } = await supabase
              .from('user_subscriptions')
              .select('id')
              .eq('user_id', userId)
              .single();

            if (checkError && checkError.code !== 'PGRST116') {
              errors.push({ userId, error: checkError.message });
              continue;
            }

            if (existingSubscription) {
              // Aggiorna la sottoscrizione esistente
              const { error: updateError } = await supabase
                .from('user_subscriptions')
                .update({
                  tier: data.tier,
                  status: data.status,
                  valid_until: data.valid_until || null,
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

              if (updateError) {
                errors.push({ userId, error: updateError.message });
              } else {
                results.push({ userId, success: true });
              }
            } else {
              // Crea una nuova sottoscrizione
              const { error: createError } = await supabase
                .from('user_subscriptions')
                .insert([{
                  user_id: userId,
                  tier: data.tier,
                  status: data.status,
                  valid_until: data.valid_until || null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }]);

              if (createError) {
                errors.push({ userId, error: createError.message });
              } else {
                results.push({ userId, success: true });
              }
            }

            // Registra l'evento nella cronologia delle sottoscrizioni
            await supabase
              .from('subscription_history')
              .insert([{
                user_id: userId,
                event_type: 'admin_bulk_update',
                tier: data.tier,
                status: data.status,
                event_timestamp: new Date().toISOString(),
                details: {
                  updated_by: 'admin',
                  bulk_action: true,
                  action_type: 'updateSubscription'
                }
              }]);

          } catch (err: any) {
            errors.push({ userId, error: err.message });
          }
        }
        break;

      case 'resetSubscription':
        for (const userId of userIds) {
          try {
            // Aggiorna la sottoscrizione a free
            const { error: updateError } = await supabase
              .from('user_subscriptions')
              .update({
                tier: 'free',
                status: 'active',
                valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId);

            if (updateError) {
              errors.push({ userId, error: updateError.message });
            } else {
              results.push({ userId, success: true });

              // Registra l'evento nella cronologia delle sottoscrizioni
              await supabase
                .from('subscription_history')
                .insert([{
                  user_id: userId,
                  event_type: 'admin_reset',
                  tier: 'free',
                  status: 'active',
                  event_timestamp: new Date().toISOString(),
                  details: {
                    updated_by: 'admin',
                    bulk_action: true,
                    action_type: 'resetSubscription'
                  }
                }]);
            }
          } catch (err: any) {
            errors.push({ userId, error: err.message });
          }
        }
        break;

      case 'delete':
        for (const userId of userIds) {
          try {
            const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

            if (deleteError) {
              errors.push({ userId, error: deleteError.message });
            } else {
              results.push({ userId, success: true });
            }
          } catch (err: any) {
            errors.push({ userId, error: err.message });
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Bulk action ${action} completed`,
      results,
      errors,
      summary: {
        total: userIds.length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
