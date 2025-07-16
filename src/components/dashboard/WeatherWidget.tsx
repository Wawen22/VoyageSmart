'use client';

import { useState, useEffect } from 'react';
import {
  CloudIcon,
  SunIcon,
  CloudRainIcon,
  CloudSnowIcon,
  MapPinIcon,
  ThermometerIcon,
  EyeIcon,
  WindIcon,
  SettingsIcon,
  RefreshCwIcon,
  AlertCircleIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  getCurrentWeatherByCoords,
  getCurrentWeatherByCity,
  getWeatherIconUrl,
  WeatherData as OpenWeatherData
} from '@/lib/services/weatherService';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  icon: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  lastUpdated: number;
  description?: string;
}

interface LocationState {
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

interface CitySuggestion {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

// Comprehensive city database for intelligent suggestions
const CITIES_DATABASE: CitySuggestion[] = [
  // Italy
  { name: 'Milan', country: 'Italy', lat: 45.4642, lon: 9.1900 },
  { name: 'Rome', country: 'Italy', lat: 41.9028, lon: 12.4964 },
  { name: 'Naples', country: 'Italy', lat: 40.8518, lon: 14.2681 },
  { name: 'Turin', country: 'Italy', lat: 45.0703, lon: 7.6869 },
  { name: 'Florence', country: 'Italy', lat: 43.7696, lon: 11.2558 },
  { name: 'Venice', country: 'Italy', lat: 45.4408, lon: 12.3155 },
  { name: 'Bologna', country: 'Italy', lat: 44.4949, lon: 11.3426 },
  { name: 'Palermo', country: 'Italy', lat: 38.1157, lon: 13.3615 },
  { name: 'Genoa', country: 'Italy', lat: 44.4056, lon: 8.9463 },
  { name: 'Bari', country: 'Italy', lat: 41.1171, lon: 16.8719 },
  { name: 'Catania', country: 'Italy', lat: 38.1157, lon: 15.0873 },
  { name: 'Verona', country: 'Italy', lat: 45.4384, lon: 10.9916 },
  { name: 'Messina', country: 'Italy', lat: 38.1938, lon: 15.5540 },
  { name: 'Padua', country: 'Italy', lat: 45.4064, lon: 11.8768 },
  { name: 'Trieste', country: 'Italy', lat: 45.6495, lon: 13.7768 },
  { name: 'Brescia', country: 'Italy', lat: 45.5416, lon: 10.2118 },
  { name: 'Taranto', country: 'Italy', lat: 40.4668, lon: 17.2725 },
  { name: 'Prato', country: 'Italy', lat: 43.8777, lon: 11.1023 },
  { name: 'Modena', country: 'Italy', lat: 44.6471, lon: 10.9252 },
  { name: 'Reggio Calabria', country: 'Italy', lat: 38.1113, lon: 15.6619 },
  { name: 'Reggio Emilia', country: 'Italy', lat: 44.6989, lon: 10.6307 },
  { name: 'Perugia', country: 'Italy', lat: 43.1122, lon: 12.3888 },
  { name: 'Livorno', country: 'Italy', lat: 43.5485, lon: 10.3106 },
  { name: 'Ravenna', country: 'Italy', lat: 44.4173, lon: 12.1965 },
  { name: 'Cagliari', country: 'Italy', lat: 39.2238, lon: 9.1217 },
  { name: 'Foggia', country: 'Italy', lat: 41.4621, lon: 15.5444 },
  { name: 'Rimini', country: 'Italy', lat: 44.0678, lon: 12.5695 },
  { name: 'Salerno', country: 'Italy', lat: 40.6824, lon: 14.7681 },
  { name: 'Ferrara', country: 'Italy', lat: 44.8381, lon: 11.6198 },
  { name: 'Sassari', country: 'Italy', lat: 40.7259, lon: 8.5590 },
  { name: 'Latina', country: 'Italy', lat: 41.4677, lon: 12.9037 },
  { name: 'Giugliano in Campania', country: 'Italy', lat: 40.9267, lon: 14.1934 },
  { name: 'Monza', country: 'Italy', lat: 45.5845, lon: 9.2744 },
  { name: 'Bergamo', country: 'Italy', lat: 45.6983, lon: 9.6773 },
  { name: 'Vicenza', country: 'Italy', lat: 45.5455, lon: 11.5353 },
  { name: 'Terni', country: 'Italy', lat: 42.5633, lon: 12.6433 },
  { name: 'Forlì', country: 'Italy', lat: 44.2226, lon: 12.0401 },
  { name: 'Trento', country: 'Italy', lat: 46.0748, lon: 11.1217 },
  { name: 'Novara', country: 'Italy', lat: 45.4469, lon: 8.6218 },
  { name: 'Piacenza', country: 'Italy', lat: 45.0526, lon: 9.6929 },
  { name: 'Ancona', country: 'Italy', lat: 43.6158, lon: 13.5189 },
  { name: 'Lecce', country: 'Italy', lat: 40.3515, lon: 18.1750 },
  { name: 'Bolzano', country: 'Italy', lat: 46.4983, lon: 11.3548 },
  { name: 'Catanzaro', country: 'Italy', lat: 38.9072, lon: 16.5958 },
  { name: 'La Spezia', country: 'Italy', lat: 44.1024, lon: 9.8227 },
  { name: 'Udine', country: 'Italy', lat: 46.0633, lon: 13.2350 },
  { name: 'Pescara', country: 'Italy', lat: 42.4584, lon: 14.2081 },

  // United Kingdom
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
  { name: 'Manchester', country: 'United Kingdom', lat: 53.4808, lon: -2.2426 },
  { name: 'Birmingham', country: 'United Kingdom', lat: 52.4862, lon: -1.8904 },
  { name: 'Liverpool', country: 'United Kingdom', lat: 53.4084, lon: -2.9916 },
  { name: 'Edinburgh', country: 'United Kingdom', lat: 55.9533, lon: -3.1883 },
  { name: 'Glasgow', country: 'United Kingdom', lat: 55.8642, lon: -4.2518 },

  // France
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
  { name: 'Marseille', country: 'France', lat: 43.2965, lon: 5.3698 },
  { name: 'Lyon', country: 'France', lat: 45.7640, lon: 4.8357 },
  { name: 'Toulouse', country: 'France', lat: 43.6047, lon: 1.4442 },
  { name: 'Nice', country: 'France', lat: 43.7102, lon: 7.2620 },
  { name: 'Bordeaux', country: 'France', lat: 44.8378, lon: -0.5792 },

  // Germany
  { name: 'Berlin', country: 'Germany', lat: 52.5200, lon: 13.4050 },
  { name: 'Munich', country: 'Germany', lat: 48.1351, lon: 11.5820 },
  { name: 'Hamburg', country: 'Germany', lat: 53.5511, lon: 9.9937 },
  { name: 'Cologne', country: 'Germany', lat: 50.9375, lon: 6.9603 },
  { name: 'Frankfurt', country: 'Germany', lat: 50.1109, lon: 8.6821 },
  { name: 'Stuttgart', country: 'Germany', lat: 48.7758, lon: 9.1829 },

  // Spain
  { name: 'Madrid', country: 'Spain', lat: 40.4168, lon: -3.7038 },
  { name: 'Barcelona', country: 'Spain', lat: 41.3851, lon: 2.1734 },
  { name: 'Valencia', country: 'Spain', lat: 39.4699, lon: -0.3763 },
  { name: 'Seville', country: 'Spain', lat: 37.3891, lon: -5.9845 },
  { name: 'Bilbao', country: 'Spain', lat: 43.2627, lon: -2.9253 },
  { name: 'Malaga', country: 'Spain', lat: 36.7213, lon: -4.4214 },

  // Netherlands
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lon: 4.9041 },
  { name: 'Rotterdam', country: 'Netherlands', lat: 51.9244, lon: 4.4777 },
  { name: 'The Hague', country: 'Netherlands', lat: 52.0705, lon: 4.3007 },
  { name: 'Utrecht', country: 'Netherlands', lat: 52.0907, lon: 5.1214 },

