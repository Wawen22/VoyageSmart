// Weather type definitions

// API response from OpenWeatherMap
export interface WeatherAPIData {
  coord: {
    lon: number;
    lat: number;
  };
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  visibility?: number;
  name: string;
  dt: number; // Time of data calculation, unix, UTC
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
}

// Internal weather data structure used in components
export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility?: number;
  icon: string;
  coord?: {
    lat: number;
    lon: number;
  };
  coordinates?: {
    lat: number;
    lon: number;
  };
  lastUpdated: number;
  description?: string;
}

export interface CitySuggestion {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  score?: number;
}

export interface LocationState {
  hasPermission: boolean | null;
  isLoading: boolean;
  error: string | null;
  coordinates: {
    lat: number;
    lon: number;
  } | null;
  selectedLocation: string | null;
  locationType: 'gps' | 'manual';
}

