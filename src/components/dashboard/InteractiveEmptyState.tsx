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
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentEmoji, setCurrentEmoji] = useState(0);

  const emojis = ['🌍', '✈️', '🗺️', '📸', '🎒', '🏔️', '🏖️', '🌟'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEmoji((prev) => (prev + 1) % emojis.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [emojis.length]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  };

  const isSearching = !!searchTerm;
  const isFiltered = filter && filter !== 'all';

  if (isSearching) {
    return (
      <div 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900"
        onMouseMove={handleMouseMove}
      >
        {/* Interactive background */}
        <div 
          className="absolute inset-0 opacity-20 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.4) 0%, transparent 50%)`
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-bounce">
              <CompassIcon className="h-16 w-16 text-white" />
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center animate-spin-slow">
              <span className="text-2xl">🔍</span>
            </div>
          </div>
          
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 animate-fade-in-up">
            No trips found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md text-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            We couldn't find any trips for "<span className="font-bold text-blue-600">{searchTerm}</span>".
            Try searching for something else! 🤔
          </p>

          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="rounded-2xl px-8 py-3 text-lg hover:scale-110 transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: '400ms' }}
          >
            Clear search ✨
          </Button>
        </div>
      </div>
    );
  }

  if (isFiltered) {
    return (
      <div 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-emerald-900 dark:to-teal-900"
        onMouseMove={handleMouseMove}
      >
        {/* Interactive background */}
        <div 
          className="absolute inset-0 opacity-20 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(16, 185, 129, 0.4) 0%, transparent 50%)`
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center animate-pulse">
              <MapIcon className="h-16 w-16 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 text-4xl animate-bounce">
              {filter === 'upcoming' ? '✨' : filter === 'ongoing' ? '✈️' : filter === 'past' ? '📸' : '🌍'}
            </div>
          </div>

          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 animate-fade-in-up">
            No {filter === 'upcoming' ? 'upcoming' : filter === 'ongoing' ? 'ongoing' : filter === 'past' ? 'completed' : ''} trips
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md text-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            It's the perfect time to plan your next adventure! 🚀
          </p>

          <div className="flex gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <Button variant="outline" onClick={() => window.location.reload()} className="rounded-2xl px-6 py-3 hover:scale-110 transition-all duration-300">
              Show all
            </Button>
            <Button asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-2xl px-6 py-3 hover:scale-110 transition-all duration-300">
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
    <div 
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-violet-900 dark:to-purple-900"
      onMouseMove={handleMouseMove}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Interactive gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(139, 92, 246, 0.4) 0%, transparent 50%)`
        }}
      />
      
      <div className="relative z-10 flex flex-col items-center justify-center py-24 px-6 text-center">
        {/* Main illustration */}
        <div className="relative mb-12">
          <div 
            className={cn(
              "w-48 h-48 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl transition-all duration-1000",
              isAnimating ? "scale-110 rotate-12" : "animate-float"
            )}
            onMouseEnter={() => setIsAnimating(true)}
            onMouseLeave={() => setIsAnimating(false)}
          >
            <div className="text-6xl animate-bounce">
              {emojis[currentEmoji]}
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
            <StarIcon className="h-6 w-6 text-white" />
          </div>
          <div className="absolute -top-4 -right-8 w-8 h-8 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '1s' }}>
            <HeartIcon className="h-4 w-4 text-white" />
          </div>
          <div className="absolute -bottom-4 -left-8 w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '1.5s' }}>
            <CameraIcon className="h-8 w-8 text-white" />
          </div>
          <div className="absolute -bottom-2 -right-6 w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '2s' }}>
            <RocketIcon className="h-5 w-5 text-white" />
          </div>
        </div>
        
        <h3 className="text-5xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 animate-fade-in-up">
          La Tua Avventura Ti Aspetta! 
        </h3>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          Pronto a esplorare il mondo? Crea il tuo primo viaggio e inizia a pianificare avventure indimenticabili. 
          Dai sogni agli itinerari dettagliati, il tuo viaggio inizia qui! ✨
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 mb-12 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <Button 
            asChild 
            size="lg" 
            className="group bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-2xl px-12 py-6 text-xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:scale-110"
          >
            <Link href="/trips/new">
              <RocketIcon className="h-6 w-6 mr-3 group-hover:animate-bounce" />
              Inizia la Tua Prima Avventura
              <SparklesIcon className="h-6 w-6 ml-3 group-hover:animate-spin" />
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            asChild 
            className="rounded-2xl px-12 py-6 text-xl border-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:scale-110 transition-all duration-300"
          >
            <Link href="/documentation">
              Scopri di Più 📚
            </Link>
          </Button>
        </div>
        
        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          {[
            { icon: MapIcon, title: 'Pianifica Itinerari', desc: 'Crea piani dettagliati giorno per giorno', emoji: '🗺️' },
            { icon: CompassIcon, title: 'Traccia Avventure', desc: 'Monitora i tuoi progressi di viaggio', emoji: '🧭' },
            { icon: CameraIcon, title: 'Cattura Ricordi', desc: 'Salva foto e memorie dei tuoi viaggi', emoji: '📸' }
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={feature.title}
                className="group text-center hover:scale-110 transition-all duration-500 cursor-pointer"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:rotate-12 transition-all duration-500">
                  <Icon className="h-10 w-10 text-white" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">{feature.title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                <div className="text-2xl mt-2 group-hover:animate-bounce">{feature.emoji}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
