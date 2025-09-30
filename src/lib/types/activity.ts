// Activity type definition
export type Activity = {
  id: string;
  trip_id: string;
  day_id: string;
  name: string;
  type: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  coordinates?: { x: number; y: number } | string | null;
  booking_reference: string | null;
  priority: number;
  cost: number | null;
  currency: string;
  notes: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type ActivityFormData = {
  name: string;
  type: string;
  start_time: string;
  end_time: string;
  location: string;
  booking_reference: string;
  priority: number;
  cost: string;
  currency: string;
  notes: string;
  status: string;
  coordinates?: { x: number; y: number } | null;
};

export type ItineraryDay = {
  id: string;
  trip_id: string;
  day_date: string;
  notes: string | null;
  weather_forecast: any | null;
  created_at: string;
  updated_at: string;
  activities?: Activity[];
};

