// Costante per la dimensione massima del file (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
export const MAX_FILE_SIZE_LABEL = '5MB';

export interface ChatMessage {
  id: string;
  trip_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  is_system_message: boolean;
  attachment_url: string | null;
  attachment_type: string | null;
  users: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface TripChatProps {
  tripId: string;
  tripName: string;
}
