'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

interface FeatureCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge: {
    icon: React.ReactNode;
    text: string;
  };
  highlights: string[];
  image?: string;
  imagePlaceholder?: React.ReactNode;
}

interface FeatureCarouselProps {
  features: FeatureCard[];
  autoPlayInterval?: number;
  showPreviews?: boolean;
}

export default function FeatureCarousel({ 
  features, 
  autoPlayInterval = 5000,
  showPreviews = true 
}: FeatureCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const currentFeature = features[currentIndex];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, isPaused, features.length, autoPlayInterval]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000); // Resume auto-play after 3s
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000);
  }, [features.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % features.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000);
  }, [features.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Touch/swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      goToNext();
    } else if (distance < -minSwipeDistance) {
      goToPrevious();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="space-y-8">
      {/* Main Carousel */}
      <div 
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Feature Card */}
        <div className="relative overflow-hidden">
          <div 
            className="transition-all duration-500 ease-in-out"
            key={currentFeature.id}
          >
            <div 
              className={`group relative overflow-hidden bg-gradient-to-br from-card/95 via-card/90 to-card/85 backdrop-blur-xl border-2 border-border/30 hover:border-${currentFeature.color}-500/40 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500`}
            >
              {/* Glowing Background Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br from-${currentFeature.color}-500/5 via-transparent to-${currentFeature.color}-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl`}></div>
              
              <div className="relative z-10 p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
                  {/* Left Side - Content */}
                  <div className="space-y-6">
                    {/* Icon & Title */}
                    <div className="flex items-start gap-4">
                      <div className={`p-3 bg-gradient-to-br from-${currentFeature.color}-500/20 to-${currentFeature.color}-500/10 rounded-xl shadow-lg`}>
                        {currentFeature.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-2xl lg:text-3xl font-bold mb-1 bg-gradient-to-r from-${currentFeature.color}-600 to-${currentFeature.color}-500 bg-clip-text text-transparent`}>
                          {currentFeature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{currentFeature.subtitle}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {currentFeature.description}
                    </p>

                    {/* Feature Highlights - Compact */}
                    <div className="space-y-2">
                      {currentFeature.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 bg-${currentFeature.color}-500 rounded-full flex-shrink-0`}></div>
                          <p className="text-sm text-foreground">{highlight}</p>
                        </div>
                      ))}
                    </div>

                    {/* Badge */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-${currentFeature.color}-500/10 border border-${currentFeature.color}-500/30 text-${currentFeature.color}-600 dark:text-${currentFeature.color}-400 text-sm font-semibold`}>
                      {currentFeature.badge.icon}
                      {currentFeature.badge.text}
                    </div>
                  </div>

                  {/* Right Side - Visual */}
                  <div className="relative h-64 lg:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-${currentFeature.color}-500/10 via-${currentFeature.color}-500/5 to-transparent">
                    {currentFeature.image ? (
                      <img 
                        src={currentFeature.image} 
                        alt={currentFeature.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {currentFeature.imagePlaceholder}
                      </div>
                    )}
                    <div className={`absolute top-4 right-4 px-3 py-1.5 bg-${currentFeature.color}-500/90 backdrop-blur-sm rounded-full border border-${currentFeature.color}-300/30`}>
                      <span className="text-xs font-bold text-white">NEW</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-background/90 backdrop-blur-sm border-2 border-border hover:border-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-10"
          aria-label="Previous feature"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-background/90 backdrop-blur-sm border-2 border-border hover:border-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-10"
          aria-label="Next feature"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>

        {/* Auto-play Control */}
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="absolute bottom-4 right-4 p-2.5 bg-background/90 backdrop-blur-sm border border-border hover:border-primary rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10"
          aria-label={isAutoPlaying ? 'Pause auto-play' : 'Resume auto-play'}
        >
          {isAutoPlaying ? (
            <Pause className="h-4 w-4 text-foreground" />
          ) : (
            <Play className="h-4 w-4 text-foreground" />
          )}
        </button>
      </div>

      {/* Navigation Dots + Preview Thumbnails */}
      <div className="space-y-6">
        {/* Dots */}
        <div className="flex justify-center items-center gap-3">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'w-8 h-2 bg-primary'
                  : 'w-2 h-2 bg-border hover:bg-primary/50'
              }`}
              aria-label={`Go to feature ${index + 1}`}
            />
          ))}
        </div>

        {/* Preview Thumbnails */}
        {showPreviews && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <button
                key={feature.id}
                onClick={() => goToSlide(index)}
                className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                  index === currentIndex
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-border/50 hover:border-primary/50 hover:bg-card/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br from-${feature.color}-500/20 to-${feature.color}-500/10`}>
                    <div className="scale-75">
                      {feature.icon}
                    </div>
                  </div>
                  {index === currentIndex && (
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1 line-clamp-1">
                  {feature.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {feature.subtitle}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
