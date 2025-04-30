import { createClient } from '@supabase/supabase-js';

// Crea una nuova istanza di Supabase per assicurarci che funzioni correttamente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Raccoglie tutti i dati relativi a un viaggio per fornire contesto all'AI
 *
 * Utilizza una nuova istanza di Supabase per evitare problemi di contesto
 */
export async function getTripContext(tripId: string) {
  console.log('=== getTripContext chiamato con ID:', tripId, '===');

  if (!tripId) {
    console.error('ERRORE: tripId non valido:', tripId);
    return {
      trip: {
        id: 'unknown',
        name: 'Viaggio sconosciuto',
        destination: 'Destinazione sconosciuta'
      },
      error: 'ID viaggio non valido'
    };
  }

  try {
    console.log('Verifico connessione a Supabase...');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseAnonKey ? 'Presente' : 'Mancante');

    // Ottieni i dettagli base del viaggio con un approccio più semplice
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (tripError) {
      console.error('Errore nel recupero dei dettagli del viaggio:', tripError);
      throw tripError;
    }

    console.log('Dettagli viaggio recuperati:', JSON.stringify(tripData).substring(0, 200) + '...');

    // Per ora, restituisci solo i dettagli base del viaggio
    // Questo ci permetterà di verificare se il problema è nella connessione a Supabase
    // o nelle query più complesse
    const tripContext = {
      trip: {
        id: tripData.id,
        name: tripData.name,
        description: tripData.description,
        destination: tripData.destination,
        startDate: tripData.start_date,
        endDate: tripData.end_date,
        owner: tripData.owner_id,
        isPrivate: tripData.is_private,
        budgetTotal: tripData.budget_total,
        createdAt: tripData.created_at
      },
      participants: [],
      accommodations: [],
      transportation: [],
      itinerary: [],
      expenses: {
        items: [],
        total: 0,
        currency: 'EUR'
      }
    };

    console.log('Contesto base del viaggio recuperato con successo');

    // Ora proviamo a recuperare i partecipanti
    try {
      const { data: participants, error: participantsError } = await supabase
        .from('trip_participants')
        .select('*')
        .eq('trip_id', tripId);

      if (!participantsError && participants) {
        console.log('Partecipanti recuperati:', participants.length);
        tripContext.participants = participants.map(p => ({
          name: p.invited_email || 'Partecipante',
          email: p.invited_email || 'Email sconosciuta',
          role: p.role,
          status: p.invitation_status
        }));
      } else {
        console.error('Errore nel recupero dei partecipanti:', participantsError);
      }
    } catch (participantsError) {
      console.error('Eccezione nel recupero dei partecipanti:', participantsError);
    }

    // Proviamo a recuperare gli alloggi
    try {
      const { data: accommodations, error: accommodationsError } = await supabase
        .from('accommodations')
        .select('*')
        .eq('trip_id', tripId);

      if (!accommodationsError && accommodations) {
        console.log('Alloggi recuperati:', accommodations.length);
        tripContext.accommodations = accommodations.map(a => ({
          name: a.name,
          type: a.type,
          checkIn: a.check_in_date,
          checkOut: a.check_out_date,
          address: a.address
        }));
      } else {
        console.error('Errore nel recupero degli alloggi:', accommodationsError);
      }
    } catch (accommodationsError) {
      console.error('Eccezione nel recupero degli alloggi:', accommodationsError);
    }

    // Proviamo a recuperare i trasporti
    try {
      const { data: transportation, error: transportationError } = await supabase
        .from('transportation')
        .select('*')
        .eq('trip_id', tripId);

      if (!transportationError && transportation) {
        console.log('Trasporti recuperati:', transportation.length);
        tripContext.transportation = transportation.map(t => ({
          type: t.type,
          provider: t.provider,
          departureTime: t.departure_time,
          departureLocation: t.departure_location,
          arrivalTime: t.arrival_time,
          arrivalLocation: t.arrival_location
        }));
      } else {
        console.error('Errore nel recupero dei trasporti:', transportationError);
      }
    } catch (transportationError) {
      console.error('Eccezione nel recupero dei trasporti:', transportationError);
    }

    console.log('Contesto del viaggio recuperato con successo (versione semplificata)');
    return tripContext;
  } catch (error) {
    console.error('Errore nel recupero del contesto del viaggio:', error);
    // In caso di errore, restituisci un contesto minimo
    return {
      trip: {
        id: tripId,
        name: 'Viaggio',
        destination: 'Destinazione sconosciuta'
      },
      error: 'Non è stato possibile recuperare tutti i dettagli del viaggio'
    };
  }
}
