'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSubscription } from '@/lib/subscription';
import UnreadBadge from '@/components/chat/UnreadBadge';
import {
  HomeIcon,
  PlusCircleIcon,
  CalendarIcon,
  MapPinIcon,
  DollarSignIcon,
  UserIcon,
  PlaneTakeoffIcon,
  MessageCircleIcon,
  SparklesIcon,
  LockIcon,
  BookOpenIcon
} from 'lucide-react';

export default function MobileNavbar() {
  const pathname = usePathname();
  const { isSubscribed } = useSubscription();

  // Don't show on auth pages or homepage
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password'
  ) {
    return <div></div>;
  }

  // Check if we're in a trip detail page
  const isTripPage = pathname.includes('/trips/') && pathname !== '/trips/new';
  const tripId = isTripPage ? pathname.split('/')[2] : null;

  // Determine which section of a trip we're in
  const isTripPlannerPage = pathname.includes('/itinerary') || pathname.includes('/journal');
  const isExpensesPage = pathname.includes('/expenses');
  const isAccommodationsPage = pathname.includes('/accommodations');
  const isTransportationPage = pathname.includes('/transportation');
  const isChatPage = pathname.includes('/chat');

  // Only show the mobile navbar if we're in a trip detail page
  if (!isTripPage) {
    return null;
  }

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 z-50 shadow-2xl">
      <div className="flex justify-around items-center h-16 px-2">
        {/* Trip-specific navigation */}
        {/* Trip Planner */}
        <Link
          href={`/trips/${tripId}/itinerary`}
          className="flex flex-col items-center justify-center w-full h-full group relative"
        >
          <div className={`relative p-2.5 rounded-2xl transition-all duration-300 ${
            isTripPlannerPage
              ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/30 shadow-lg shadow-blue-500/25'
              : 'bg-gradient-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-sm border border-blue-500/10 hover:from-blue-500/15 hover:to-purple-500/15 hover:border-blue-500/25 hover:shadow-md hover:shadow-blue-500/20 hover:scale-110'
          }`}>
            <CalendarIcon className={`h-5 w-5 transition-colors duration-300 ${
              isTripPlannerPage ? 'text-blue-500' : 'text-blue-400 group-hover:text-blue-500'
            }`} />
            <BookOpenIcon className={`h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5 transition-colors duration-300 ${
              isTripPlannerPage ? 'text-purple-500' : 'text-purple-400 group-hover:text-purple-500'
            }`} />
          </div>
          {isTripPlannerPage && (
            <div className="absolute -bottom-1 w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
          )}
        </Link>

        {/* Accommodations */}
        <Link
          href={`/trips/${tripId}/accommodations`}
          className="flex flex-col items-center justify-center w-full h-full group relative"
        >
          <div className={`relative p-2.5 rounded-2xl transition-all duration-300 ${
            isAccommodationsPage
              ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-emerald-500/30 shadow-lg shadow-emerald-500/25'
              : 'bg-gradient-to-br from-emerald-500/5 to-teal-500/5 backdrop-blur-sm border border-emerald-500/10 hover:from-emerald-500/15 hover:to-teal-500/15 hover:border-emerald-500/25 hover:shadow-md hover:shadow-emerald-500/20 hover:scale-110'
          }`}>
            <MapPinIcon className={`h-5 w-5 transition-colors duration-300 ${
              isAccommodationsPage ? 'text-emerald-500' : 'text-emerald-400 group-hover:text-emerald-500'
            }`} />
            {!isSubscribed('premium') && (
              <SparklesIcon className="h-2.5 w-2.5 text-amber-500 absolute -top-0.5 -right-0.5 animate-pulse" />
            )}
          </div>
          {isAccommodationsPage && (
            <div className="absolute -bottom-1 w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
          )}
        </Link>

        {/* Transportation */}
        <Link
          href={`/trips/${tripId}/transportation`}
          className="flex flex-col items-center justify-center w-full h-full group relative"
        >
          <div className={`relative p-2.5 rounded-2xl transition-all duration-300 ${
            isTransportationPage
              ? 'bg-gradient-to-br from-sky-500/20 to-cyan-500/20 backdrop-blur-sm border border-sky-500/30 shadow-lg shadow-sky-500/25'
              : 'bg-gradient-to-br from-sky-500/5 to-cyan-500/5 backdrop-blur-sm border border-sky-500/10 hover:from-sky-500/15 hover:to-cyan-500/15 hover:border-sky-500/25 hover:shadow-md hover:shadow-sky-500/20 hover:scale-110'
          }`}>
            <PlaneTakeoffIcon className={`h-5 w-5 transition-colors duration-300 ${
              isTransportationPage ? 'text-sky-500' : 'text-sky-400 group-hover:text-sky-500'
            }`} />
            {!isSubscribed('premium') && (
              <SparklesIcon className="h-2.5 w-2.5 text-amber-500 absolute -top-0.5 -right-0.5 animate-pulse" />
            )}
          </div>
          {isTransportationPage && (
            <div className="absolute -bottom-1 w-1 h-1 bg-sky-500 rounded-full animate-pulse"></div>
          )}
        </Link>

        {/* Expenses */}
        <Link
          href={`/trips/${tripId}/expenses`}
          className="flex flex-col items-center justify-center w-full h-full group relative"
        >
          <div className={`relative p-2.5 rounded-2xl transition-all duration-300 ${
            isExpensesPage
              ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 shadow-lg shadow-amber-500/25'
              : 'bg-gradient-to-br from-amber-500/5 to-orange-500/5 backdrop-blur-sm border border-amber-500/10 hover:from-amber-500/15 hover:to-orange-500/15 hover:border-amber-500/25 hover:shadow-md hover:shadow-amber-500/20 hover:scale-110'
          }`}>
            <DollarSignIcon className={`h-5 w-5 transition-colors duration-300 ${
              isExpensesPage ? 'text-amber-500' : 'text-amber-400 group-hover:text-amber-500'
            }`} />
          </div>
          {isExpensesPage && (
            <div className="absolute -bottom-1 w-1 h-1 bg-amber-500 rounded-full animate-pulse"></div>
          )}
        </Link>

        {/* Chat */}
        <Link
          href={`/trips/${tripId}/chat`}
          className="flex flex-col items-center justify-center w-full h-full group relative"
        >
          <div className={`relative p-2.5 rounded-2xl transition-all duration-300 ${
            isChatPage
              ? 'bg-gradient-to-br from-violet-500/20 to-pink-500/20 backdrop-blur-sm border border-violet-500/30 shadow-lg shadow-violet-500/25'
              : 'bg-gradient-to-br from-violet-500/5 to-pink-500/5 backdrop-blur-sm border border-violet-500/10 hover:from-violet-500/15 hover:to-pink-500/15 hover:border-violet-500/25 hover:shadow-md hover:shadow-violet-500/20 hover:scale-110'
          }`}>
            <MessageCircleIcon className={`h-5 w-5 transition-colors duration-300 ${
              isChatPage ? 'text-violet-500' : 'text-violet-400 group-hover:text-violet-500'
            }`} />
            {/* Unread Badge */}
            <div className="absolute -top-1 -right-1">
              <UnreadBadge tripId={tripId as string} />
            </div>
          </div>
          {isChatPage && (
            <div className="absolute -bottom-1 w-1 h-1 bg-violet-500 rounded-full animate-pulse"></div>
          )}
        </Link>
      </div>
    </div>
  );
}