  // Other European Cities
  { name: 'Vienna', country: 'Austria', lat: 48.2082, lon: 16.3738 },
  { name: 'Prague', country: 'Czech Republic', lat: 50.0755, lon: 14.4378 },
  { name: 'Budapest', country: 'Hungary', lat: 47.4979, lon: 19.0402 },
  { name: 'Warsaw', country: 'Poland', lat: 52.2297, lon: 21.0122 },
  { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lon: 18.0686 },
  { name: 'Copenhagen', country: 'Denmark', lat: 55.6761, lon: 12.5683 },
  { name: 'Oslo', country: 'Norway', lat: 59.9139, lon: 10.7522 },
  { name: 'Helsinki', country: 'Finland', lat: 60.1699, lon: 24.9384 },
  { name: 'Brussels', country: 'Belgium', lat: 50.8503, lon: 4.3517 },
  { name: 'Zurich', country: 'Switzerland', lat: 47.3769, lon: 8.5417 },
  { name: 'Geneva', country: 'Switzerland', lat: 46.2044, lon: 6.1432 },
  { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lon: -9.1393 },
  { name: 'Porto', country: 'Portugal', lat: 41.1579, lon: -8.6291 },
  { name: 'Athens', country: 'Greece', lat: 37.9838, lon: 23.7275 },
  { name: 'Dublin', country: 'Ireland', lat: 53.3498, lon: -6.2603 },

  // United States
  { name: 'New York', country: 'United States', state: 'NY', lat: 40.7128, lon: -74.0060 },
  { name: 'Los Angeles', country: 'United States', state: 'CA', lat: 34.0522, lon: -118.2437 },
  { name: 'Chicago', country: 'United States', state: 'IL', lat: 41.8781, lon: -87.6298 },
  { name: 'Houston', country: 'United States', state: 'TX', lat: 29.7604, lon: -95.3698 },
  { name: 'Phoenix', country: 'United States', state: 'AZ', lat: 33.4484, lon: -112.0740 },
  { name: 'Philadelphia', country: 'United States', state: 'PA', lat: 39.9526, lon: -75.1652 },
  { name: 'San Antonio', country: 'United States', state: 'TX', lat: 29.4241, lon: -98.4936 },
  { name: 'San Diego', country: 'United States', state: 'CA', lat: 32.7157, lon: -117.1611 },
  { name: 'Dallas', country: 'United States', state: 'TX', lat: 32.7767, lon: -96.7970 },
  { name: 'San Jose', country: 'United States', state: 'CA', lat: 37.3382, lon: -121.8863 },
  { name: 'Austin', country: 'United States', state: 'TX', lat: 30.2672, lon: -97.7431 },
  { name: 'Jacksonville', country: 'United States', state: 'FL', lat: 30.3322, lon: -81.6557 },
  { name: 'San Francisco', country: 'United States', state: 'CA', lat: 37.7749, lon: -122.4194 },
  { name: 'Columbus', country: 'United States', state: 'OH', lat: 39.9612, lon: -82.9988 },
  { name: 'Fort Worth', country: 'United States', state: 'TX', lat: 32.7555, lon: -97.3308 },
  { name: 'Indianapolis', country: 'United States', state: 'IN', lat: 39.7684, lon: -86.1581 },
  { name: 'Charlotte', country: 'United States', state: 'NC', lat: 35.2271, lon: -80.8431 },
  { name: 'Seattle', country: 'United States', state: 'WA', lat: 47.6062, lon: -122.3321 },
  { name: 'Denver', country: 'United States', state: 'CO', lat: 39.7392, lon: -104.9903 },
  { name: 'Washington', country: 'United States', state: 'DC', lat: 38.9072, lon: -77.0369 },
  { name: 'Boston', country: 'United States', state: 'MA', lat: 42.3601, lon: -71.0589 },
  { name: 'El Paso', country: 'United States', state: 'TX', lat: 31.7619, lon: -106.4850 },
  { name: 'Detroit', country: 'United States', state: 'MI', lat: 42.3314, lon: -83.0458 },
  { name: 'Nashville', country: 'United States', state: 'TN', lat: 36.1627, lon: -86.7816 },
  { name: 'Portland', country: 'United States', state: 'OR', lat: 45.5152, lon: -122.6784 },
  { name: 'Memphis', country: 'United States', state: 'TN', lat: 35.1495, lon: -90.0490 },
  { name: 'Oklahoma City', country: 'United States', state: 'OK', lat: 35.4676, lon: -97.5164 },
  { name: 'Las Vegas', country: 'United States', state: 'NV', lat: 36.1699, lon: -115.1398 },
  { name: 'Louisville', country: 'United States', state: 'KY', lat: 38.2527, lon: -85.7585 },
  { name: 'Baltimore', country: 'United States', state: 'MD', lat: 39.2904, lon: -76.6122 },
  { name: 'Milwaukee', country: 'United States', state: 'WI', lat: 43.0389, lon: -87.9065 },
  { name: 'Albuquerque', country: 'United States', state: 'NM', lat: 35.0844, lon: -106.6504 },
  { name: 'Tucson', country: 'United States', state: 'AZ', lat: 32.2226, lon: -110.9747 },
  { name: 'Fresno', country: 'United States', state: 'CA', lat: 36.7378, lon: -119.7871 },
  { name: 'Sacramento', country: 'United States', state: 'CA', lat: 38.5816, lon: -121.4944 },
  { name: 'Mesa', country: 'United States', state: 'AZ', lat: 33.4152, lon: -111.8315 },
  { name: 'Kansas City', country: 'United States', state: 'MO', lat: 39.0997, lon: -94.5786 },
  { name: 'Atlanta', country: 'United States', state: 'GA', lat: 33.7490, lon: -84.3880 },
  { name: 'Long Beach', country: 'United States', state: 'CA', lat: 33.7701, lon: -118.1937 },
  { name: 'Colorado Springs', country: 'United States', state: 'CO', lat: 38.8339, lon: -104.8214 },
  { name: 'Raleigh', country: 'United States', state: 'NC', lat: 35.7796, lon: -78.6382 },
  { name: 'Miami', country: 'United States', state: 'FL', lat: 25.7617, lon: -80.1918 },
  { name: 'Virginia Beach', country: 'United States', state: 'VA', lat: 36.8529, lon: -75.9780 },
  { name: 'Omaha', country: 'United States', state: 'NE', lat: 41.2565, lon: -95.9345 },
  { name: 'Oakland', country: 'United States', state: 'CA', lat: 37.8044, lon: -122.2711 },
  { name: 'Minneapolis', country: 'United States', state: 'MN', lat: 44.9778, lon: -93.2650 },
  { name: 'Tulsa', country: 'United States', state: 'OK', lat: 36.1540, lon: -95.9928 },
  { name: 'Arlington', country: 'United States', state: 'TX', lat: 32.7357, lon: -97.1081 },
  { name: 'New Orleans', country: 'United States', state: 'LA', lat: 29.9511, lon: -90.0715 },

