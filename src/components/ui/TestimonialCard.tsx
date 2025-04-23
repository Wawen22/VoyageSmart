'use client';

import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface TestimonialCardProps {
  name: string;
  role?: string;
  content: string;
  rating?: number;
  avatarUrl?: string;
  className?: string;
}

export default function TestimonialCard({
  name,
  role,
  content,
  rating = 5,
  avatarUrl,
  className = '',
}: TestimonialCardProps) {
  // Generate stars based on rating
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`star-${i}`} className="h-4 w-4 fill-primary text-primary" />
      );
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <StarHalf key="half-star" className="h-4 w-4 fill-primary text-primary" />
      );
    }

    // Add empty stars to make 5 total
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-star-${i}`} className="h-4 w-4 text-muted-foreground" />
      );
    }

    return stars;
  };

  return (
    <Card className={cn('overflow-hidden hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-6">
        {/* Rating stars */}
        {rating > 0 && (
          <div className="flex mb-4">{renderStars()}</div>
        )}

        {/* Testimonial content */}
        <p className="text-foreground/90 mb-4 italic">"{content}"</p>

        {/* Author info */}
        <div className="flex items-center">
          {avatarUrl && (
            <div className="mr-3 h-10 w-10 rounded-full overflow-hidden bg-muted">
              <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
            </div>
          )}
          <div>
            <p className="font-medium">{name}</p>
            {role && <p className="text-sm text-muted-foreground">{role}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
