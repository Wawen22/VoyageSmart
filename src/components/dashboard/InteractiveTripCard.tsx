'use client';



import { useState } from 'react';

import { parseISO } from 'date-fns';

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



  const getStatus = () => {

    if (!trip.start_date || !trip.end_date) return { text: 'Planning', color: 'from-blue-500 to-cyan-500', emoji: '📋' };

    const now = new Date();

    const start = parseISO(trip.start_date);

    const end = parseISO(trip.end_date);

    if (now < start) return { text: 'Upcoming', color: 'from-emerald-500 to-teal-500', emoji: '🚀' };

    if (now >= start && now <= end) return { text: 'Ongoing', color: 'from-orange-500 to-red-500', emoji: '✈️' };

    return { text: 'Completed', color: 'from-purple-500 to-pink-500', emoji: '✅' };

  };



  const status = getStatus();



  return (

    <ModernTripCard

      trip={trip}

      isFavorited={isFavorited}

      onFavoriteToggle={handleFavoriteToggle}

      status={status}

    />

  );

}
