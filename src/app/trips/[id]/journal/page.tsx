'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function JournalRedirect() {
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    // Redirect to the itinerary page with the journal tab active
    router.push(`/trips/${id}/itinerary?tab=journal`);
  }, [router, id]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to Trip Planner...</p>
      </div>
    </div>
  );
}
