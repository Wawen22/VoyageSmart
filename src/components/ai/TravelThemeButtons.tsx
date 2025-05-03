'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Palmtree,
  Building2,
  Mountain,
  Utensils,
  Landmark,
  Briefcase,
  Heart,
  Users,
  Sparkles,
  Clock,
  Zap,
  Tag,
  Info
} from 'lucide-react';

// Define travel themes
const travelThemes = [
  {
    id: 'beach',
    name: 'Vacanza al Mare',
    icon: <Palmtree className="h-5 w-5" />,
    color: 'bg-blue-500',
    bgImage: 'url("/images/themes/beach.jpg")',
    description: 'Relax sulla spiaggia, nuoto e attività all\'aria aperta',
    preferences: {
      tripType: 'beach',
      interests: ['relax', 'nature', 'food'],
      pace: 'relaxed',
      preferredTimes: ['morning', 'afternoon']
    }
  },
  {
    id: 'city',
    name: 'Esplorazione Urbana',
    icon: <Building2 className="h-5 w-5" />,
    color: 'bg-slate-600',
    bgImage: 'url("/images/themes/city.jpg")',
    description: 'Visita musei, monumenti e scopri la vita cittadina',
    preferences: {
      tripType: 'city',
      interests: ['sightseeing', 'culture', 'food', 'shopping'],
      pace: 'moderate',
      preferredTimes: ['morning', 'afternoon', 'evening']
    }
  },
  {
    id: 'adventure',
    name: 'Avventura',
    icon: <Mountain className="h-5 w-5" />,
    color: 'bg-green-600',
    bgImage: 'url("/images/themes/adventure.jpg")',
    description: 'Escursioni, sport e attività adrenaliniche',
    preferences: {
      tripType: 'adventure',
      interests: ['sport', 'nature', 'adventure'],
      pace: 'active',
      preferredTimes: ['morning', 'afternoon']
    }
  },
  {
    id: 'culinary',
    name: 'Tour Gastronomico',
    icon: <Utensils className="h-5 w-5" />,
    color: 'bg-orange-500',
    bgImage: 'url("/images/themes/culinary.jpg")',
    description: 'Degustazioni, corsi di cucina e ristoranti tipici',
    preferences: {
      tripType: 'culinary',
      interests: ['food', 'culture'],
      pace: 'moderate',
      preferredTimes: ['morning', 'afternoon', 'evening']
    }
  },
  {
    id: 'cultural',
    name: 'Immersione Culturale',
    icon: <Landmark className="h-5 w-5" />,
    color: 'bg-purple-600',
    bgImage: 'url("/images/themes/cultural.jpg")',
    description: 'Musei, siti storici e tradizioni locali',
    preferences: {
      tripType: 'cultural',
      interests: ['culture', 'sightseeing', 'history'],
      pace: 'moderate',
      preferredTimes: ['morning', 'afternoon']
    }
  },
  {
    id: 'business',
    name: 'Viaggio di Lavoro',
    icon: <Briefcase className="h-5 w-5" />,
    color: 'bg-gray-700',
    bgImage: 'url("/images/themes/business.jpg")',
    description: 'Riunioni, networking e tempo libero organizzato',
    preferences: {
      tripType: 'business',
      interests: ['business', 'food'],
      pace: 'busy',
      preferredTimes: ['morning', 'evening']
    }
  },
  {
    id: 'romantic',
    name: 'Fuga Romantica',
    icon: <Heart className="h-5 w-5" />,
    color: 'bg-pink-500',
    bgImage: 'url("/images/themes/romantic.jpg")',
    description: 'Cene a lume di candela, passeggiate e momenti speciali',
    preferences: {
      tripType: 'romantic',
      interests: ['relax', 'food', 'entertainment'],
      pace: 'relaxed',
      preferredTimes: ['afternoon', 'evening']
    }
  },
  {
    id: 'family',
    name: 'Vacanza in Famiglia',
    icon: <Users className="h-5 w-5" />,
    color: 'bg-teal-500',
    bgImage: 'url("/images/themes/family.jpg")',
    description: 'Attività per bambini, parchi e divertimento per tutti',
    preferences: {
      tripType: 'family',
      interests: ['entertainment', 'nature', 'food'],
      pace: 'moderate',
      preferredTimes: ['morning', 'afternoon']
    }
  }
];

// Tipo per le preferenze di viaggio
type TravelPreferences = {
  tripType: string;
  interests: string[];
  pace: string;
  preferredTimes: string[];
};

// Tipo per i temi di viaggio
type TravelTheme = {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgImage: string;
  description: string;
  preferences: TravelPreferences;
};

