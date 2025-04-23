import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { withAuth } from '@/app/api/middleware';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      console.log('Debug API - Processing request for user:', user.id);
      const supabase = createRouteHandlerClient({ cookies });
      
      // Verifica se l'utente esiste nella tabella user_subscriptions
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (subscriptionError) {
        console.error('Debug API - Error fetching subscription data:', subscriptionError);
        return NextResponse.json(
          { error: 'Error fetching subscription data', details: subscriptionError.message },
          { status: 500 }
        );
      }
      
      // Prova a creare una sottoscrizione predefinita
      if (!subscriptionData) {
        console.log('Debug API - No subscription found for user, creating default subscription');
        const { data: insertData, error: createError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            tier: 'free',
            status: 'active',
            valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 anno da ora
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        if (createError) {
          console.error('Debug API - Error creating default subscription:', createError);
          return NextResponse.json(
            { 
              error: 'Error creating default subscription', 
              details: createError.message,
              errorCode: createError.code,
              hint: createError.hint,
              rls: "Potrebbe essere un problema di Row Level Security (RLS). Verifica le policy RLS sulla tabella user_subscriptions."
            },
            { status: 500 }
          );
        }
        
        console.log('Debug API - Default subscription created for user');
        return NextResponse.json({ 
          success: true, 
          message: 'Default subscription created',
          subscription: insertData
        });
      }
      
      // Prova ad aggiornare la sottoscrizione esistente
      console.log('Debug API - Updating existing subscription');
      const { data: updateData, error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .select();
      
      if (updateError) {
        console.error('Debug API - Error updating subscription:', updateError);
        return NextResponse.json(
          { 
            error: 'Error updating subscription', 
            details: updateError.message,
            errorCode: updateError.code,
            hint: updateError.hint,
            rls: "Potrebbe essere un problema di Row Level Security (RLS). Verifica le policy RLS sulla tabella user_subscriptions."
          },
          { status: 500 }
        );
      }
      
      // Prova a inserire un record nella cronologia
      console.log('Debug API - Inserting test history record');
      const { error: historyError } = await supabase
        .from('subscription_history')
        .insert({
          user_id: user.id,
          event_type: 'debug_test',
          tier: 'free',
          status: 'active',
          details: { test: true, timestamp: new Date().toISOString() },
        });
      
      if (historyError) {
        console.error('Debug API - Error inserting history record:', historyError);
        return NextResponse.json(
          { 
            error: 'Error inserting history record', 
            details: historyError.message,
            errorCode: historyError.code,
            hint: historyError.hint,
            rls: "Potrebbe essere un problema di Row Level Security (RLS). Verifica le policy RLS sulla tabella subscription_history.",
            subscription: updateData || subscriptionData
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'All tests passed',
        subscription: updateData || subscriptionData,
        user: {
          id: user.id,
          email: user.email
        }
      });
    } catch (error: any) {
      console.error('Debug API - Unexpected error:', error);
      return NextResponse.json(
        { error: 'Unexpected error', details: error.message },
        { status: 500 }
      );
    }
  });
}
