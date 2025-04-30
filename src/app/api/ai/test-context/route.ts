import { NextRequest, NextResponse } from 'next/server';
import { getTripContext } from '@/lib/services/tripContextService';

/**
 * Endpoint di test per verificare il recupero del contesto del viaggio
 */
export async function GET(request: NextRequest) {
  try {
    // Ottieni l'ID del viaggio dalla query string
    const searchParams = request.nextUrl.searchParams;
    const tripId = searchParams.get('tripId');
    
    console.log('=== Test Context API chiamata ===');
    console.log('Trip ID:', tripId);
    
    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      );
    }
    
    // Recupera il contesto del viaggio
    const tripContext = await getTripContext(tripId);
    
    return NextResponse.json({
      success: true,
      tripId,
      context: tripContext
    });
  } catch (error: any) {
    console.error('Error in test-context API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve trip context', 
        details: error.message
      },
      { status: 500 }
    );
  }
}
