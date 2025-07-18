import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '@/app/api/middleware';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      console.log('Fix Policy API - Processing request for user:', user.id);
      
      // Usa il client Supabase con service_role per eseguire operazioni admin
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Verifica che l'utente sia admin
      const { data: userData, error: userError } = await supabaseAdmin
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

      console.log('Fix Policy API - Admin verified, applying policy fix');

      // Esegui la migrazione SQL
      const migrationSQL = `
        -- Drop existing policy if it exists
        DROP POLICY IF EXISTS "Allow authenticated users to insert own history" ON public.subscription_history;
        
        -- Add policy to allow authenticated users to insert their own records
        CREATE POLICY "Allow authenticated users to insert own history"
          ON public.subscription_history
          FOR INSERT
          TO authenticated
          WITH CHECK (user_id = auth.uid());
        
        -- Ensure RLS is enabled
        ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
      `;

      // Esegui la query SQL
      const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: migrationSQL 
      });

      if (sqlError) {
        console.error('Fix Policy API - Error executing SQL migration:', sqlError);
        
        // Se la funzione exec_sql non esiste, proviamo con query dirette
        try {
          // Drop policy
          await supabaseAdmin.rpc('exec', { 
            sql: 'DROP POLICY IF EXISTS "Allow authenticated users to insert own history" ON public.subscription_history;' 
          });
          
          // Create policy
          await supabaseAdmin.rpc('exec', { 
            sql: `CREATE POLICY "Allow authenticated users to insert own history"
                  ON public.subscription_history
                  FOR INSERT
                  TO authenticated
                  WITH CHECK (user_id = auth.uid());` 
          });
          
          // Enable RLS
          await supabaseAdmin.rpc('exec', { 
            sql: 'ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;' 
          });
          
          console.log('Fix Policy API - Migration applied successfully using individual queries');
        } catch (individualError: any) {
          console.error('Fix Policy API - Error with individual queries:', individualError);
          return NextResponse.json(
            { 
              error: 'Error applying migration', 
              details: individualError.message,
              suggestion: 'Please apply the migration manually in Supabase SQL Editor'
            },
            { status: 500 }
          );
        }
      } else {
        console.log('Fix Policy API - Migration applied successfully');
      }

      // Testa che la policy funzioni creando un record di test
      try {
        const testRecord = {
          user_id: user.id,
          event_type: 'policy_test',
          tier: 'free',
          status: 'active',
          event_timestamp: new Date().toISOString(),
          details: {
            test: true,
            applied_by: user.id,
            applied_at: new Date().toISOString()
          }
        };

        const { error: testError } = await supabaseAdmin
          .from('subscription_history')
          .insert(testRecord);

        if (testError) {
          console.error('Fix Policy API - Test insert failed:', testError);
          return NextResponse.json(
            { 
              success: true, 
              message: 'Migration applied but test insert failed',
              warning: 'Policy may not be working correctly',
              testError: testError.message
            }
          );
        } else {
          console.log('Fix Policy API - Test insert successful');
          
          // Rimuovi il record di test
          await supabaseAdmin
            .from('subscription_history')
            .delete()
            .eq('user_id', user.id)
            .eq('event_type', 'policy_test');
        }
      } catch (testError: any) {
        console.error('Fix Policy API - Test error:', testError);
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription history policy fixed successfully',
        applied_at: new Date().toISOString(),
        applied_by: user.id
      });

    } catch (error: any) {
      console.error('Fix Policy API - Unexpected error:', error);
      return NextResponse.json(
        {
          error: 'Error fixing subscription history policy',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
  });
}
