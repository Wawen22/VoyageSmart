'use client';

import { useMemo, useRef, useState } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  MapPinIcon,
  PlaneTakeoffIcon,
  SparklesIcon,
  TrendingUpIcon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import MobileAnalyticsButton from './MobileAnalyticsButton';

interface SwipeableStatsProps {
  trips: any[];
  className?: string;
  showAnalyticsButton?: boolean;
}

interface StatCard {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  accent: string;
  description?: string;
}

interface InsightChip {
  id: string;
  label: string;
  helper: string;
  icon: LucideIcon;
}

interface TripMetrics {
  totalTrips: number;
  upcomingTrips: number;
  ongoingTrips: number;
  completedTrips: number;
  totalBudget: number;
  avgDuration: number;
  uniqueDestinations: number;
  nextTripLabel: string;
  nextTripDestination: string;
  daysUntilNextTrip: number | null;
}

const CARD_GRADIENTS: Record<string, string> = {
  total: 'bg-gradient-to-br from-sky-500/35 via-indigo-500/25 to-purple-500/30 dark:from-sky-500/35 dark:via-indigo-600/30 dark:to-purple-700/30',
  upcoming: 'bg-gradient-to-br from-emerald-500/35 via-teal-500/25 to-cyan-500/30 dark:from-emerald-500/35 dark:via-teal-600/30 dark:to-cyan-600/30',
  ongoing: 'bg-gradient-to-br from-orange-500/35 via-amber-500/25 to-rose-500/25 dark:from-orange-500/35 dark:via-amber-600/30 dark:to-rose-600/25',
  completed: 'bg-gradient-to-br from-violet-500/30 via-purple-500/25 to-pink-500/25 dark:from-violet-500/35 dark:via-purple-600/30 dark:to-pink-600/25'
};

const MOBILE_CARD_THEMES: Record<string, string> = {
  total: 'bg-gradient-to-br from-sky-100/80 via-indigo-100/60 to-purple-100/50 text-slate-900 dark:from-sky-500/15 dark:via-indigo-600/15 dark:to-purple-700/10 dark:text-white',
  upcoming: 'bg-gradient-to-br from-emerald-100/80 via-teal-100/60 to-cyan-100/50 text-slate-900 dark:from-emerald-500/15 dark:via-teal-600/15 dark:to-cyan-600/15 dark:text-white',
  ongoing: 'bg-gradient-to-br from-orange-100/80 via-amber-100/60 to-rose-100/50 text-slate-900 dark:from-orange-500/20 dark:via-amber-600/15 dark:to-rose-600/12 dark:text-white',
  completed: 'bg-gradient-to-br from-violet-100/80 via-purple-100/60 to-pink-100/50 text-slate-900 dark:from-violet-500/15 dark:via-purple-600/15 dark:to-pink-600/15 dark:text-white'
};

