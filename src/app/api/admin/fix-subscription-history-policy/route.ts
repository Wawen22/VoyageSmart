import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '@/app/api/middleware';
import { logger } from '@/lib/logger';

// Force dynamic rendering - do not pre-render this route during build
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      logger.info('Fix Policy API - Processing request', { userId: user.id });
      
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

      logger.info('Fix Policy API - Admin verified, applying policy fix', { userId: user.id });

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
        logger.error('Fix Policy API - Error executing SQL migration', {
          error: sqlError.message,
          userId: user.id
        });
        
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
          
          logger.info('Fix Policy API - Migration applied successfully using individual queries', {
            userId: user.id
          });
        } catch (individualError: any) {
          logger.error('Fix Policy API - Error with individual queries', {
            error: individualError.message,
            userId: user.id
          });
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
        logger.info('Fix Policy API - Migration applied successfully', { userId: user.id });
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
          logger.error('Fix Policy API - Test insert failed', {
            error: testError.message,
            userId: user.id
          });
          return NextResponse.json(
            { 
              success: true, 
              message: 'Migration applied but test insert failed',
              warning: 'Policy may not be working correctly',
              testError: testError.message
            }
          );
        } else {
          logger.info('Fix Policy API - Test insert successful', { userId: user.id });
          
          // Rimuovi il record di test
          await supabaseAdmin
            .from('subscription_history')
            .delete()
            .eq('user_id', user.id)
            .eq('event_type', 'policy_test');
        }
      } catch (testError: any) {
        logger.error('Fix Policy API - Test error', {
          error: testError.message,
          userId: user.id
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription history policy fixed successfully',
        applied_at: new Date().toISOString(),
        applied_by: user.id
      });

    } catch (error: any) {
      logger.error('Fix Policy API - Unexpected error', {
        error: error.message,
        stack: error.stack,
        userId: user.id
      });
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
