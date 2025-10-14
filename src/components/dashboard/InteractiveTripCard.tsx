'use client';

import { useState } from 'react';
import ModernTripCard from './ModernTripCard';

type Trip = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  destination: string | null;
  created_at: string;
};

interface InteractiveTripCardProps {
  trip: Trip;
}

export default function InteractiveTripCard({ trip }: InteractiveTripCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleFavoriteToggle = () => {
    setIsFavorited((prev) => !prev);
  };

  return (
    <ModernTripCard
      trip={trip}
      isFavorited={isFavorited}
      onFavoriteToggle={handleFavoriteToggle}
    />
  );
}