export default function SwipeableStats({ trips, className, showAnalyticsButton = false }: SwipeableStatsProps) {
  const metrics = useMemo(() => computeTripMetrics(trips), [trips]);
  const desktopCards = useMemo<StatCard[]>(
    () => [
      {
        id: 'total',
        title: 'Total adventures',
        value: metrics.totalTrips.toString(),
        subtitle: metrics.uniqueDestinations === 1
          ? 'Unique destination explored'
          : `${metrics.uniqueDestinations} destinations mapped`,
        icon: TrendingUpIcon,
        accent: CARD_GRADIENTS.total,
        description: 'All trips saved in your dashboard'
      },
      {
        id: 'upcoming',
        title: 'Upcoming departures',
        value: metrics.upcomingTrips.toString(),
        subtitle: metrics.nextTripLabel,
        icon: CalendarIcon,
        accent: CARD_GRADIENTS.upcoming,
        description: metrics.nextTripDestination
      },
      {
        id: 'ongoing',
        title: 'Active journeys',
        value: metrics.ongoingTrips.toString(),
        subtitle: metrics.ongoingTrips > 0 ? 'Currently traveling' : 'No trips in progress',
        icon: PlaneTakeoffIcon,
        accent: CARD_GRADIENTS.ongoing,
        description:
          metrics.daysUntilNextTrip !== null
            ? `Next starts in ${metrics.daysUntilNextTrip} days`
            : 'Plan the next adventure'
      },
      {
        id: 'completed',
        title: 'Memories captured',
        value: metrics.completedTrips.toString(),
        subtitle: metrics.avgDuration > 0 ? `${metrics.avgDuration} days avg duration` : 'Duration TBD',
        icon: ClockIcon,
        accent: CARD_GRADIENTS.completed,
        description: `Budget spent ${formatCurrency(metrics.totalBudget, 'EUR')}`
      }
    ],
    [metrics]
  );

  const mobileCards = useMemo<StatCard[]>(
    () => [
      {
        id: 'total',
        title: 'Total trips',
        value: metrics.totalTrips.toString(),
        subtitle: `${metrics.uniqueDestinations} destinations`,
        icon: TrendingUpIcon,
        accent: MOBILE_CARD_THEMES.total
      },
      {
        id: 'upcoming',
        title: 'Upcoming',
        value: metrics.upcomingTrips.toString(),
        subtitle: metrics.nextTripDestination || 'Add your next trip',
        icon: CalendarIcon,
        accent: MOBILE_CARD_THEMES.upcoming
      },
      {
        id: 'next-countdown',
        title: 'Next in',
        value: metrics.daysUntilNextTrip !== null ? `${metrics.daysUntilNextTrip}d` : '—',
        subtitle: metrics.nextTripLabel,
        icon: SparklesIcon,
        accent: MOBILE_CARD_THEMES.upcoming
      },
      {
        id: 'budget',
        title: 'Total budget',
        value: formatCurrency(metrics.totalBudget, 'EUR'),
        subtitle: 'All trips combined',
        icon: DollarSignIcon,
        accent: MOBILE_CARD_THEMES.total
      },
      {
        id: 'ongoing',
        title: 'Active now',
        value: metrics.ongoingTrips.toString(),
        subtitle: metrics.ongoingTrips > 0 ? 'Enjoy the journey' : 'All quiet right now',
        icon: PlaneTakeoffIcon,
        accent: MOBILE_CARD_THEMES.ongoing
      },
      {
        id: 'completed',
        title: 'Completed',
        value: metrics.completedTrips.toString(),
        subtitle: metrics.avgDuration > 0 ? `${metrics.avgDuration} days avg` : 'Keep exploring',
        icon: ClockIcon,
        accent: MOBILE_CARD_THEMES.completed
      }
    ],
    [metrics]
  );

  const insightChips = useMemo<InsightChip[]>(
    () => [
      {
        id: 'next-destination',
        label: metrics.nextTripDestination || 'Plan your next escape',
        helper: metrics.nextTripDestination ? 'Next destination locked in' : 'Choose where to go next',
        icon: MapPinIcon
      },
      {
        id: 'countdown',
        label: metrics.daysUntilNextTrip !== null ? `${metrics.daysUntilNextTrip} days` : 'Set travel dates',
        helper: metrics.daysUntilNextTrip !== null ? 'Until the next departure' : 'No departure scheduled',
        icon: PlaneTakeoffIcon
      },
      {
        id: 'avg-duration',
        label: metrics.avgDuration > 0 ? `${metrics.avgDuration} days` : 'Duration TBD',
        helper: 'Average trip length',
        icon: ClockIcon
      },
      {
        id: 'lifetime-budget',
        label: formatCurrency(metrics.totalBudget, 'EUR'),
        helper: 'Total budget tracked',
        icon: DollarSignIcon
      }
    ],
    [metrics]
  );

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[32px] border border-white/20 bg-gradient-to-br from-white/65 via-white/22 to-white/10 p-6 shadow-[0_32px_120px_-58px_rgba(15,23,42,0.62)] backdrop-blur-2xl transition-all duration-500 dark:border-white/10 dark:from-slate-950/80 dark:via-slate-950/55 dark:to-slate-950/40 sm:p-8',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-14 h-48 w-48 rounded-full bg-primary/25 blur-3xl dark:bg-primary/20" />
        <div className="absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-purple-400/25 blur-[120px] dark:bg-purple-500/15" />
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent dark:via-white/10" />
        <div className="absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent dark:via-white/5" />
      </div>

      <div className="relative z-10 flex flex-col gap-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-muted-foreground/70">
              Analytics
            </p>
            <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-[1.4rem]">
              Travel performance snapshot
            </h3>
          </div>
          {showAnalyticsButton && (
            <div className="flex items-center gap-3 sm:-mt-1">
              <MobileAnalyticsButton trips={trips} />
            </div>
          )}
        </div>

        <InsightChips chips={insightChips} />

        <DesktopStats cards={desktopCards} />
        <MobileStats cards={mobileCards} />
      </div>
    </section>
  );
}

