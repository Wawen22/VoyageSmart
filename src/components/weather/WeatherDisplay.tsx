'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  CloudLightning,
  CloudFog,
  Wind,
  Thermometer
} from 'lucide-react';
import {
  getCurrentWeatherByCoords,
  getWeatherIconUrl,
  WeatherData
} from '@/lib/services/weatherService';
import { Destination } from '@/lib/types/destination';

interface WeatherDisplayProps {
  destination: Destination;
  units?: 'metric' | 'imperial';
  className?: string;
  compact?: boolean;
}

export default function WeatherDisplay({
  destination,
  units = 'metric',
  className = '',
  compact = false
}: WeatherDisplayProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!destination?.coordinates) return;

      try {
        setLoading(true);
        setError(null);

        const data = await getCurrentWeatherByCoords(
          destination.coordinates.lat,
          destination.coordinates.lng,
          units
        );

        setWeather(data);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [destination, units]);

  // Get weather icon component based on weather condition
  const getWeatherIcon = () => {
    if (!weather?.weather[0]) return <Cloud className="h-8 w-8" />;

    const id = weather.weather[0].id;
    const iconCode = weather.weather[0].icon;

    // Check if it's day or night
    const isDay = iconCode.includes('d');

    // Thunderstorm
    if (id >= 200 && id < 300) {
      return <CloudLightning className="h-8 w-8 text-yellow-500" />;
    }
    // Drizzle or Rain
    else if ((id >= 300 && id < 400) || (id >= 500 && id < 600)) {
      return <CloudRain className="h-8 w-8 text-blue-400" />;
    }
    // Snow
    else if (id >= 600 && id < 700) {
      return <CloudSnow className="h-8 w-8 text-blue-200" />;
    }
    // Atmosphere (fog, mist, etc.)
    else if (id >= 700 && id < 800) {
      return <CloudFog className="h-8 w-8 text-gray-400" />;
    }
    // Clear
    else if (id === 800) {
      return isDay
        ? <Sun className="h-8 w-8 text-yellow-400" />
        : <Sun className="h-8 w-8 text-gray-300" />;
    }
    // Clouds
    else {
      return <Cloud className="h-8 w-8 text-gray-400" />;
    }
  };

  // Format temperature
  const formatTemp = (temp: number) => {
    return `${Math.round(temp)}°${units === 'metric' ? 'C' : 'F'}`;
  };

  if (loading) {
    if (compact) {
      return (
        <div className="flex items-center">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
          <span className="text-xs">Loading...</span>
        </div>
      );
    }

    return (
      <div className={`flex items-center justify-center p-4 bg-card rounded-md shadow-sm ${className}`}>
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
        <span className="text-sm">Loading weather...</span>
      </div>
    );
  }

  if (error) {
    if (compact) {
      return <span className="text-xs text-destructive">Error loading weather</span>;
    }

    return (
      <div className={`p-4 bg-card rounded-md shadow-sm ${className}`}>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!weather) {
    if (compact) {
      return <span className="text-xs text-muted-foreground">No data</span>;
    }

    return (
      <div className={`p-4 bg-card rounded-md shadow-sm ${className}`}>
        <p className="text-sm text-muted-foreground">No weather data available</p>
      </div>
    );
  }

  // Compact view for the collapsed state
  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          {getWeatherIcon()}
        </div>
        <div className="flex items-center">
          <Thermometer className="h-3 w-3 mr-1 text-primary" />
          <span className="text-sm font-medium">{formatTemp(weather.main.temp)}</span>
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className={`p-4 rounded-md ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{destination.name}</h3>
          <p className="text-sm text-muted-foreground">
            {format(new Date(weather.dt * 1000), 'EEEE, MMM d, yyyy')}
          </p>
        </div>

        <div className="flex items-center">
          {getWeatherIcon()}
          <img
            src={getWeatherIconUrl(weather.weather[0].icon)}
            alt={weather.weather[0].description}
            className="h-10 w-10"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="flex items-center">
          <Thermometer className="h-4 w-4 mr-1 text-primary" />
          <span className="text-lg font-medium">{formatTemp(weather.main.temp)}</span>
        </div>

        <div className="flex items-center">
          <Wind className="h-4 w-4 mr-1 text-primary" />
          <span className="text-sm">
            {Math.round(weather.wind.speed)} {units === 'metric' ? 'm/s' : 'mph'}
          </span>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Feels like: </span>
          <span>{formatTemp(weather.main.feels_like)}</span>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Humidity: </span>
          <span>{weather.main.humidity}%</span>
        </div>
      </div>

      <div className="mt-2">
        <p className="text-sm capitalize">
          {weather.weather[0].description}
        </p>
      </div>
    </div>
  );
}
