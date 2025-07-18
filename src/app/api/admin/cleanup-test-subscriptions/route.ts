import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { withAuth } from '@/app/api/middleware';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      console.log('Cleanup API - Processing request for user:', user.id);
      const supabase = createRouteHandlerClient({ cookies });

      // Verifica che l'utente sia admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.preferences?.role || userData.preferences.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        );
      }

      // Trova tutte le subscription con ID Stripe di test
      const { data: testSubscriptions, error: findError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .or('stripe_subscription_id.like.%test%,stripe_customer_id.like.%test%');

      if (findError) {
        console.error('Cleanup API - Error finding test subscriptions:', findError);
        return NextResponse.json(
          { error: 'Error finding test subscriptions', details: findError.message },
          { status: 500 }
        );
      }

      if (!testSubscriptions || testSubscriptions.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No test subscriptions found to clean up',
          cleaned: 0
        });
      }

      console.log(`Cleanup API - Found ${testSubscriptions.length} test subscriptions to clean up`);

      // Aggiorna tutte le subscription di test al piano free
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          tier: 'free',
          status: 'active',
          stripe_subscription_id: null,
          stripe_customer_id: null,
          cancel_at_period_end: false,
          current_period_end: null,
          valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 anno da ora
          updated_at: new Date().toISOString(),
        })
        .or('stripe_subscription_id.like.%test%,stripe_customer_id.like.%test%');

      if (updateError) {
        console.error('Cleanup API - Error updating test subscriptions:', updateError);
        return NextResponse.json(
          { error: 'Error updating test subscriptions', details: updateError.message },
          { status: 500 }
        );
      }

      // Registra l'evento nella cronologia per ogni subscription pulita
      const now = new Date().toISOString();
      const historyEntries = testSubscriptions.map(sub => ({
        user_id: sub.user_id,
        event_type: 'admin_cleanup',
        tier: 'free',
        status: 'active',
        stripe_subscription_id: null,
        stripe_customer_id: null,
        event_timestamp: now,
        details: {
          previous_tier: sub.tier,
          previous_stripe_subscription_id: sub.stripe_subscription_id,
          previous_stripe_customer_id: sub.stripe_customer_id,
          cleaned_at: now,
          reason: 'test_data_cleanup',
          admin_user_id: user.id
        },
      }));

      const { error: historyError } = await supabase
        .from('subscription_history')
        .insert(historyEntries);

      if (historyError) {
        console.error('Cleanup API - Error recording cleanup in history:', historyError);
        // Non blocchiamo il processo se fallisce la registrazione nella cronologia
      } else {
        console.log('Cleanup API - Cleanup events recorded in history');
      }

      return NextResponse.json({
        success: true,
        message: `Successfully cleaned up ${testSubscriptions.length} test subscriptions`,
        cleaned: testSubscriptions.length,
        subscriptions: testSubscriptions.map(sub => ({
          user_id: sub.user_id,
          previous_tier: sub.tier,
          stripe_subscription_id: sub.stripe_subscription_id,
          stripe_customer_id: sub.stripe_customer_id
        }))
      });

    } catch (error: any) {
      console.error('Cleanup API - Unexpected error:', error);
      return NextResponse.json(
        {
          error: 'Error cleaning up test subscriptions',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
  });
}
