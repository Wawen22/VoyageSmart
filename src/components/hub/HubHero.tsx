'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Clock, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArticleListItem, CATEGORY_METADATA } from '@/types/article';
import { formatDistanceToNow } from 'date-fns';

interface HubHeroProps {
  featuredArticles: ArticleListItem[];
}

export default function HubHero({ featuredArticles }: HubHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const currentArticle = featuredArticles[currentIndex];
  const categoryMeta = currentArticle ? CATEGORY_METADATA[currentArticle.category] : null;

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || featuredArticles.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredArticles.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredArticles.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredArticles.length);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredArticles.length) % featuredArticles.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  if (!currentArticle) {
    return null;
  }

  const formattedDate = currentArticle.published_at
    ? formatDistanceToNow(new Date(currentArticle.published_at), { addSuffix: true })
    : '';

  return (
    <section className="relative w-full h-[600px] md:h-[700px] overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background Image with Overlay */}
      {currentArticle.featured_image_url && (
        <>
          <div className="absolute inset-0 z-0">
            <Image
              src={currentArticle.featured_image_url}
              alt={currentArticle.title}
              fill
              className="object-cover transition-opacity duration-1000"
              priority
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
        </>
      )}

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 h-full flex items-center">
        <div className="max-w-3xl space-y-6 animate-fade-in">
          {/* Category Badge */}
          {categoryMeta && (
            <Badge
              className="text-sm px-4 py-2 backdrop-blur-md border-white/20 shadow-lg"
              style={{
                backgroundColor: `${categoryMeta.color}30`,
                borderColor: `${categoryMeta.color}60`,
                color: '#ffffff'
              }}
            >
              {categoryMeta.name}
            </Badge>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white drop-shadow-2xl">
            {currentArticle.title}
          </h1>

          {/* Excerpt */}
          <p className="text-lg md:text-xl text-white/90 leading-relaxed line-clamp-3 drop-shadow-lg">
            {currentArticle.excerpt}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-white/80">
            {/* Author */}
            <div className="flex items-center gap-2">
              {currentArticle.author_avatar_url ? (
                <Image
                  src={currentArticle.author_avatar_url}
                  alt={currentArticle.author_name}
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-white/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-sm font-bold border-2 border-white/30">
                  {currentArticle.author_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-medium">{currentArticle.author_name}</span>
            </div>

            {/* Read Time */}
            {currentArticle.read_time_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{currentArticle.read_time_minutes} min read</span>
              </div>
            )}

            {/* Date */}
            {formattedDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div>
            <Link href={`/hub/${currentArticle.slug}`}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white px-8 py-6 rounded-xl text-lg font-semibold shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105"
              >
                Read Article
                <ArrowRight className="ml-2 h-5 w-5 animate-bounce-horizontal" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      {featuredArticles.length > 1 && (
        <>
          {/* Previous/Next Buttons */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110"
            aria-label="Previous article"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110"
            aria-label="Next article"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {featuredArticles.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`
                  h-2 rounded-full transition-all duration-300
                  ${index === currentIndex 
                    ? 'w-8 bg-white' 
                    : 'w-2 bg-white/50 hover:bg-white/70'
                  }
                `}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-primary/15 to-transparent rounded-full blur-3xl pointer-events-none z-10" />
    </section>
  );
}

