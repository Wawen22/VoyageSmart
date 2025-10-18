'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarIcon,
  Building2Icon,
  PlaneTakeoffIcon,
  DollarSignIcon,
  MessageCircleIcon,
  BookOpenIcon,
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon
} from 'lucide-react';
import { useSubscription } from '@/lib/subscription';
import UnreadBadge from '@/components/chat/UnreadBadge';

interface PersistentTripActionsProps {
  tripId: string;
  accommodationCount?: number;
  transportationCount?: number;
  itineraryCount?: number;
  expensesCount?: number;
  journalCount?: number;
  participantsCount?: number;
}

export default function PersistentTripActions({
  tripId,
  accommodationCount = 0,
  transportationCount = 0,
  itineraryCount = 0,
  expensesCount = 0,
  journalCount = 0,
  participantsCount = 0
}: PersistentTripActionsProps) {
  const pathname = usePathname();

  // Start collapsed by default on all pages
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { subscription } = useSubscription();

  // Hide on mobile and show only on desktop
  const [isMobile, setIsMobile] = useState(true); // Start with mobile to prevent flash

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keep collapsed by default on all pages (removed automatic expansion logic)

  // Don't render on mobile
  if (isMobile) return null;



  const actions = [
    {
      id: 'overview',
      href: `/trips/${tripId}`,
      icon: MapPinIcon,
      title: 'Overview',
      description: 'Trip details and summary',
      gradient: 'from-primary/20 to-secondary/20',
      hoverGradient: 'from-primary/10 via-transparent to-secondary/10',
      glowColor: 'bg-primary/20',
      textColor: 'text-primary',
      isActive: pathname === `/trips/${tripId}`
    },
    {
      id: 'itinerary',
      href: `/trips/${tripId}/itinerary`,
      icon: CalendarIcon,
      title: 'Trip Planner',
      description: 'Plan daily activities',
      gradient: 'from-blue-500/20 to-purple-500/20',
      hoverGradient: 'from-blue-500/10 via-transparent to-purple-500/10',
      glowColor: 'bg-blue-500/20',
      textColor: 'text-blue-500',
      badge: <BookOpenIcon className="h-3 w-3 text-purple-500" />,
      count: itineraryCount,
      isActive: pathname.includes('/itinerary')
    },
    {
      id: 'journal',
      href: `/trips/${tripId}/journal`,
      icon: BookOpenIcon,
      title: 'Travel Journal',
      description: 'Document your memories',
      gradient: 'from-purple-500/20 to-pink-500/20',
      hoverGradient: 'from-purple-500/10 via-transparent to-pink-500/10',
      glowColor: 'bg-purple-500/20',
      textColor: 'text-purple-500',
      count: journalCount,
      isActive: pathname.includes('/journal')
    },
    {
      id: 'accommodations',
      href: `/trips/${tripId}/accommodations`,
      icon: Building2Icon,
      title: 'Accommodations',
      description: 'Hotels and places to stay',
      gradient: 'from-emerald-500/20 to-teal-500/20',
      hoverGradient: 'from-emerald-500/10 via-transparent to-teal-500/10',
      glowColor: 'bg-emerald-500/20',
      textColor: 'text-emerald-500',
      count: accommodationCount,
      counter: subscription?.tier === 'free' ? `${accommodationCount}/5` : undefined,
      isActive: pathname.includes('/accommodations')
    },
    {
      id: 'transportation',
      href: `/trips/${tripId}/transportation`,
      icon: PlaneTakeoffIcon,
      title: 'Transportation',
      description: 'Flights, trains, and transport',
      gradient: 'from-sky-500/20 to-cyan-500/20',
      hoverGradient: 'from-sky-500/10 via-transparent to-cyan-500/10',
      glowColor: 'bg-sky-500/20',
      textColor: 'text-sky-500',
      count: transportationCount,
      counter: subscription?.tier === 'free' ? `${transportationCount}/5` : undefined,
      isActive: pathname.includes('/transportation')
    },
    {
      id: 'expenses',
      href: `/trips/${tripId}/expenses`,
      icon: DollarSignIcon,
      title: 'Expenses',
      description: 'Track and split expenses',
      gradient: 'from-amber-500/20 to-orange-500/20',
      hoverGradient: 'from-amber-500/10 via-transparent to-amber-500/10',
      glowColor: 'bg-amber-500/20',
      textColor: 'text-amber-500',
      count: expensesCount,
      isActive: pathname.includes('/expenses')
    }
  ];



  return (
    <div className={`persistent-trip-actions hidden md:block fixed left-4 top-1/2 -translate-y-1/2 z-40 transition-width ${
      isCollapsed ? 'w-20 collapsed' : 'w-80'
    }`}>
      {/* Main Container */}
      <div className="glass-card rounded-2xl border-0 overflow-visible shadow-2xl">
        {/* Header */}
        <div className={`border-b border-white/10 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <div className={`flex items-center ${isCollapsed ? 'flex-col space-y-2' : 'justify-between'}`}>
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm border border-white/20">
                  <MapPinIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Trip Actions</h3>
                  <p className="text-xs text-muted-foreground">Quick navigation</p>
                </div>
              </div>
            )}

            <div className="flex items-center">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronLeftIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Actions List */}
        <div className={`actions-container ${isCollapsed ? 'p-1' : 'p-2'}`}>
          {actions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="group block mb-2 last:mb-0"
            >
              <div className={`action-item relative overflow-visible rounded-xl transition-all duration-300 hover:scale-[1.02] ${
                action.isActive
                  ? 'active bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20'
                  : 'hover:bg-white/5'
              } ${isCollapsed ? 'p-2' : 'p-4'}`}>

                {/* Hover Background - Contained wrapper */}
                <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <div className={`absolute -top-12 -right-12 w-24 h-24 ${action.glowColor} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700`}></div>
                </div>

                <div className={`relative z-10 flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                  {/* Icon Container */}
                  <div className="relative flex-shrink-0">
                    {/* Free Plan Limit Info Icon - Positioned above the main icon */}
                    {!isCollapsed && action.counter && (
                      <div className="absolute -top-2 -left-2 z-[9999] group/limit">
                        <div className={`p-1 rounded-full ${action.textColor.replace('text-', 'bg-')}/30 border ${action.textColor.replace('text-', 'border-')}/40 cursor-help transition-all duration-200 hover:scale-110 backdrop-blur-sm`}>
                          <InfoIcon className={`h-3 w-3 ${action.textColor}`} />
                        </div>

                        {/* Tooltip */}
                        <div className="absolute left-0 bottom-full mb-2 w-48 opacity-0 invisible group-hover/limit:opacity-100 group-hover/limit:visible transition-all duration-200 z-[9999] pointer-events-none group-hover/limit:pointer-events-auto">
                          <div className="p-3 bg-popover border border-border rounded-lg shadow-2xl">
                            <div className="text-xs space-y-1">
                              <p className="font-semibold text-foreground">Free Plan Limit</p>
                              <p className="text-muted-foreground">
                                You're using <span className="font-bold text-foreground">{action.counter}</span>
                              </p>
                              <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                                Upgrade to Premium for unlimited access
                              </p>
                            </div>
                            {/* Arrow pointing down */}
                            <div className="absolute -bottom-1 left-4 w-2 h-2 bg-popover border-r border-b border-border rotate-45"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={`icon-container rounded-xl bg-gradient-to-br ${action.gradient} backdrop-blur-sm border border-white/20 transition-all duration-300 ${
                      isCollapsed ? 'p-2' : 'p-2.5'
                    }`}>
                      <action.icon className={`${isCollapsed ? 'h-4 w-4' : 'h-5 w-5'} ${action.textColor}`} />

                      {/* Badge or Counter - Only show when not collapsed */}
                      {!isCollapsed && action.badge && (
                        <div className="absolute -bottom-1 -right-1 p-1 bg-background rounded-full border border-white/20">
                          {action.badge}
                        </div>
                      )}

                      {!isCollapsed && action.unreadBadge && (
                        <div className="absolute -top-1 -right-1">
                          <UnreadBadge tripId={tripId} />
                        </div>
                      )}
                    </div>

                    {/* Active indicator */}
                    {action.isActive && (
                      <div className={`absolute w-3 h-3 bg-green-400 rounded-full animate-pulse ${
                        isCollapsed ? '-top-0.5 -right-0.5' : '-top-1 -right-1'
                      }`}></div>
                    )}
                  </div>

                  {/* Content */}
                  {!isCollapsed && (
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-sm font-semibold ${action.textColor} group-hover:${action.textColor} transition-colors duration-300`}>
                          {action.title}
                        </h4>

                        {/* Count Badge - Shows total items */}
                        {action.count !== undefined && action.count > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                              Items
                            </span>
                            <span className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full text-xs font-bold bg-gradient-to-br ${action.gradient} ${action.textColor} border border-white/30 backdrop-blur-sm shadow-sm`}>
                              {action.count}
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {action.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{participantsCount} members</span>
              <span>{actions.length} features</span>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