interface TravelThemeButtonsProps {
  onSelectTheme: (preferences: TravelPreferences) => void;
}

export default function TravelThemeButtons({ onSelectTheme }: TravelThemeButtonsProps) {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [detailTheme, setDetailTheme] = useState<TravelTheme | null>(null);

  // Gestisce la selezione di un tema
  const handleThemeSelect = (theme: TravelTheme) => {
    setSelectedTheme(theme.id);
    onSelectTheme(theme.preferences);
  };

  // Mostra i dettagli di un tema
  const handleShowDetails = (theme: TravelTheme) => {
    setDetailTheme(theme);
    setShowDetails(true);
  };

  // Chiude i dettagli
  const handleCloseDetails = () => {
    setShowDetails(false);
  };

  // Formatta il ritmo del viaggio
  const formatPace = (pace: string) => {
    switch (pace) {
      case 'relaxed':
        return 'Rilassato';
      case 'moderate':
        return 'Moderato';
      case 'active':
        return 'Attivo';
      case 'busy':
        return 'Intenso';
      default:
        return pace;
    }
  };

  // Formatta gli orari preferiti
  const formatTimes = (times: string[]) => {
    const timeMap: Record<string, string> = {
      'morning': 'Mattina',
      'afternoon': 'Pomeriggio',
      'evening': 'Sera'
    };

    return times.map(time => timeMap[time] || time).join(', ');
  };

  // Formatta gli interessi
  const formatInterests = (interests: string[]) => {
    const interestMap: Record<string, string> = {
      'relax': 'Relax',
      'nature': 'Natura',
      'food': 'Gastronomia',
      'sightseeing': 'Visite turistiche',
      'culture': 'Cultura',
      'shopping': 'Shopping',
      'sport': 'Sport',
      'adventure': 'Avventura',
      'entertainment': 'Intrattenimento',
      'business': 'Lavoro',
      'history': 'Storia'
    };

    return interests.map(interest => interestMap[interest] || interest);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <h3 className="text-sm font-medium flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-primary" />
          Seleziona un tema di viaggio
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {travelThemes.map(theme => (
            <Card
              key={theme.id}
              className={`overflow-hidden border transition-all duration-200 hover:shadow-md cursor-pointer ${
                selectedTheme === theme.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleThemeSelect(theme)}
            >
              <div
                className="h-20 flex items-center justify-center text-white relative"
                style={{
                  backgroundColor: theme.color.replace('bg-', ''),
                  backgroundImage: theme.bgImage,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative z-10 flex flex-col items-center">
                  {theme.icon}
                  <span className="text-xs font-medium mt-1">{theme.name}</span>
                </div>
              </div>
              <CardContent className="p-2">
                <p className="text-[10px] text-muted-foreground line-clamp-2">
                  {theme.description}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1 py-0 ${
                      theme.preferences.pace === 'relaxed' ? 'bg-blue-50 dark:bg-blue-950/30' :
                      theme.preferences.pace === 'active' ? 'bg-green-50 dark:bg-green-950/30' :
                      theme.preferences.pace === 'busy' ? 'bg-red-50 dark:bg-red-950/30' :
                      'bg-orange-50 dark:bg-orange-950/30'
                    }`}
                  >
                    {formatPace(theme.preferences.pace)}
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowDetails(theme);
                        }}
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Dettagli tema</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modale dettagli tema */}
        {showDetails && detailTheme && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleCloseDetails}>
            <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div
                className="h-32 flex items-center justify-center text-white relative"
                style={{
                  backgroundColor: detailTheme.color.replace('bg-', ''),
                  backgroundImage: detailTheme.bgImage,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative z-10 flex flex-col items-center">
                  {detailTheme.icon}
                  <h3 className="text-lg font-medium mt-1">{detailTheme.name}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-7 w-7 p-0 bg-black/30 text-white hover:bg-black/50"
                  onClick={handleCloseDetails}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-4">
                <p className="text-sm mb-4">{detailTheme.description}</p>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <h4 className="text-xs font-medium">Ritmo</h4>
                      <p className="text-xs text-muted-foreground">{formatPace(detailTheme.preferences.pace)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <h4 className="text-xs font-medium">Orari preferiti</h4>
                      <p className="text-xs text-muted-foreground">{formatTimes(detailTheme.preferences.preferredTimes)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Tag className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <h4 className="text-xs font-medium">Interessi</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formatInterests(detailTheme.preferences.interests).map((interest, index) => (
                          <Badge key={index} variant="secondary" className="text-[10px]">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={() => {
                    handleThemeSelect(detailTheme);
                    handleCloseDetails();
                  }}
                >
                  Seleziona questo tema
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
