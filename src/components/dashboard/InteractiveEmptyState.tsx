'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  MapIcon, 
  CompassIcon, 
  CameraIcon,
  HeartIcon,
  StarIcon,
  GlobeIcon,
  RocketIcon,
  SparklesIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InteractiveEmptyStateProps {
  searchTerm?: string;
  filter?: string;
}

export default function InteractiveEmptyState({ searchTerm, filter }: InteractiveEmptyStateProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentEmoji, setCurrentEmoji] = useState(0);

  const emojis = ['🌍', '✈️', '🗺️', '📸', '🎒', '🏔️', '🏖️', '🌟'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEmoji((prev) => (prev + 1) % emojis.length);
    }, 3000); // Rallentato a 3 secondi
    return () => clearInterval(interval);
  }, [emojis.length]);

  const isSearching = !!searchTerm;
  const isFiltered = filter && filter !== 'all';

  if (isSearching) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 border border-border/50">
        {/* Clean background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/80" />

        <div className="relative z-10 flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
              <CompassIcon className="h-16 w-16 text-primary-foreground" />
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
          </div>

          <h3 className="text-3xl font-bold text-foreground mb-4">
            No trips found
          </h3>
          <p className="text-muted-foreground mb-8 max-w-md text-lg">
            We couldn't find any trips for "<span className="font-bold text-primary">{searchTerm}</span>".
            Try searching for something else! 🤔
          </p>

          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="rounded-2xl px-8 py-3 text-lg hover:scale-105 transition-all duration-300"
          >
            Clear search ✨
          </Button>
        </div>
      </div>
    );
  }

  if (isFiltered) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 border border-border/50">
        {/* Clean background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/80" />

        <div className="relative z-10 flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
              <MapIcon className="h-16 w-16 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-2 -right-2 text-4xl">
              {filter === 'upcoming' ? '✨' : filter === 'ongoing' ? '✈️' : filter === 'past' ? '📸' : '🌍'}
            </div>
          </div>

          <h3 className="text-3xl font-bold text-foreground mb-4">
            No {filter === 'upcoming' ? 'upcoming' : filter === 'ongoing' ? 'ongoing' : filter === 'past' ? 'completed' : ''} trips
          </h3>
          <p className="text-muted-foreground mb-8 max-w-md text-lg">
            It's the perfect time to plan your next adventure! 🚀
          </p>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => window.location.reload()} className="rounded-2xl px-6 py-3 hover:scale-105 transition-all duration-300">
              Show all
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-6 py-3 hover:scale-105 transition-all duration-300">
              <Link href="/trips/new">
                <PlusIcon className="h-5 w-5 mr-2" />
                Plan Trip
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 border border-border/50">
      {/* Clean background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/80" />

      <div className="relative z-10 flex flex-col items-center justify-center py-24 px-6 text-center">
        {/* Main illustration */}
        <div className="relative mb-12">
          <div
            className={cn(
              "w-48 h-48 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105",
              isAnimating ? "scale-105" : ""
            )}
            onMouseEnter={() => setIsAnimating(true)}
            onMouseLeave={() => setIsAnimating(false)}
          >
            <div className="text-6xl">
              {emojis[currentEmoji]}
            </div>
          </div>

          {/* Floating elements with app colors */}
          <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-primary/80 to-primary rounded-full flex items-center justify-center shadow-lg">
            <StarIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="absolute -top-4 -right-8 w-8 h-8 bg-gradient-to-br from-primary/60 to-primary/80 rounded-full flex items-center justify-center shadow-lg">
            <HeartIcon className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="absolute -bottom-4 -left-8 w-16 h-16 bg-gradient-to-br from-primary/70 to-primary/90 rounded-full flex items-center justify-center shadow-lg">
            <CameraIcon className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="absolute -bottom-2 -right-6 w-10 h-10 bg-gradient-to-br from-primary/50 to-primary/70 rounded-full flex items-center justify-center shadow-lg">
            <RocketIcon className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
        
        <h3 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent mb-6">
          La Tua Avventura Ti Aspetta!
        </h3>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl leading-relaxed">
          Pronto a esplorare il mondo? Crea il tuo primo viaggio e inizia a pianificare avventure indimenticabili.
          Dai sogni agli itinerari dettagliati, il tuo viaggio inizia qui! ✨
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 mb-12">
          <Button
            asChild
            size="lg"
            className="group bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-12 py-6 text-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Link href="/trips/new">
              <RocketIcon className="h-6 w-6 mr-3" />
              Inizia la Tua Prima Avventura
              <SparklesIcon className="h-6 w-6 ml-3" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="rounded-2xl px-12 py-6 text-xl border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 hover:scale-105"
          >
            <Link href="/support">
              Scopri di Più 📚
            </Link>
          </Button>
        </div>
        
        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          {[
            { icon: MapIcon, title: 'Pianifica Itinerari', desc: 'Crea piani dettagliati giorno per giorno', emoji: '🗺️' },
            { icon: CompassIcon, title: 'Traccia Avventure', desc: 'Monitora i tuoi progressi di viaggio', emoji: '🧭' },
            { icon: CameraIcon, title: 'Cattura Ricordi', desc: 'Salva foto e memorie dei tuoi viaggi', emoji: '📸' }
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group text-center hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Icon className="h-10 w-10 text-primary-foreground" />
                </div>
                <h4 className="font-bold text-foreground mb-2 text-lg">{feature.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                <div className="text-2xl mt-2">{feature.emoji}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
