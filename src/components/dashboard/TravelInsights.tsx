'use client';

import { useMemo, type ComponentType } from 'react';
import {
  CheckCircle2Icon,
  ClockIcon,
  CompassIcon,
  GlobeIcon,
  MapPinIcon,
  PlaneTakeoffIcon,
  SparklesIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createConsistentDate } from '@/lib/date-utils';

interface Trip {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  budget_total: number | null;
  destination: string | null;
  preferences?: {
    currency?: string;
    destinations?: {
      destinations?: Array<{ name: string }>;
    };
  };
}

interface TravelInsightsProps {
  trips: Trip[];
}

type HighlightCard = {
  id: string;
  title: string;
  value: string;
  description: string;
  badge: string;
  icon: ComponentType<{ className?: string }>;
  gradient: string;
};

type OverviewCard = {
  id: string;
  title: string;
  value: string;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
};

export default function TravelInsights({ trips }: TravelInsightsProps) {
  const analytics = useMemo(() => {
    const now = createConsistentDate();

    let plannedTripCount = 0;
    let upcomingTripsCount = 0;
    let ongoingTripsCount = 0;
    let completedTripsCount = 0;
    let leadTimeAccumulator = 0;
    let leadTimeSamples = 0;

    const upcomingTrips: Trip[] = [];
    const destinationCounts = new Map<string, number>();
    const uniqueDestinations = new Set<string>();

    trips.forEach((trip) => {
      if (trip.destination) {
        uniqueDestinations.add(trip.destination);
        const country = trip.destination.split(',').pop()?.trim() || trip.destination;
        destinationCounts.set(country, (destinationCounts.get(country) ?? 0) + 1);
      }

      const nested = trip.preferences?.destinations?.destinations ?? [];
      nested.forEach((dest) => {
        uniqueDestinations.add(dest.name);
        destinationCounts.set(dest.name, (destinationCounts.get(dest.name) ?? 0) + 1);
      });

      if (!trip.start_date) {
        return;
      }

      plannedTripCount += 1;

      const start = new Date(trip.start_date);
      const end = trip.end_date ? new Date(trip.end_date) : null;

      if (start > now) {
        upcomingTrips.push(trip);
        upcomingTripsCount += 1;

        const leadTime = Math.max(
          0,
          Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );
        leadTimeAccumulator += leadTime;
        leadTimeSamples += 1;
        return;
      }

      if (end && start <= now && end >= now) {
        ongoingTripsCount += 1;
        return;
      }

      if (end && end < now) {
        completedTripsCount += 1;
      }
    });

    upcomingTrips.sort((a, b) => {
      if (!a.start_date || !b.start_date) return 0;
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    });

    const nextTrip = upcomingTrips[0] ?? null;
    const nextTripLabel = nextTrip
      ? formatDateRange(nextTrip.start_date, nextTrip.end_date)
      : 'Next trip to be scheduled';
    const daysUntilNextTrip =
      nextTrip && nextTrip.start_date
        ? Math.max(
            0,
            Math.ceil(
              (new Date(nextTrip.start_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
          )
        : null;
    const nextDestination =
      nextTrip?.destination ??
      nextTrip?.preferences?.destinations?.destinations?.[0]?.name ??
      null;

    const mostVisitedCountries = Array.from(destinationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([country]) => country);

    const plannedTripsPercent = trips.length
      ? Math.round((plannedTripCount / trips.length) * 100)
      : 0;
    const averageLeadTime =
      leadTimeSamples > 0 ? Math.round(leadTimeAccumulator / leadTimeSamples) : null;

    return {
      totalTrips: trips.length,
      upcomingTripsCount,
      ongoingTripsCount,
      completedTripsCount,
      uniqueDestinations: uniqueDestinations.size,
      nextTripLabel,
      nextDestination,
      daysUntilNextTrip,
      plannedTripsPercent,
      averageLeadTime,
      mostVisitedCountries
    };
  }, [trips]);

  const highlightCards: HighlightCard[] = useMemo(() => {
    const countdownBadge =
      analytics.daysUntilNextTrip !== null
        ? analytics.daysUntilNextTrip === 0
          ? 'Departs today'
          : `${analytics.daysUntilNextTrip} days remaining`
        : 'Plan your next departure';

    return [
      {
        id: 'next-destination',
        title: 'Next destination',
        value: analytics.nextDestination ?? 'Choose your next escape',
        description: analytics.nextDestination ? analytics.nextTripLabel : 'Set a destination',
        badge: countdownBadge,
        icon: MapPinIcon,
        gradient: 'from-primary/40 via-primary/25 to-primary/15'
      },
      {
        id: 'planning-readiness',
        title: 'Planning readiness',
        value:
          analytics.plannedTripsPercent > 0
            ? `${analytics.plannedTripsPercent}% scheduled`
            : 'Add travel dates',
        description:
          analytics.plannedTripsPercent > 0
            ? `${analytics.plannedTripsPercent}% of trips have confirmed start dates.`
            : 'Schedule upcoming adventures to stay ahead.',
        badge:
          analytics.plannedTripsPercent >= 75
            ? 'Excellent readiness'
            : analytics.plannedTripsPercent > 0
            ? 'Keep planning'
            : 'Getting started',
        icon: CheckCircle2Icon,
        gradient: 'from-emerald-400/40 via-emerald-400/25 to-emerald-400/15'
      },
      {
        id: 'average-lead-time',
        title: 'Average lead time',
        value:
          analytics.averageLeadTime !== null
            ? `${analytics.averageLeadTime} days`
            : 'Schedule trips',
        description:
          analytics.averageLeadTime !== null
            ? 'Typical buffer between today and upcoming departures.'
            : 'Add upcoming trips with dates to track planning cadence.',
        badge: analytics.averageLeadTime !== null ? 'Momentum' : 'Needs data',
        icon: ClockIcon,
        gradient: 'from-sky-400/40 via-sky-400/25 to-sky-400/15'
      }
    ];
  }, [
    analytics.averageLeadTime,
    analytics.daysUntilNextTrip,
    analytics.nextDestination,
    analytics.nextTripLabel,
    analytics.plannedTripsPercent
  ]);

  const overviewCards: OverviewCard[] = useMemo(
    () => [
      {
        id: 'total-adventures',
        title: 'Total adventures',
        value: analytics.totalTrips.toString(),
        helper:
          analytics.uniqueDestinations > 0
            ? `${analytics.uniqueDestinations} destinations explored`
            : 'Add destinations to map your reach',
        icon: GlobeIcon,
        accent: 'from-blue-500/25 via-indigo-500/20 to-purple-500/25'
      },
      {
        id: 'upcoming-departures',
        title: 'Upcoming departures',
        value: analytics.upcomingTripsCount.toString(),
        helper:
          analytics.upcomingTripsCount > 0
            ? analytics.nextTripLabel
            : 'Schedule your next adventure',
        icon: PlaneTakeoffIcon,
        accent: 'from-emerald-500/25 via-teal-500/20 to-cyan-500/25'
      },
      {
        id: 'active-journeys',
        title: 'Active journeys',
        value: analytics.ongoingTripsCount.toString(),
        helper:
          analytics.ongoingTripsCount > 0
            ? 'Currently traveling'
            : 'No trips in progress right now',
        icon: CompassIcon,
        accent: 'from-orange-500/25 via-amber-500/20 to-rose-500/20'
      },
      {
        id: 'memories-captured',
        title: 'Memories captured',
        value: analytics.completedTripsCount.toString(),
        helper:
          analytics.completedTripsCount > 0
            ? 'Add notes and galleries to relive them'
            : 'Start building your travel story',
        icon: SparklesIcon,
        accent: 'from-violet-500/25 via-purple-500/20 to-pink-500/20'
      }
    ],
    [
      analytics.completedTripsCount,
      analytics.nextTripLabel,
      analytics.ongoingTripsCount,
      analytics.totalTrips,
      analytics.uniqueDestinations,
      analytics.upcomingTripsCount
    ]
  );

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-foreground/70 shadow-[0_12px_35px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-white/65">
          Travel &amp; Analytics Insights
        </span>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Understand your journeys at a glance
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground md:text-right">
            Glassmorphism cards surface your next move, planning health, and travel momentum in one
            cohesive snapshot.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {highlightCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.id}
              className="relative overflow-hidden rounded-[28px] border border-white/12 bg-white/10 p-6 text-foreground shadow-[0_30px_120px_-70px_rgba(15,23,42,0.62)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5"
            >
              <div
                className={cn('absolute inset-0 opacity-80 blur-[140px]', `bg-gradient-to-br ${card.gradient}`)}
              />
              <div className="absolute inset-[1px] rounded-[26px] border border-white/15 dark:border-white/12" />
              <div className="relative z-10 flex h-full flex-col gap-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-white/65 text-slate-900 shadow-inner backdrop-blur-md dark:border-white/15 dark:bg-white/10 dark:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full border border-white/25 bg-white/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80 dark:border-white/15 dark:bg-white/10 dark:text-white/60">
                    {card.badge}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-lg font-semibold uppercase tracking-[0.25em] text-muted-foreground/70">
                    {card.title}
                  </p>
                  <p className="text-2xl font-semibold text-foreground">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.id}
              className="group relative overflow-hidden rounded-[26px] border border-white/20 bg-white/12 p-5 text-foreground shadow-[0_26px_90px_-60px_rgba(15,23,42,0.6)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5"
            >
              <div
                className={cn(
                  'absolute inset-0 opacity-80 blur-[120px] transition-opacity duration-500 group-hover:opacity-95',
                  `bg-gradient-to-br ${card.accent}`
                )}
              />
              <div className="absolute inset-[1px] rounded-[24px] border border-white/18 dark:border-white/12" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/35 bg-white/70 text-slate-900 shadow-inner backdrop-blur-md dark:border-white/15 dark:bg-white/10 dark:text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground/75">
                      {card.title}
                    </p>
                    <p className="text-2xl font-semibold text-foreground">{card.value}</p>
                  </div>
                </div>
                <p className="max-w-[14rem] text-sm text-muted-foreground">{card.helper}</p>
              </div>
            </article>
          );
        })}
      </div>

      {analytics.mostVisitedCountries.length > 0 && (
        <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-br from-primary/12 via-primary/5 to-transparent p-6 shadow-[0_28px_100px_-70px_rgba(14,116,144,0.55)] backdrop-blur-2xl dark:border-white/10 dark:from-primary/15 dark:via-primary/5 dark:to-transparent">
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 -translate-y-10 translate-x-8 rounded-full bg-primary/40 blur-[120px] dark:bg-primary/20" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/80">
                  Top destinations
                </p>
                <p className="text-sm text-muted-foreground">
                  Where your adventures keep taking you back
                </p>
              </div>
              <span className="rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary/90 dark:border-primary/30 dark:bg-primary/10 dark:text-primary/70">
                Highlights
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {analytics.mostVisitedCountries.map((country, index) => (
                <span
                  key={country}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium shadow-[0_16px_45px_-35px_rgba(15,23,42,0.55)] transition-transform duration-300 hover:-translate-y-0.5',
                    index === 0 &&
                      'bg-gradient-to-r from-primary/90 via-primary/70 to-primary/60 text-white',
                    index === 1 &&
                      'bg-gradient-to-r from-emerald-500/85 via-emerald-500/75 to-teal-500/70 text-white',
                    index === 2 &&
                      'bg-gradient-to-r from-amber-500/85 via-orange-500/75 to-rose-500/70 text-white',
                    index > 2 && 'bg-white/12 text-foreground dark:bg-white/5 dark:text-white'
                  )}
                >
                  <span className="text-lg">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🌍'}
                  </span>
                  {country}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return 'Dates not set';

  const format = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      : 'TBD';

  if (start && end) {
    return `${format(start)} – ${format(end)}`;
  }

  return format(start ?? end);
}
