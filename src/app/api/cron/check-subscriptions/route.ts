import { NextRequest, NextResponse } from 'next/server';
import { checkExpiredSubscriptions } from '@/lib/subscription-utils';

// Questo endpoint può essere chiamato da un cron job per verificare e aggiornare
// tutte le sottoscrizioni scadute
export async function GET(request: NextRequest) {
  try {
    // Verifica l'autorizzazione (opzionale, ma consigliato in produzione)
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.CRON_API_KEY;
    
    // Se è configurata una chiave API, verifica che sia corretta
    if (apiKey && (!authHeader || authHeader !== `Bearer ${apiKey}`)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verifica e aggiorna le sottoscrizioni scadute
    const updatedCount = await checkExpiredSubscriptions();
    
    return NextResponse.json({
      success: true,
      message: `Checked expired subscriptions. Updated ${updatedCount} subscriptions.`,
      updatedCount,
    });
  } catch (error: any) {
    console.error('Error checking expired subscriptions:', error);
    return NextResponse.json(
      { error: 'Error checking expired subscriptions', details: error.message },
      { status: 500 }
    );
  }
}
