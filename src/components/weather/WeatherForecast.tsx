'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  Sun, 
  CloudLightning, 
  CloudFog,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  getForecastByCoords, 
  getWeatherIconUrl, 
  ForecastData 
} from '@/lib/services/weatherService';
import { Destination } from '@/lib/types/destination';

interface WeatherForecastProps {
  destination: Destination;
  units?: 'metric' | 'imperial';
  className?: string;
  compact?: boolean;
}

export default function WeatherForecast({ 
  destination, 
  units = 'metric', 
  className = '',
  compact = false
}: WeatherForecastProps) {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!compact);

  useEffect(() => {
    const fetchForecast = async () => {
      if (!destination?.coordinates) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await getForecastByCoords(
          destination.coordinates.lat, 
          destination.coordinates.lng,
          units
        );
        
        setForecast(data);
      } catch (err) {
        console.error('Error fetching forecast:', err);
        setError('Failed to load forecast data');
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [destination, units]);

  // Get weather icon component based on weather condition
  const getWeatherIcon = (weatherId: number, iconCode: string, size = 6) => {
    // Check if it's day or night
    const isDay = iconCode.includes('d');

    // Thunderstorm
    if (weatherId >= 200 && weatherId < 300) {
      return <CloudLightning className={`h-${size} w-${size} text-yellow-500`} />;
    }
    // Drizzle or Rain
    else if ((weatherId >= 300 && weatherId < 400) || (weatherId >= 500 && weatherId < 600)) {
      return <CloudRain className={`h-${size} w-${size} text-blue-400`} />;
    }
    // Snow
    else if (weatherId >= 600 && weatherId < 700) {
      return <CloudSnow className={`h-${size} w-${size} text-blue-200`} />;
    }
    // Atmosphere (fog, mist, etc.)
    else if (weatherId >= 700 && weatherId < 800) {
      return <CloudFog className={`h-${size} w-${size} text-gray-400`} />;
    }
    // Clear
    else if (weatherId === 800) {
      return isDay 
        ? <Sun className={`h-${size} w-${size} text-yellow-400`} /> 
        : <Sun className={`h-${size} w-${size} text-gray-300`} />;
    }
    // Clouds
    else {
      return <Cloud className={`h-${size} w-${size} text-gray-400`} />;
    }
  };

  // Format temperature
  const formatTemp = (temp: number) => {
    return `${Math.round(temp)}°${units === 'metric' ? 'C' : 'F'}`;
  };

  // Group forecast by day
  const groupForecastByDay = () => {
    if (!forecast?.list) return [];

    const grouped: { [key: string]: any[] } = {};
    
    forecast.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });

    return Object.entries(grouped).map(([date, items]) => {
      // Calculate min and max temperatures for the day
      const temps = items.map(item => item.main.temp);
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      
      // Get the noon forecast if available, otherwise use the first one
      const noonForecast = items.find(item => item.dt_txt.includes('12:00:00')) || items[0];
      
      return {
        date,
        minTemp,
        maxTemp,
        weather: noonForecast.weather[0],
        items
      };
    }).slice(0, 5); // Limit to 5 days
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 bg-card rounded-md shadow-sm ${className}`}>
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
        <span className="text-sm">Loading forecast...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-card rounded-md shadow-sm ${className}`}>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className={`p-4 bg-card rounded-md shadow-sm ${className}`}>
        <p className="text-sm text-muted-foreground">No forecast data available</p>
      </div>
    );
  }

  const dailyForecasts = groupForecastByDay();

  return (
    <div className={`bg-card rounded-md shadow-sm ${className}`}>
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-lg font-medium">5-Day Forecast</h3>
        
        {compact && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        )}
      </div>
      
      {expanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {dailyForecasts.map(day => (
              <div key={day.date} className="border border-input rounded-md p-3">
                <div className="text-center">
                  <p className="font-medium">
                    {format(parseISO(day.date), 'EEE')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(day.date), 'MMM d')}
                  </p>
                </div>
                
                <div className="flex justify-center my-2">
                  <img 
                    src={getWeatherIconUrl(day.weather.icon)} 
                    alt={day.weather.description}
                    className="h-10 w-10"
                  />
                </div>
                
                <div className="text-center">
                  <p className="text-xs capitalize">{day.weather.description}</p>
                  <div className="flex justify-center space-x-2 mt-1">
                    <span className="text-sm font-medium">{formatTemp(day.maxTemp)}</span>
                    <span className="text-sm text-muted-foreground">{formatTemp(day.minTemp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
