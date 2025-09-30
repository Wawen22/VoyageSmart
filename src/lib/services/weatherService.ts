// Weather API service for OpenWeatherMap
// Documentation: https://openweathermap.org/api

import { logger } from '@/lib/logger';

// Utilizziamo la chiave API dall'ambiente
const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
logger.debug('Weather API Key configured', { configured: !!WEATHER_API_KEY });
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
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

export interface ForecastData {
  list: Array<{
    dt: number;
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
    clouds: {
      all: number;
    };
    wind: {
      speed: number;
      deg: number;
    };
    dt_txt: string;
  }>;
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

/**
 * Get current weather by coordinates
 */
export async function getCurrentWeatherByCoords(lat: number, lon: number, units: 'metric' | 'imperial' = 'metric'): Promise<WeatherData> {
  if (!WEATHER_API_KEY) {
    throw new Error('Weather API key is not defined');
  }

  const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${WEATHER_API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching weather data', {
      error: error instanceof Error ? error.message : String(error),
      lat,
      lon
    });
    throw error;
  }
}

/**
 * Get current weather by city name
 */
export async function getCurrentWeatherByCity(city: string, units: 'metric' | 'imperial' = 'metric'): Promise<WeatherData> {
  if (!WEATHER_API_KEY) {
    throw new Error('Weather API key is not defined');
  }

  const url = `${BASE_URL}/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${WEATHER_API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching weather data by city', {
      error: error instanceof Error ? error.message : String(error),
      city
    });
    throw error;
  }
}

/**
 * Get 5-day weather forecast by coordinates
 */
export async function getForecastByCoords(lat: number, lon: number, units: 'metric' | 'imperial' = 'metric'): Promise<ForecastData> {
  if (!WEATHER_API_KEY) {
    throw new Error('Weather API key is not defined');
  }

  const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${WEATHER_API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching forecast data by coordinates', {
      error: error instanceof Error ? error.message : String(error),
      lat,
      lon
    });
    throw error;
  }
}

/**
 * Get 5-day weather forecast by city name
 */
export async function getForecastByCity(city: string, units: 'metric' | 'imperial' = 'metric'): Promise<ForecastData> {
  if (!WEATHER_API_KEY) {
    throw new Error('Weather API key is not defined');
  }

  const url = `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=${units}&appid=${WEATHER_API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching forecast data by city', {
      error: error instanceof Error ? error.message : String(error),
      city
    });
    throw error;
  }
}

/**
 * Get weather icon URL
 */
export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