function InsightChips({ chips }: { chips: InsightChip[] }) {
  if (!chips.length) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {chips.map((chip) => {
        const Icon = chip.icon;
        return (
          <div
            key={chip.id}
            className="group flex items-center gap-3 rounded-2xl border border-white/25 bg-white/18 px-4 py-3 text-sm text-slate-900 shadow-[0_22px_60px_-48px_rgba(15,23,42,0.55)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/25 dark:border-white/10 dark:bg-white/5 dark:text-white/85 dark:hover:border-white/20 dark:hover:bg-white/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/35 bg-white/70 shadow-inner backdrop-blur-md dark:border-white/15 dark:bg-white/10">
              <Icon className="h-4 w-4 text-slate-900 dark:text-white/80" />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">{chip.label}</p>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-900/55 dark:text-white/45">
                {chip.helper}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DesktopStats({ cards }: { cards: StatCard[] }) {
  return (
    <div className="hidden gap-5 lg:grid lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.id}
            className="group relative overflow-hidden rounded-[26px] border border-white/25 bg-white/55 p-6 text-slate-900 shadow-[0_24px_90px_-52px_rgba(15,23,42,0.65)] backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:border-white/45 dark:border-white/12 dark:bg-slate-950/45 dark:text-slate-100"
          >
            <div className={cn('absolute inset-0 opacity-80 blur-[120px] transition-opacity duration-500 group-hover:opacity-95', card.accent)} />
            <div className="absolute inset-[1px] rounded-[24px] border border-white/30 dark:border-white/15" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/45 bg-white/75 text-slate-900 shadow-inner backdrop-blur-md dark:border-white/20 dark:bg-white/10 dark:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-900/60 dark:text-white/60">
                      {card.title}
                    </p>
                    <p className="text-3xl font-semibold text-slate-900 dark:text-white">{card.value}</p>
                  </div>
                </div>
                <span className="rounded-full border border-white/55 bg-white/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.38em] text-slate-900 dark:border-white/25 dark:bg-white/10 dark:text-white/70">
                  Live
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900/70 dark:text-white/70">{card.subtitle}</p>
                {card.description && (
                  <p className="text-xs text-slate-900/65 dark:text-white/55">{card.description}</p>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function MobileStats({ cards }: { cards: StatCard[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const cardsPerView = 1.4;
  const maxIndex = Math.max(0, cards.length - Math.ceil(cardsPerView));

  const startDrag = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
  };

  const moveDrag = (clientX: number) => {
    if (!isDragging) return;
    const diff = startX - clientX;
    setTranslateX(-diff);
  };

  const endDrag = () => {
    if (!isDragging) return;
    const threshold = 40;
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0 && currentIndex < maxIndex) {
        setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
      } else if (translateX < 0 && currentIndex > 0) {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    }
    setIsDragging(false);
    setTranslateX(0);
    setStartX(0);
  };

  return (
    <div className="lg:hidden">
      <div
        ref={containerRef}
        className="relative overflow-hidden py-1"
        onTouchStart={(event) => startDrag(event.touches[0].clientX)}
        onTouchMove={(event) => moveDrag(event.touches[0].clientX)}
        onTouchEnd={endDrag}
        onMouseDown={(event) => startDrag(event.clientX)}
        onMouseMove={(event) => moveDrag(event.clientX)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        <div
          className="flex gap-4 transition-transform duration-300 ease-out"
          style={{ transform: `translateX(calc(-${currentIndex * (100 / cardsPerView)}% + ${translateX}px))` }}
        >
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.id} className="w-[72%] flex-shrink-0 px-1.5">
                <article className={cn(
                  'relative flex h-full flex-col justify-between overflow-hidden rounded-[24px] border border-white/25 bg-white/60 p-4 text-slate-900 shadow-[0_18px_45px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-950/45 dark:text-white',
                  card.accent
                )}>
                  <div className="absolute inset-0 opacity-75 blur-[100px]" />
                  <div className="absolute inset-[1px] rounded-[22px] border border-white/20 dark:border-white/15" />
                  <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/40 bg-white/75 text-slate-900 shadow-inner backdrop-blur-md dark:border-white/20 dark:bg-white/10 dark:text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-900/60 dark:text-white/60">
                        {card.title}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-semibold text-slate-900 dark:text-white">{card.value}</p>
                      <p className="text-xs text-slate-900/70 dark:text-white/70">{card.subtitle}</p>
                    </div>
                    {card.description && (
                      <p className="text-[11px] text-slate-900/55 dark:text-white/55">{card.description}</p>
                    )}
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex justify-center gap-2">
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-all duration-200',
              currentIndex === index
                ? 'w-4 bg-foreground/80 dark:bg-white/80'
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            )}
          />
        ))}
      </div>
    </div>
  );
}

function computeTripMetrics(trips: any[]): TripMetrics {
  if (!trips || trips.length === 0) {
    return {
      totalTrips: 0,
      upcomingTrips: 0,
      ongoingTrips: 0,
      completedTrips: 0,
      totalBudget: 0,
      avgDuration: 0,
      uniqueDestinations: 0,
      nextTripLabel: 'No trips scheduled',
      nextTripDestination: '',
      daysUntilNextTrip: null
    };
  }

  const now = new Date();
  const uniqueDestinations = new Set<string>();
  let totalBudget = 0;
  let durationAccumulator = 0;
  let tripsWithDuration = 0;

  const upcomingTripsList: any[] = [];
  let ongoingTrips = 0;
  let completedTrips = 0;

  trips.forEach((trip) => {
    if (trip.destination) uniqueDestinations.add(trip.destination);
    const nested = trip.preferences?.destinations?.destinations ?? [];
    nested.forEach((dest: { name: string }) => uniqueDestinations.add(dest.name));

    if (typeof trip.budget_total === 'number') {
      totalBudget += trip.budget_total;
    }

    if (trip.start_date && trip.end_date) {
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (Number.isFinite(duration) && duration > 0) {
        durationAccumulator += duration;
        tripsWithDuration += 1;
      }
    }

    if (trip.start_date) {
      const start = new Date(trip.start_date);
      const end = trip.end_date ? new Date(trip.end_date) : null;

      if (start > now) {
        upcomingTripsList.push(trip);
      } else if (end && start <= now && end >= now) {
        ongoingTrips += 1;
      } else if (end && end < now) {
        completedTrips += 1;
      }
    }
  });

  upcomingTripsList.sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  const nextTrip = upcomingTripsList[0];

  const nextTripLabel = nextTrip
    ? formatDateRange(nextTrip.start_date, nextTrip.end_date)
    : 'Plan your next trip';

  const nextTripDestination = nextTrip
    ? nextTrip.destination ?? nextTrip.preferences?.destinations?.destinations?.[0]?.name ?? 'Destination TBD'
    : '';

  const daysUntilNextTrip = nextTrip
    ? Math.max(0, Math.ceil((new Date(nextTrip.start_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  return {
    totalTrips: trips.length,
    upcomingTrips: upcomingTripsList.length,
    ongoingTrips,
    completedTrips,
    totalBudget,
    avgDuration: tripsWithDuration > 0 ? Math.round(durationAccumulator / tripsWithDuration) : 0,
    uniqueDestinations: uniqueDestinations.size,
    nextTripLabel,
    nextTripDestination,
    daysUntilNextTrip
  };
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return 'Dates not set';
  const formatter = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        })
      : 'TBD';

  if (start && end) {
    return `${formatter(start)} – ${formatter(end)}`;
  }
  return formatter(start ?? end);
}
