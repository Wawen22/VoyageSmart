'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { seededRandom } from '@/lib/date-utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

export default function AnimatedBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const colors = [
      'rgba(59, 130, 246, 0.3)',   // blue
      'rgba(147, 51, 234, 0.3)',   // purple
      'rgba(236, 72, 153, 0.3)',   // pink
      'rgba(16, 185, 129, 0.3)',   // emerald
      'rgba(245, 158, 11, 0.3)',   // amber
    ];

    const newParticles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      // Use deterministic values based on particle index to prevent hydration mismatches
      const seed1 = seededRandom(i * 17);
      const seed2 = seededRandom(i * 23);
      const seed3 = seededRandom(i * 31);
      const seed4 = seededRandom(i * 37);
      const seed5 = seededRandom(i * 41);
      const seed6 = seededRandom(i * 43);

      newParticles.push({
        id: i,
        x: seed1 * window.innerWidth,
        y: seed2 * window.innerHeight,
        size: seed3 * 4 + 1,
        speedX: (seed4 - 0.5) * 0.5,
        speedY: (seed5 - 0.5) * 0.5,
        opacity: seed6 * 0.5 + 0.1,
        color: colors[Math.floor(seed1 * colors.length)]
      });
    }
    setParticles(newParticles);
  }, [isMounted]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const animateParticles = () => {
      setParticles(prevParticles =>
        prevParticles.map(particle => {
          let newX = particle.x + particle.speedX;
          let newY = particle.y + particle.speedY;

          // Bounce off edges
          if (newX < 0 || newX > window.innerWidth) {
            particle.speedX *= -1;
            newX = Math.max(0, Math.min(window.innerWidth, newX));
          }
          if (newY < 0 || newY > window.innerHeight) {
            particle.speedY *= -1;
            newY = Math.max(0, Math.min(window.innerHeight, newY));
          }

          // Mouse interaction
          const dx = mousePosition.x - newX;
          const dy = mousePosition.y - newY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            const force = (100 - distance) / 100;
            newX -= (dx / distance) * force * 2;
            newY -= (dy / distance) * force * 2;
          }

          return {
            ...particle,
            x: newX,
            y: newY
          };
        })
      );
    };

    const interval = setInterval(animateParticles, 16); // ~60fps
    return () => clearInterval(interval);
  }, [mousePosition]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full transition-all duration-100"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}
      
      {/* Gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.1) 0%, transparent 300px)`
        }}
      />
    </div>
  );
}

// Professional version with subtle effects
export function SimpleAnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-slate-50/20 to-purple-50/30 dark:from-blue-950/10 dark:via-slate-950/5 dark:to-purple-950/10" />

      {/* Minimal floating shapes */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-blue-400/5 to-purple-400/5 rounded-full animate-float" />
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-gradient-to-br from-purple-400/5 to-pink-400/5 rounded-full animate-float" style={{ animationDelay: '2s' }} />
    </div>
  );
}
