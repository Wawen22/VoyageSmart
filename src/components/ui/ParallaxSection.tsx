'use client';

import React, { useEffect, useState, ReactNode } from 'react';

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  bgImage?: string;
  speed?: number;
  overlay?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
}

export default function ParallaxSection({
  children,
  className = '',
  bgImage,
  speed = 0.5,
  overlay = true,
  overlayColor = '#000',
  overlayOpacity = 0.5,
}: ParallaxSectionProps) {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const parallaxStyle: React.CSSProperties = {
    backgroundImage: bgImage ? `url(${bgImage})` : undefined,
    backgroundPosition: `center ${scrollPosition * speed}px`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: overlayColor,
    opacity: overlayOpacity,
    zIndex: 1,
  };

  const contentStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 2,
  };

  return (
    <section className={className} style={parallaxStyle}>
      {overlay && <div style={overlayStyle} />}
      <div style={contentStyle}>{children}</div>
    </section>
  );
}
