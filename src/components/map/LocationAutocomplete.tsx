'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import MapboxWrapper from './MapboxWrapper';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, coordinates?: { x: number; y: number }) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Inserisci un indirizzo',
  error,
  className = '',
}: LocationAutocompleteProps) {
  return (
    <MapboxWrapper fallback={
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        disabled
      />
    }>
      {(mapboxgl) => (
        <LocationAutocompleteContent
          mapboxgl={mapboxgl}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          error={error}
          className={className}
        />
      )}
    </MapboxWrapper>
  );
}

interface LocationAutocompleteContentProps extends LocationAutocompleteProps {
  mapboxgl: any;
}

function LocationAutocompleteContent({
  mapboxgl,
  value,
  onChange,
  placeholder = 'Inserisci un indirizzo',
  error,
  className = '',
}: LocationAutocompleteContentProps) {
  const [searchInput, setSearchInput] = useState(value);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Aggiorna l'input quando cambia il valore esterno
  useEffect(() => {
    setSearchInput(value);
  }, [value]);

  // Gestisce i click fuori dai risultati per chiuderli
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cerca luoghi usando l'API di geocodifica di Mapbox
  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${mapboxgl.accessToken}&types=place,locality,neighborhood,address&limit=5`
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();
      setSearchResults(data.features);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching places:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Gestisce il cambio dell'input di ricerca
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchInput(query);
    onChange(query); // Aggiorna il valore esterno
    
    // Debounce della ricerca
    const timeoutId = setTimeout(() => {
      searchPlaces(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Gestisce la selezione di un risultato
  const handleSelectResult = (feature: any) => {
    const placeName = feature.place_name;
    const [lng, lat] = feature.center;
    
    setSearchInput(placeName);
    onChange(placeName, { x: lng, y: lat });
    setShowResults(false);
  };

  return (
    <div className="relative">
      <Input
        value={searchInput}
        onChange={handleSearchInputChange}
        placeholder={placeholder}
        className={className}
        onFocus={() => searchInput.length >= 3 && setShowResults(true)}
      />
      
      {isSearching && (
        <div className="absolute right-3 top-2.5">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {showResults && searchResults.length > 0 && (
        <div 
          ref={resultsRef}
          className="absolute z-50 mt-1 w-full bg-background border border-input rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {searchResults.map(feature => (
            <div
              key={feature.id}
              className="p-2 hover:bg-accent cursor-pointer"
              onClick={() => handleSelectResult(feature)}
            >
              <div className="font-medium text-sm">{feature.text}</div>
              <div className="text-xs text-muted-foreground">{feature.place_name}</div>
            </div>
          ))}
        </div>
      )}
      
      {error && (
        <p className="text-destructive text-xs mt-1">{error}</p>
      )}
    </div>
  );
}
