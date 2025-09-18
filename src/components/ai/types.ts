export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
};

// Suggested questions that will appear after AI responses
export interface SuggestedQuestion {
  text: string;
  action: () => void;
}

export interface TripData {
  id: string;
  name: string;
  description?: string;
  destination?: string;
  destinations?: string[]; // Array di destinazioni
  startDate?: string;
  endDate?: string;
  budget?: number;
  currency?: string;
  participants?: any[]; // Array di partecipanti
  isPrivate?: boolean;
  createdAt?: string;
  owner?: string;
  accommodations?: any[]; // Array di alloggi
  transportation?: any[]; // Array di trasporti
  activities?: any[]; // Array di attività
  itinerary?: any[]; // Array di giorni dell'itinerario con attività
  expenses?: any[]; // Array di spese
  currentUserId?: string; // ID dell'utente corrente
}

export interface ChatBotProps {
  tripId: string;
  tripName: string;
  tripData?: TripData;
}
