import { NextRequest, NextResponse } from 'next/server';
import { getTripContext } from '@/lib/services/tripContextService';
import { authenticateAndAuthorizeAI } from '@/lib/ai-auth';
import { logger } from '@/lib/logger';

// Force dynamic rendering - don't pre-render this route during build
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Use enhanced authentication
    const authResult = await authenticateAndAuthorizeAI(request);

    if (!authResult.success) {
      return authResult.response!;
    }

    const { session, user, supabase } = authResult;

    // Parse request body
    const { tripId, tripName } = await request.json();

    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      );
    }

    logger.debug('AI context request processed', {
      userId: user.id,
      tripId,
      tripName
    });

    // Verify user has access to the trip
    const { data: tripAccess, error: accessError } = await supabase
      .from('trips')
      .select('id, name, owner_id')
      .eq('id', tripId)
      .single();

    if (accessError || !tripAccess) {
      logger.error('Trip not found or access denied:', { tripId, userId: session.user.id, error: accessError });
      return NextResponse.json(
        { error: 'Trip not found or access denied' },
        { status: 404 }
      );
    }

    // Check if user is owner or participant
    const isOwner = tripAccess.owner_id === session.user.id;
    let isParticipant = false;

    if (!isOwner) {
      const { data: participantData } = await supabase
        .from('trip_participants')
        .select('id')
        .eq('trip_id', tripId)
        .eq('invited_email', session.user.email)
        .eq('invitation_status', 'accepted')
        .single();

      isParticipant = !!participantData;
    }

    if (!isOwner && !isParticipant) {
      return NextResponse.json(
        { error: 'Access denied to this trip' },
        { status: 403 }
      );
    }

    try {
      // Get trip context
      const tripContext = await getTripContext(tripId);

      if (tripContext.error) {
        logger.error('Error getting trip context:', tripContext.error);
        return NextResponse.json(
          { error: 'Failed to load trip context' },
          { status: 500 }
        );
      }

      // Generate welcome message based on context
      const welcomeMessages = [
        'Ciao! Sono il tuo assistente AI per VoyageSmart.',
        'Benvenuto! Sono qui per aiutarti con il tuo viaggio.',
        'Salve! Sono l\'assistente AI di VoyageSmart.',
        'Buongiorno! Sono qui per supportarti nella pianificazione del viaggio.'
      ];

      const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      
      let contextMessage = `${randomWelcome} Ho caricato le informazioni per "${tripName || tripContext.trip.name}".`;

      // Add context-specific information
      if (tripContext.trip.destination) {
        contextMessage += ` Destinazione: ${tripContext.trip.destination}.`;
      }

      if (tripContext.trip.startDate && tripContext.trip.endDate) {
        const startDate = new Date(tripContext.trip.startDate).toLocaleDateString('it-IT');
        const endDate = new Date(tripContext.trip.endDate).toLocaleDateString('it-IT');
        contextMessage += ` Date: dal ${startDate} al ${endDate}.`;
      }

      contextMessage += ' Come posso aiutarti oggi?';

      return NextResponse.json({
        success: true,
        message: contextMessage,
        context: tripContext,
        timestamp: new Date().toISOString()
      });

    } catch (contextError) {
      logger.error('Error loading trip context:', contextError);
      return NextResponse.json(
        { error: 'Failed to load trip context', details: contextError instanceof Error ? contextError.message : String(contextError) },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('Unexpected error in AI context endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
