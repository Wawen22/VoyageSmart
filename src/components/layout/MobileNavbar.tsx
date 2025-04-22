'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  HomeIcon,
  PlusCircleIcon,
  CalendarIcon,
  MapPinIcon,
  DollarSignIcon,
  UserIcon,
  PlaneTakeoffIcon,
  MessageCircleIcon
} from 'lucide-react';

export default function MobileNavbar() {
  const pathname = usePathname();
  
  // Don't show on auth pages or homepage
  if (
    pathname === '/' || 
    pathname === '/login' || 
    pathname === '/register' || 
    pathname === '/forgot-password'
  ) {
    return null;
  }

  // Check if we're in a trip detail page
  const isTripPage = pathname.includes('/trips/') && pathname !== '/trips/new';
  const tripId = isTripPage ? pathname.split('/')[2] : null;
  
  // Determine which section of a trip we're in
  const isItineraryPage = pathname.includes('/itinerary');
  const isExpensesPage = pathname.includes('/expenses');
  const isAccommodationsPage = pathname.includes('/accommodations');
  const isTransportationPage = pathname.includes('/transportation');
  const isChatPage = pathname.includes('/chat');

  // Only show the mobile navbar if we're in a trip detail page
  if (!isTripPage) {
    return null;
  }
  
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex justify-around items-center h-16 px-1">
        {/* Trip-specific navigation */}
        {/* Itinerary */}
        <Link 
          href={`/trips/${tripId}/itinerary`} 
          className={`flex flex-col items-center justify-center w-full h-full ${
            isItineraryPage 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CalendarIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Itinerario</span>
        </Link>
        
        {/* Accommodations */}
        <Link 
          href={`/trips/${tripId}/accommodations`} 
          className={`flex flex-col items-center justify-center w-full h-full ${
            isAccommodationsPage 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MapPinIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Alloggi</span>
        </Link>
        
        {/* Transportation */}
        <Link 
          href={`/trips/${tripId}/transportation`} 
          className={`flex flex-col items-center justify-center w-full h-full ${
            isTransportationPage 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <PlaneTakeoffIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Trasporti</span>
        </Link>
        
        {/* Expenses */}
        <Link 
          href={`/trips/${tripId}/expenses`} 
          className={`flex flex-col items-center justify-center w-full h-full ${
            isExpensesPage 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <DollarSignIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Spese</span>
        </Link>
        
        {/* Chat */}
        <Link 
          href={`/trips/${tripId}/chat`} 
          className={`flex flex-col items-center justify-center w-full h-full ${
            isChatPage 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageCircleIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Chat</span>
        </Link>
      </div>
    </div>
  );
}
