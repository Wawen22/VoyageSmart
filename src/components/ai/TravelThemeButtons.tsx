'use client';

import { Button } from '@/components/ui/button';
import { 
  Palmtree, 
  Building2, 
  Mountain, 
  Utensils, 
  Landmark, 
  Briefcase, 
  Heart, 
  Users, 
  Sparkles 
} from 'lucide-react';

// Define travel themes
const travelThemes = [
  {
    id: 'beach',
    name: 'Beach Vacation',
    icon: <Palmtree className="h-4 w-4 mr-2" />,
    preferences: {
      tripType: 'beach',
      interests: ['relax', 'nature', 'food'],
      pace: 'relaxed',
      preferredTimes: ['morning', 'afternoon']
    }
  },
  {
    id: 'city',
    name: 'City Exploration',
    icon: <Building2 className="h-4 w-4 mr-2" />,
    preferences: {
      tripType: 'city',
      interests: ['sightseeing', 'culture', 'food', 'shopping'],
      pace: 'moderate',
      preferredTimes: ['morning', 'afternoon', 'evening']
    }
  },
  {
    id: 'adventure',
    name: 'Adventure Trip',
    icon: <Mountain className="h-4 w-4 mr-2" />,
    preferences: {
      tripType: 'adventure',
      interests: ['sport', 'nature', 'adventure'],
      pace: 'active',
      preferredTimes: ['morning', 'afternoon']
    }
  },
  {
    id: 'culinary',
    name: 'Culinary Tour',
    icon: <Utensils className="h-4 w-4 mr-2" />,
    preferences: {
      tripType: 'culinary',
      interests: ['food', 'culture'],
      pace: 'moderate',
      preferredTimes: ['morning', 'afternoon', 'evening']
    }
  },
  {
    id: 'cultural',
    name: 'Cultural Immersion',
    icon: <Landmark className="h-4 w-4 mr-2" />,
    preferences: {
      tripType: 'cultural',
      interests: ['culture', 'sightseeing', 'history'],
      pace: 'moderate',
      preferredTimes: ['morning', 'afternoon']
    }
  },
  {
    id: 'business',
    name: 'Business Trip',
    icon: <Briefcase className="h-4 w-4 mr-2" />,
    preferences: {
      tripType: 'business',
      interests: ['business', 'food'],
      pace: 'busy',
      preferredTimes: ['morning', 'evening']
    }
  },
  {
    id: 'romantic',
    name: 'Romantic Getaway',
    icon: <Heart className="h-4 w-4 mr-2" />,
    preferences: {
      tripType: 'romantic',
      interests: ['relax', 'food', 'entertainment'],
      pace: 'relaxed',
      preferredTimes: ['afternoon', 'evening']
    }
  },
  {
    id: 'family',
    name: 'Family Vacation',
    icon: <Users className="h-4 w-4 mr-2" />,
    preferences: {
      tripType: 'family',
      interests: ['entertainment', 'nature', 'food'],
      pace: 'moderate',
      preferredTimes: ['morning', 'afternoon']
    }
  }
];

interface TravelThemeButtonsProps {
  onSelectTheme: (preferences: any) => void;
}

export default function TravelThemeButtons({ onSelectTheme }: TravelThemeButtonsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium flex items-center">
        <Sparkles className="h-4 w-4 mr-2 text-primary" />
        Seleziona un tema di viaggio
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        {travelThemes.map(theme => (
          <Button
            key={theme.id}
            variant="outline"
            className="justify-start h-auto py-2"
            onClick={() => onSelectTheme(theme.preferences)}
          >
            {theme.icon}
            <span className="text-xs">{theme.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