  // Canada
  { name: 'Toronto', country: 'Canada', state: 'ON', lat: 43.6532, lon: -79.3832 },
  { name: 'Montreal', country: 'Canada', state: 'QC', lat: 45.5017, lon: -73.5673 },
  { name: 'Vancouver', country: 'Canada', state: 'BC', lat: 49.2827, lon: -123.1207 },
  { name: 'Calgary', country: 'Canada', state: 'AB', lat: 51.0447, lon: -114.0719 },
  { name: 'Edmonton', country: 'Canada', state: 'AB', lat: 53.5461, lon: -113.4938 },
  { name: 'Ottawa', country: 'Canada', state: 'ON', lat: 45.4215, lon: -75.6972 },
  { name: 'Winnipeg', country: 'Canada', state: 'MB', lat: 49.8951, lon: -97.1384 },
  { name: 'Quebec City', country: 'Canada', state: 'QC', lat: 46.8139, lon: -71.2080 },

  // Asia
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'Osaka', country: 'Japan', lat: 34.6937, lon: 135.5023 },
  { name: 'Kyoto', country: 'Japan', lat: 35.0116, lon: 135.7681 },
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lon: 126.9780 },
  { name: 'Beijing', country: 'China', lat: 39.9042, lon: 116.4074 },
  { name: 'Shanghai', country: 'China', lat: 31.2304, lon: 121.4737 },
  { name: 'Hong Kong', country: 'Hong Kong', lat: 22.3193, lon: 114.1694 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lon: 100.5018 },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777 },
  { name: 'Delhi', country: 'India', lat: 28.7041, lon: 77.1025 },
  { name: 'Bangalore', country: 'India', lat: 12.9716, lon: 77.5946 },

  // Australia & Oceania
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093 },
  { name: 'Melbourne', country: 'Australia', lat: -37.8136, lon: 144.9631 },
  { name: 'Brisbane', country: 'Australia', lat: -27.4698, lon: 153.0251 },
  { name: 'Perth', country: 'Australia', lat: -31.9505, lon: 115.8605 },
  { name: 'Adelaide', country: 'Australia', lat: -34.9285, lon: 138.6007 },
  { name: 'Auckland', country: 'New Zealand', lat: -36.8485, lon: 174.7633 },
  { name: 'Wellington', country: 'New Zealand', lat: -41.2865, lon: 174.7762 },

  // South America
  { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lon: -46.6333 },
  { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lon: -43.1729 },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6118, lon: -58.3960 },
  { name: 'Lima', country: 'Peru', lat: -12.0464, lon: -77.0428 },
  { name: 'Bogotá', country: 'Colombia', lat: 4.7110, lon: -74.0721 },
  { name: 'Santiago', country: 'Chile', lat: -33.4489, lon: -70.6693 },

  // Africa
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357 },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lon: 3.3792 },
  { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lon: 28.0473 },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lon: 18.4241 },
  { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lon: -7.5898 },
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lon: 36.8219 }
];

