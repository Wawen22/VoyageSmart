'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedLogoProps {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  animated?: boolean;
  sizes?: string;
}

export default function OptimizedLogo({
  width = 200,
  height = 60,
  className = '',
  priority = false,
  animated = false,
  sizes = '(max-width: 768px) 100vw, 200px'
}: OptimizedLogoProps) {
  if (animated) {
    return (
      <div className={cn('relative', className)}>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto object-contain"
          poster="/images/logo-voyage_smart.png"
          style={{ width, height: 'auto' }}
        >
          <source src="/images/animated_logo-voyage_smart.mp4" type="video/mp4" />
          {/* Fallback to static image instead of heavy GIF */}
          <Image
            src="/images/logo-voyage_smart.png"
            alt="VoyageSmart - Your AI Travel Companion"
            width={width}
            height={height}
            className="w-full h-auto"
            priority={priority}
            sizes={sizes}
            quality={85}
          />
        </video>
      </div>
    );
  }

  return (
    <Image
      src="/images/logo-voyage_smart.png"
      alt="Voyage Smart Logo"
      width={width}
      height={height}
      className={cn('h-auto w-auto', className)}
      priority={priority}
      sizes={sizes}
      quality={85}
    />
  );
}

// Specialized components for different use cases
export function NavbarLogo({ className = '' }: { className?: string }) {
  return (
    <OptimizedLogo
      width={200}
      height={60}
      className={cn('h-12 w-auto', className)}
      priority={true}
      sizes="200px"
    />
  );
}

export function HeroLogo({ className = '' }: { className?: string }) {
  return (
    <OptimizedLogo
      width={500}
      height={150}
      className={className}
      priority={true}
      animated={true}
      sizes="(max-width: 768px) 400px, (max-width: 1200px) 500px, 600px"
    />
  );
}

export function FooterLogo({ className = '' }: { className?: string }) {
  return (
    <OptimizedLogo
      width={240}
      height={60}
      className={className}
      priority={false}
      sizes="240px"
    />
  );
}
