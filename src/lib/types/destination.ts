export interface Destination {
  id: string; // Unique identifier for the destination
  name: string; // Name of the destination (e.g., "Paris, France")
  coordinates: {
    lat: number;
    lng: number;
  };
  // Optional additional information
  address?: string;
  placeId?: string; // For Mapbox or Google Maps integration
}

export interface TripDestinations {
  destinations: Destination[];
  primary?: string; // ID of the primary destination
}