// Weather conditions database for consistent data
const WEATHER_CONDITIONS = [
  { condition: 'Sunny', temp: [20, 30], humidity: [30, 50], wind: [5, 15] },
  { condition: 'Partly Cloudy', temp: [15, 25], humidity: [40, 70], wind: [8, 18] },
  { condition: 'Cloudy', temp: [10, 20], humidity: [60, 80], wind: [10, 20] },
  { condition: 'Rainy', temp: [8, 18], humidity: [70, 90], wind: [15, 25] },
  { condition: 'Snowy', temp: [-5, 5], humidity: [80, 95], wind: [10, 30] }
];

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationState>({
    hasPermission: null,
    isLoading: false,
    error: null,
    coordinates: null,
    selectedLocation: null,
    locationType: 'gps'
  });
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Function to get city name from coordinates (reverse geocoding simulation)
  const getCityFromCoordinates = (lat: number, lon: number): string => {
    // Find the closest city in our database
    let closestCity = CITIES_DATABASE[0];
    let minDistance = Number.MAX_VALUE;

    CITIES_DATABASE.forEach(city => {
      // Calculate distance using Haversine formula (simplified)
      const latDiff = lat - city.lat;
      const lonDiff = lon - city.lon;
      const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);

      if (distance < minDistance) {
        minDistance = distance;
        closestCity = city;
      }
    });

    // If very close to a known city (within ~5km), use that city name
    if (minDistance < 0.05) {
      return closestCity.state
        ? `${closestCity.name}, ${closestCity.state}, ${closestCity.country}`
        : `${closestCity.name}, ${closestCity.country}`;
    }

    // Otherwise, use a generic location name based on coordinates
    const latDirection = lat >= 0 ? 'N' : 'S';
    const lonDirection = lon >= 0 ? 'E' : 'W';
    return `Your Location (${Math.abs(lat).toFixed(2)}°${latDirection}, ${Math.abs(lon).toFixed(2)}°${lonDirection})`;
  };

  // Load saved location from localStorage
  const loadSavedLocation = () => {
    try {
      const saved = localStorage.getItem('weather-location');
      if (saved) {
        const data = JSON.parse(saved);
        setLocation(prev => ({
          ...prev,
          selectedLocation: data.location,
          coordinates: data.coordinates,
          locationType: data.type
        }));
        return data;
      }
    } catch (error) {
      console.error('Error loading saved location:', error);
    }
    return null;
  };

  // Save location to localStorage
  const saveLocation = (locationData: any) => {
    try {
      localStorage.setItem('weather-location', JSON.stringify(locationData));
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  // Enhanced city search with fuzzy matching and online fallback
  const searchCities = async (query: string) => {
    if (query.length < 2) {
      setCitySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const queryLower = query.toLowerCase().trim();

    // Score cities based on relevance with fuzzy matching
    const scoredCities = CITIES_DATABASE.map(city => {
      let score = 0;
      const cityName = city.name.toLowerCase();
      const countryName = city.country.toLowerCase();
      const stateName = city.state?.toLowerCase() || '';

      // Exact match gets highest score
      if (cityName === queryLower) {
        score += 100;
      }
      // Starts with query gets high score
      else if (cityName.startsWith(queryLower)) {
        score += 80;
      }
      // Contains query gets medium score
      else if (cityName.includes(queryLower)) {
        score += 60;
      }
      // Fuzzy matching for typos (simple Levenshtein-like)
      else if (getFuzzyMatchScore(cityName, queryLower) > 0.7) {
        score += 50;
      }

      // Country matches
      if (countryName === queryLower) {
        score += 50;
      } else if (countryName.startsWith(queryLower)) {
        score += 40;
      } else if (countryName.includes(queryLower)) {
        score += 30;
      }

      // State matches (for US/Canada cities)
      if (stateName && stateName.includes(queryLower)) {
        score += 25;
      }

      // Boost popular cities
      const popularCities = ['london', 'paris', 'new york', 'tokyo', 'rome', 'milan', 'madrid', 'berlin', 'amsterdam', 'modena'];
      if (popularCities.includes(cityName)) {
        score += 10;
      }

      // Boost if query matches multiple parts
      const fullLocation = `${cityName} ${countryName} ${stateName}`.toLowerCase();
      const queryWords = queryLower.split(' ');
      const matchingWords = queryWords.filter(word => fullLocation.includes(word));
      if (matchingWords.length > 1) {
        score += matchingWords.length * 15;
      }

      return { ...city, score };
    })
    .filter(city => city.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

    // If we have good matches, show them
    if (scoredCities.length > 0) {
      setCitySuggestions(scoredCities);
      setShowSuggestions(true);
    } else {
      // If no matches in our database, try to create a suggestion from the query
      const fallbackSuggestion = createFallbackSuggestion(query);
      if (fallbackSuggestion) {
        setCitySuggestions([fallbackSuggestion]);
        setShowSuggestions(true);
      } else {
        setCitySuggestions([]);
        setShowSuggestions(true); // Still show "no results" message
      }
    }
  };

  // Simple fuzzy matching function
  const getFuzzyMatchScore = (str1: string, str2: string): number => {
    if (str1.length === 0 || str2.length === 0) return 0;

    let matches = 0;
    const minLength = Math.min(str1.length, str2.length);

    for (let i = 0; i < minLength; i++) {
      if (str1[i] === str2[i]) matches++;
    }

    return matches / Math.max(str1.length, str2.length);
  };

  // Create fallback suggestion for unknown cities
  const createFallbackSuggestion = (query: string): CitySuggestion | null => {
    if (query.length < 3) return null;

    // Capitalize first letter of each word
    const formattedName = query.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return {
      name: formattedName,
      country: 'Unknown',
      lat: 0, // Will be handled by fallback weather
      lon: 0,
      score: 1 // Low score so it appears last
    };
  };

  // Get realistic weather data based on location
  const getWeatherForLocation = (lat: number, lon: number, locationName: string) => {
    // Create a seed based on coordinates for consistent but different data per location
    const seed = Math.abs(lat * 1000 + lon * 1000);

    // Determine climate zone based on latitude
    const absLat = Math.abs(lat);
    let baseTemp = 20; // Default moderate temperature
    let conditionWeights = [0.3, 0.4, 0.2, 0.08, 0.02]; // [Sunny, Partly Cloudy, Cloudy, Rainy, Snowy]

    // Arctic/Antarctic (very cold)
    if (absLat > 66) {
      baseTemp = -10;
      conditionWeights = [0.1, 0.2, 0.3, 0.1, 0.3];
    }
    // Subarctic (cold)
    else if (absLat > 60) {
      baseTemp = 5;
      conditionWeights = [0.2, 0.3, 0.3, 0.15, 0.05];
    }
    // Temperate (moderate)
    else if (absLat > 35) {
      baseTemp = 15;
      conditionWeights = [0.25, 0.35, 0.25, 0.12, 0.03];
    }
    // Subtropical (warm)
    else if (absLat > 23) {
      baseTemp = 25;
      conditionWeights = [0.4, 0.3, 0.2, 0.08, 0.02];
    }
    // Tropical (hot)
    else {
      baseTemp = 30;
      conditionWeights = [0.3, 0.25, 0.25, 0.2, 0.0];
    }

    // Seasonal adjustment
    const month = new Date().getMonth();
    const isNorthern = lat >= 0;
    let seasonalAdjustment = 0;

    if (isNorthern) {
      // Northern hemisphere: cold in Dec-Feb, hot in Jun-Aug
      seasonalAdjustment = Math.sin((month - 3) * Math.PI / 6) * 8;
    } else {
      // Southern hemisphere: opposite seasons
      seasonalAdjustment = Math.sin((month - 9) * Math.PI / 6) * 8;
    }

    // Altitude adjustment (rough approximation)
    const altitudeAdjustment = Math.max(0, (absLat - 30)) * -0.3; // Higher latitudes tend to be cooler

    // Calculate final temperature
    const finalTemp = Math.round(baseTemp + seasonalAdjustment + altitudeAdjustment + (seed % 10 - 5));

    // Select weather condition based on weights and location
    const random = (seed % 100) / 100;
    let cumulativeWeight = 0;
    let selectedCondition = WEATHER_CONDITIONS[1]; // Default to Partly Cloudy

    for (let i = 0; i < WEATHER_CONDITIONS.length; i++) {
      cumulativeWeight += conditionWeights[i];
      if (random <= cumulativeWeight) {
        selectedCondition = WEATHER_CONDITIONS[i];
        break;
      }
    }

    // Adjust temperature based on condition
    let tempAdjustment = 0;
    switch (selectedCondition.condition) {
      case 'Sunny':
        tempAdjustment = 3;
        break;
      case 'Partly Cloudy':
        tempAdjustment = 0;
        break;
      case 'Cloudy':
        tempAdjustment = -2;
        break;
      case 'Rainy':
        tempAdjustment = -5;
        break;
      case 'Snowy':
        tempAdjustment = -10;
        break;
    }

    const adjustedTemp = Math.max(-30, Math.min(50, finalTemp + tempAdjustment));

    // Generate other weather parameters based on condition and location
    const humidity = Math.round(
      selectedCondition.humidity[0] +
      (selectedCondition.humidity[1] - selectedCondition.humidity[0]) * ((seed % 50) / 50)
    );

    const windSpeed = Math.round(
      selectedCondition.wind[0] +
      (selectedCondition.wind[1] - selectedCondition.wind[0]) * ((seed % 30) / 30)
    );

    const visibility = selectedCondition.condition === 'Snowy' ? Math.round(2 + (seed % 5)) :
                      selectedCondition.condition === 'Rainy' ? Math.round(5 + (seed % 8)) :
                      selectedCondition.condition === 'Cloudy' ? Math.round(8 + (seed % 5)) :
                      Math.round(10 + (seed % 10));

    console.log(`Weather for ${locationName} (${lat}, ${lon}):`, {
      baseTemp,
      seasonalAdjustment,
      tempAdjustment,
      finalTemp: adjustedTemp,
      condition: selectedCondition.condition
    });

    return {
      location: locationName,
      temperature: adjustedTemp,
      condition: selectedCondition.condition,
      humidity: Math.max(20, Math.min(95, humidity)),
      windSpeed: Math.max(0, Math.min(50, windSpeed)),
      visibility: Math.max(1, Math.min(20, visibility)),
      icon: selectedCondition.condition.toLowerCase().replace(' ', '-'),
      coordinates: { lat, lon },
      lastUpdated: Date.now()
    };
  };

  // Get user's current location
  const getCurrentLocation = () => {
    setLocation(prev => ({ ...prev, isLoading: true, error: null }));

    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        isLoading: false,
        hasPermission: false,
        error: 'Geolocation is not supported by this browser.'
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };

        const locationData = {
          location: 'Your Location',
          coordinates: coords,
          type: 'gps'
        };

        // Get city name from coordinates using reverse geocoding (mock)
        const cityName = getCityFromCoordinates(coords.lat, coords.lon);

        setLocation({
          hasPermission: true,
          isLoading: false,
          error: null,
          coordinates: coords,
          selectedLocation: cityName,
          locationType: 'gps'
        });

        const gpsLocationData = {
          location: cityName,
          coordinates: coords,
          type: 'gps'
        };
        saveLocation(gpsLocationData);
        fetchWeatherByCoordinates(coords.lat, coords.lon, cityName);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setLocation(prev => ({
          ...prev,
          hasPermission: false,
          isLoading: false,
          error: errorMessage
        }));

        // Try to load saved location or fallback to default
        const saved = loadSavedLocation();
        if (saved && saved.coordinates) {
          fetchWeatherByCoordinates(saved.coordinates.lat, saved.coordinates.lon, saved.location);
        } else {
          fetchWeatherByLocation('Milan, Italy');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Fetch weather by coordinates using real OpenWeatherMap API
  const fetchWeatherByCoordinates = async (lat: number, lon: number, locationName: string) => {
    try {
      console.log('Fetching weather for:', locationName, 'at coordinates:', lat, lon);
      setLoading(true);
      setError(null);

      // Use real OpenWeatherMap API
      const apiWeatherData = await getCurrentWeatherByCoords(lat, lon, 'metric');

      // Transform API data to our interface
      const weatherData: WeatherData = {
        location: locationName,
        temperature: Math.round(apiWeatherData.main.temp),
        condition: apiWeatherData.weather[0].main,
        description: apiWeatherData.weather[0].description,
        humidity: apiWeatherData.main.humidity,
        windSpeed: Math.round(apiWeatherData.wind?.speed * 3.6 || 0), // Convert m/s to km/h
        visibility: Math.round((apiWeatherData.visibility || 10000) / 1000), // Convert m to km
        icon: apiWeatherData.weather[0].icon,
        coordinates: { lat, lon },
        lastUpdated: Date.now()
      };

      console.log('Real weather data fetched:', weatherData);
      setWeather(weatherData);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Failed to fetch weather data. Please check your internet connection.');

      // Fallback to mock data if API fails
      const fallbackData = getWeatherForLocation(lat, lon, locationName);
      setWeather(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  // Fetch weather by location name using real OpenWeatherMap API
  const fetchWeatherByLocation = async (locationName: string) => {
    try {
      setLoading(true);
      setError(null);

      // First try to find city in our database for coordinates
      const city = CITIES_DATABASE.find(c => {
        const cityName = c.name.toLowerCase();
        const fullName = `${c.name}, ${c.country}`.toLowerCase();
        const fullNameWithState = c.state ? `${c.name}, ${c.state}, ${c.country}`.toLowerCase() : '';
        const locationLower = locationName.toLowerCase();

        return cityName === locationLower ||
               fullName === locationLower ||
               fullNameWithState === locationLower ||
               cityName.includes(locationLower) ||
               locationLower.includes(cityName);
      });

      if (city) {
        // Use coordinates for more accurate weather
        await fetchWeatherByCoordinates(city.lat, city.lon, `${city.name}, ${city.country}`);
      } else {
        // Try direct city name search with OpenWeatherMap API
        try {
          const apiWeatherData = await getCurrentWeatherByCity(locationName, 'metric');

          // Transform API data to our interface
          const weatherData: WeatherData = {
            location: `${apiWeatherData.name}, ${apiWeatherData.sys.country}`,
            temperature: Math.round(apiWeatherData.main.temp),
            condition: apiWeatherData.weather[0].main,
            description: apiWeatherData.weather[0].description,
            humidity: apiWeatherData.main.humidity,
            windSpeed: Math.round(apiWeatherData.wind?.speed * 3.6 || 0), // Convert m/s to km/h
            visibility: Math.round((apiWeatherData.visibility || 10000) / 1000), // Convert m to km
            icon: apiWeatherData.weather[0].icon,
            coordinates: { lat: apiWeatherData.coord.lat, lon: apiWeatherData.coord.lon },
            lastUpdated: Date.now()
          };

          setWeather(weatherData);

          // Save manual location with real coordinates
          const locationData = {
            location: weatherData.location,
            coordinates: { lat: apiWeatherData.coord.lat, lon: apiWeatherData.coord.lon },
            type: 'manual'
          };
          setLocation(prev => ({
            ...prev,
            selectedLocation: weatherData.location,
            coordinates: { lat: apiWeatherData.coord.lat, lon: apiWeatherData.coord.lon },
            locationType: 'manual'
          }));
          saveLocation(locationData);

        } catch (apiError) {
          console.error('API search failed for city:', locationName, apiError);

          // Final fallback to mock data
          const fallbackData = getWeatherForLocation(45.0, 10.0, locationName);
          setWeather(fallbackData);

          // Save fallback location
          const locationData = {
            location: locationName,
            coordinates: { lat: 45.0, lon: 10.0 },
            type: 'manual'
          };
          setLocation(prev => ({
            ...prev,
            selectedLocation: locationName,
            coordinates: { lat: 45.0, lon: 10.0 },
            locationType: 'manual'
          }));
          saveLocation(locationData);
        }
      }
    } catch (err) {
      console.error('Error in fetchWeatherByLocation:', err);
      setError('Failed to fetch weather data.');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual location selection (when typing and pressing Enter or clicking Set)
  const handleManualLocation = () => {
    if (!manualLocation.trim()) return;

    const query = manualLocation.trim().toLowerCase();

    // Try to find exact or close match in our database
    const cityToUse = CITIES_DATABASE.find(c => {
      const cityName = c.name.toLowerCase();
      const fullName = `${c.name}, ${c.country}`.toLowerCase();
      const fullNameWithState = c.state ? `${c.name}, ${c.state}, ${c.country}`.toLowerCase() : '';

      return cityName === query ||
             fullName === query ||
             fullNameWithState === query ||
             cityName.startsWith(query) ||
             (query.length >= 3 && cityName.includes(query));
    });

    if (cityToUse) {
      const displayName = cityToUse.state
        ? `${cityToUse.name}, ${cityToUse.state}, ${cityToUse.country}`
        : `${cityToUse.name}, ${cityToUse.country}`;

      // Fetch weather for found city
      fetchWeatherByCoordinates(cityToUse.lat, cityToUse.lon, displayName);

      // Update location state
      const locationData = {
        location: displayName,
        coordinates: { lat: cityToUse.lat, lon: cityToUse.lon },
        type: 'manual'
      };
      setLocation(prev => ({
        ...prev,
        selectedLocation: displayName,
        coordinates: { lat: cityToUse.lat, lon: cityToUse.lon },
        locationType: 'manual'
      }));
      saveLocation(locationData);
    } else {
      // Fallback for cities not in our database
      fetchWeatherByLocation(manualLocation.trim());

      // Update location state with manual input
      const locationData = {
        location: manualLocation.trim(),
        coordinates: null,
        type: 'manual'
      };
      setLocation(prev => ({
        ...prev,
        selectedLocation: manualLocation.trim(),
        coordinates: null,
        locationType: 'manual'
      }));
      saveLocation(locationData);
    }

    // Close dialog and clear input
    setIsLocationDialogOpen(false);
    setManualLocation('');
    setShowSuggestions(false);
    setCitySuggestions([]);
  };

  // Handle city suggestion selection
  const handleCitySuggestion = (city: CitySuggestion) => {
    const displayName = city.state
      ? `${city.name}, ${city.state}, ${city.country}`
      : `${city.name}, ${city.country}`;

    // Immediately fetch weather for selected city
    fetchWeatherByCoordinates(city.lat, city.lon, displayName);

    // Update location state
    const locationData = {
      location: displayName,
      coordinates: { lat: city.lat, lon: city.lon },
      type: 'manual'
    };
    setLocation(prev => ({
      ...prev,
      selectedLocation: displayName,
      coordinates: { lat: city.lat, lon: city.lon },
      locationType: 'manual'
    }));
    saveLocation(locationData);

    // Close dialog and clear input
    setIsLocationDialogOpen(false);
    setManualLocation('');
    setShowSuggestions(false);
    setCitySuggestions([]);
  };

  // Handle input change for city search
  const handleLocationInputChange = (value: string) => {
    setManualLocation(value);
    searchCities(value);
  };

  // Refresh current weather (respects current location type)
  const refreshWeather = () => {
    if (location.locationType === 'gps' && location.coordinates) {
      fetchWeatherByCoordinates(location.coordinates.lat, location.coordinates.lon, location.selectedLocation || 'Your Location');
    } else if (location.selectedLocation) {
      fetchWeatherByLocation(location.selectedLocation);
    } else {
      getCurrentLocation();
    }
  };

  // Initial load
  useEffect(() => {
    const saved = loadSavedLocation();
    if (saved && saved.coordinates) {
      // Load from saved location
      setLocation(prev => ({
        ...prev,
        selectedLocation: saved.location,
        coordinates: saved.coordinates,
        locationType: saved.type
      }));
      fetchWeatherByCoordinates(saved.coordinates.lat, saved.coordinates.lon, saved.location);
    } else {
      // Try to get current location
      getCurrentLocation();
    }
  }, []);

  const getWeatherIcon = (condition: string, iconCode?: string) => {
    // If we have an icon code from OpenWeatherMap, use their icon
    if (iconCode) {
      return (
        <img
          src={getWeatherIconUrl(iconCode)}
          alt={condition}
          className="h-8 w-8"
        />
      );
    }

    // Fallback to Lucide icons
    switch (condition.toLowerCase()) {
      case 'clear':
      case 'sunny':
        return <SunIcon className="h-8 w-8 text-yellow-500" />;
      case 'clouds':
      case 'partly cloudy':
      case 'cloudy':
        return <CloudIcon className="h-8 w-8 text-gray-500" />;
      case 'rain':
      case 'drizzle':
      case 'rainy':
        return <CloudRainIcon className="h-8 w-8 text-blue-500" />;
      case 'snow':
      case 'snowy':
        return <CloudSnowIcon className="h-8 w-8 text-blue-200" />;
      case 'thunderstorm':
        return <CloudRainIcon className="h-8 w-8 text-purple-500" />;
      default:
        return <CloudIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const getGradientByCondition = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return 'from-yellow-400 via-orange-400 to-red-400';
      case 'partly cloudy':
        return 'from-blue-400 via-cyan-400 to-teal-400';
      case 'cloudy':
        return 'from-gray-400 via-slate-400 to-gray-500';
      case 'rainy':
      case 'rain':
        return 'from-blue-500 via-indigo-500 to-purple-500';
      case 'snowy':
      case 'snow':
        return 'from-blue-200 via-cyan-200 to-white';
      default:
        return 'from-blue-400 via-cyan-400 to-teal-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          </div>
          <div className="w-8 h-8 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-muted-foreground">
            <AlertCircleIcon className="h-8 w-8" />
            <div>
              <div className="font-medium">Weather unavailable</div>
              <div className="text-sm">{error || 'Unable to fetch weather data'}</div>
            </div>
          </div>
          <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Location</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Button
                    onClick={getCurrentLocation}
                    disabled={location.isLoading}
                    className="w-full"
                  >
                    {location.isLoading ? (
                      <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <MapPinIcon className="h-4 w-4 mr-2" />
                    )}
                    Use Current Location
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    placeholder="Enter city name (e.g., London, UK)"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualLocation()}
                  />
                  <Button
                    onClick={handleManualLocation}
                    disabled={!manualLocation.trim()}
                    className="absolute right-1 top-1 h-8"
                    size="sm"
                  >
                    Set
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative overflow-hidden bg-gradient-to-br rounded-xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl",
      getGradientByCondition(weather.condition)
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
      </div>

      <div className="relative z-10">
        {/* Header with location controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-white text-sm opacity-90">
            <MapPinIcon className="h-3 w-3" />
            {weather.location}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshWeather}
              disabled={loading}
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
              title="Refresh weather"
            >
              <RefreshCwIcon className={cn(
                "h-3 w-3",
                loading && "animate-spin"
              )} />
            </Button>

            <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                >
                  <SettingsIcon className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Location</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Button
                      onClick={getCurrentLocation}
                      disabled={location.isLoading}
                      className="w-full"
                    >
                      {location.isLoading ? (
                        <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MapPinIcon className="h-4 w-4 mr-2" />
                      )}
                      Use Current Location
                    </Button>
                    {location.error && (
                      <p className="text-sm text-muted-foreground mt-2">{location.error}</p>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      placeholder="Search for a city..."
                      value={manualLocation}
                      onChange={(e) => handleLocationInputChange(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleManualLocation()}
                      onFocus={() => manualLocation.length >= 2 && setShowSuggestions(true)}
                    />

                    {/* City suggestions dropdown */}
                    {showSuggestions && citySuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                        {citySuggestions.map((city, index) => {
                          const displayName = city.state
                            ? `${city.name}, ${city.state}, ${city.country}`
                            : `${city.name}, ${city.country}`;

                          // Highlight matching text
                          const query = manualLocation.toLowerCase();
                          const cityName = city.name;
                          const isExactMatch = cityName.toLowerCase() === query;
                          const startsWithQuery = cityName.toLowerCase().startsWith(query);
                          const isFallback = city.country === 'Unknown';

                          return (
                            <button
                              key={`${city.name}-${city.country}-${city.state || 'no-state'}-${index}`}
                              onClick={() => handleCitySuggestion(city)}
                              className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors flex items-center gap-3 group"
                            >
                              <div className="flex-shrink-0">
                                <MapPinIcon className={cn(
                                  "h-4 w-4 group-hover:text-primary transition-colors",
                                  isFallback ? "text-orange-500" : "text-muted-foreground"
                                )} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={cn(
                                  "font-medium truncate",
                                  isExactMatch && "text-primary",
                                  startsWithQuery && !isExactMatch && "text-foreground",
                                  isFallback && "text-orange-600"
                                )}>
                                  {city.name}
                                  {isExactMatch && !isFallback && (
                                    <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                      Exact match
                                    </span>
                                  )}
                                  {isFallback && (
                                    <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                                      Search anyway
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {isFallback ? 'Location not in database - will search online' :
                                   city.state ? `${city.state}, ${city.country}` : city.country}
                                </div>
                              </div>
                              <div className="flex-shrink-0 text-xs text-muted-foreground">
                                {/* Show a small flag emoji based on country */}
                                {!isFallback && city.country === 'Italy' && '🇮🇹'}
                                {!isFallback && city.country === 'United States' && '🇺🇸'}
                                {!isFallback && city.country === 'United Kingdom' && '🇬🇧'}
                                {!isFallback && city.country === 'France' && '🇫🇷'}
                                {!isFallback && city.country === 'Germany' && '🇩🇪'}
                                {!isFallback && city.country === 'Spain' && '🇪🇸'}
                                {!isFallback && city.country === 'Netherlands' && '🇳🇱'}
                                {!isFallback && city.country === 'Canada' && '🇨🇦'}
                                {!isFallback && city.country === 'Japan' && '🇯🇵'}
                                {!isFallback && city.country === 'Australia' && '🇦🇺'}
                                {!isFallback && !['Italy', 'United States', 'United Kingdom', 'France', 'Germany', 'Spain', 'Netherlands', 'Canada', 'Japan', 'Australia'].includes(city.country) && '🌍'}
                                {isFallback && '🔍'}
                              </div>
                            </button>
                          );
                        })}

                        {/* Show "No results" if search has no matches */}
                        {manualLocation.length >= 2 && citySuggestions.length === 0 && (
                          <div className="px-3 py-2.5 text-sm text-muted-foreground text-center">
                            No cities found for "{manualLocation}"
                            <div className="text-xs mt-1">Try searching for a major city name</div>
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={handleManualLocation}
                      disabled={!manualLocation.trim()}
                      className="absolute right-1 top-1 h-8"
                      size="sm"
                    >
                      Set
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main weather info */}
        <div className="flex items-center gap-3 mb-3">
          {getWeatherIcon(weather.condition, weather.icon)}
          <div className="text-white">
            <div className="text-2xl font-bold">{weather.temperature}°C</div>
            <div className="text-sm opacity-90">{weather.description || weather.condition}</div>
          </div>
        </div>

        {/* Weather details */}
        <div className="grid grid-cols-3 gap-3 text-white">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ThermometerIcon className="h-3 w-3 opacity-75" />
            </div>
            <div className="text-xs opacity-75">Humidity</div>
            <div className="text-sm font-semibold">{weather.humidity}%</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <WindIcon className="h-3 w-3 opacity-75" />
            </div>
            <div className="text-xs opacity-75">Wind</div>
            <div className="text-sm font-semibold">{weather.windSpeed} km/h</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <EyeIcon className="h-3 w-3 opacity-75" />
            </div>
            <div className="text-xs opacity-75">Visibility</div>
            <div className="text-sm font-semibold">{weather.visibility} km</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for mobile
export function CompactWeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<LocationState>({
    hasPermission: null,
    isLoading: false,
    error: null,
    coordinates: null
  });

  // Get user's current location (simplified for compact version)
  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        setLocation({
          hasPermission: true,
          isLoading: false,
          error: null,
          coordinates: coords
        });
        fetchWeatherByCoordinates(coords.lat, coords.lon);
      },
      () => {
        // Fallback to default location
        fetchWeatherByLocation('Your Location');
      }
    );
  };

  const fetchWeatherByCoordinates = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      const apiWeatherData = await getCurrentWeatherByCoords(lat, lon, 'metric');

      setWeather({
        location: 'Your Location',
        temperature: Math.round(apiWeatherData.main.temp),
        condition: apiWeatherData.weather[0].main,
        description: apiWeatherData.weather[0].description,
        humidity: apiWeatherData.main.humidity,
        windSpeed: Math.round(apiWeatherData.wind?.speed * 3.6 || 0),
        visibility: Math.round((apiWeatherData.visibility || 10000) / 1000),
        icon: apiWeatherData.weather[0].icon,
        coordinates: { lat, lon },
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
      // Fallback to mock data
      setWeather({
        location: 'Your Location',
        temperature: 22,
        condition: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 12,
        visibility: 10,
        icon: '02d',
        coordinates: { lat, lon },
        lastUpdated: Date.now()
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByLocation = async (locationName: string) => {
    try {
      setLoading(true);
      const apiWeatherData = await getCurrentWeatherByCity(locationName, 'metric');

      setWeather({
        location: `${apiWeatherData.name}, ${apiWeatherData.sys.country}`,
        temperature: Math.round(apiWeatherData.main.temp),
        condition: apiWeatherData.weather[0].main,
        description: apiWeatherData.weather[0].description,
        humidity: apiWeatherData.main.humidity,
        windSpeed: Math.round(apiWeatherData.wind?.speed * 3.6 || 0),
        visibility: Math.round((apiWeatherData.visibility || 10000) / 1000),
        icon: apiWeatherData.weather[0].icon,
        coordinates: { lat: apiWeatherData.coord.lat, lon: apiWeatherData.coord.lon },
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
      // Fallback to mock data
      setWeather({
        location: locationName,
        temperature: 22,
        condition: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 12,
        visibility: 10,
        icon: '02d',
        lastUpdated: Date.now()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getWeatherIconCompact = (condition: string, iconCode?: string) => {
    // If we have an icon code from OpenWeatherMap, use their icon
    if (iconCode) {
      return (
        <img
          src={getWeatherIconUrl(iconCode)}
          alt={condition}
          className="h-5 w-5"
        />
      );
    }

    // Fallback to Lucide icons
    switch (condition.toLowerCase()) {
      case 'clear':
      case 'sunny':
        return <SunIcon className="h-5 w-5 text-yellow-500" />;
      case 'clouds':
      case 'partly cloudy':
      case 'cloudy':
        return <CloudIcon className="h-5 w-5 text-gray-500" />;
      case 'rain':
      case 'drizzle':
      case 'rainy':
        return <CloudRainIcon className="h-5 w-5 text-blue-500" />;
      case 'snow':
      case 'snowy':
        return <CloudSnowIcon className="h-5 w-5 text-blue-200" />;
      default:
        return <CloudIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-muted/50 rounded-lg px-3 py-2 animate-pulse">
        <div className="h-4 bg-muted rounded"></div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border">
      <div className="flex items-center gap-2">
        {getWeatherIconCompact(weather.condition, weather.icon)}
        <div>
          <div className="text-sm font-semibold text-foreground">{weather.temperature}°C</div>
          <div className="text-xs text-muted-foreground">{weather.location}</div>
        </div>
      </div>
    </div>
  );
}
