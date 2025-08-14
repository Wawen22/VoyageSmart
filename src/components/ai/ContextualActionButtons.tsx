'use client';

import React from 'react';
import Link from 'next/link';
import {
  Receipt,
  Calendar,
  Building2,
  Car,
  MapPin,
  DollarSign,
  Users,
  ExternalLink,
  ArrowRight,
  Plus,
  BarChart3,
  Settings,
  CheckCircle
} from 'lucide-react';

export interface ContextualAction {
  id: string;
  type: 'link' | 'action';
  label: string;
  description?: string;
  icon: React.ComponentType<any> | string; // Support both component and string
  href?: string;
  onClick?: (() => void) | string; // Support both function and string
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

interface ContextualActionButtonsProps {
  actions: ContextualAction[];
  tripId: string;
  className?: string;
  layout?: 'horizontal' | 'vertical' | 'grid';
  maxVisible?: number;
}

const iconMap = {
  Receipt: Receipt,
  Calendar: Calendar,
  Building2: Building2,
  Car: Car,
  MapPin: MapPin,
  DollarSign: DollarSign,
  Users: Users,
  ExternalLink: ExternalLink,
  ArrowRight: ArrowRight,
  Plus: Plus,
  BarChart3: BarChart3,
  CheckCircle: CheckCircle,
  Settings: Settings,
  // Legacy lowercase support
  receipt: Receipt,
  calendar: Calendar,
  building: Building2,
  car: Car,
  mapPin: MapPin,
  dollarSign: DollarSign,
  users: Users,
  externalLink: ExternalLink,
  arrowRight: ArrowRight,
  plus: Plus,
  barChart: BarChart3,
  settings: Settings,
};

export function getActionIcon(iconName: string) {
  return iconMap[iconName as keyof typeof iconMap] || ExternalLink;
}

export default function ContextualActionButtons({
  actions,
  tripId,
  className = '',
  layout = 'horizontal',
  maxVisible = 4
}: ContextualActionButtonsProps) {
  if (!actions || actions.length === 0) {
    return null;
  }

  const visibleActions = actions.slice(0, maxVisible);

  const getButtonClasses = (action: ContextualAction) => {
    const baseClasses = "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    switch (action.variant) {
      case 'primary':
        return `${baseClasses} bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 focus:ring-indigo-500 shadow-lg hover:shadow-xl`;
      case 'secondary':
        return `${baseClasses} bg-slate-700/60 text-slate-200 hover:bg-slate-600/60 border border-slate-600/30 hover:border-indigo-500/50 focus:ring-slate-500`;
      case 'outline':
      default:
        return `${baseClasses} bg-slate-800/40 text-slate-300 hover:bg-slate-700/60 border border-slate-600/40 hover:border-slate-500/60 hover:text-slate-200 focus:ring-slate-500`;
    }
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case 'vertical':
        return 'flex flex-col gap-3';
      case 'grid':
        return 'grid grid-cols-1 sm:grid-cols-2 gap-3';
      case 'horizontal':
      default:
        return 'flex flex-wrap gap-3';
    }
  };

  const renderAction = (action: ContextualAction, index: number) => {
    // Handle both string and component icons
    const IconComponent = typeof action.icon === 'string'
      ? iconMap[action.icon as keyof typeof iconMap] || Receipt // Fallback to Receipt
      : action.icon;

    const buttonClasses = getButtonClasses(action);

    const content = (
      <>
        <IconComponent className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{action.label}</span>
        {action.type === 'link' && <ExternalLink className="h-3 w-3 opacity-60" />}
      </>
    );

    const animationDelay = `${index * 0.1}s`;
    const style = {
      animationDelay,
      animationFillMode: 'both' as const
    };

    if (action.type === 'link' && action.href) {
      return (
        <Link
          key={action.id}
          href={action.href}
          className={`${buttonClasses} animate-slideInUp`}
          title={action.description}
          style={style}
        >
          {content}
        </Link>
      );
    }

    const handleClick = () => {
      if (typeof action.onClick === 'function') {
        action.onClick();
      } else if (typeof action.onClick === 'string') {
        // Handle string-based actions (could be extended for specific actions)
        console.log('Action triggered:', action.onClick);
      }
    };

    return (
      <button
        key={action.id}
        onClick={handleClick}
        className={`${buttonClasses} animate-slideInUp`}
        title={action.description}
        style={style}
      >
        {content}
      </button>
    );
  };

  return (
    <div className={`contextual-actions mt-4 ${className}`}>
      <div className="mb-2">
        <span className="text-xs text-slate-400 font-medium">Azioni suggerite:</span>
      </div>
      <div className={getLayoutClasses()}>
        {visibleActions.map((action, index) => renderAction(action, index))}
      </div>
    </div>
  );
}

// Utility functions to create common actions
export const createExpensesActions = (tripId: string): ContextualAction[] => [
  {
    id: 'view-expenses',
    type: 'link',
    label: 'Vedi Spese',
    description: 'Visualizza tutte le spese del viaggio',
    icon: Receipt,
    href: `/trips/${tripId}/expenses`,
    variant: 'primary'
  },
  {
    id: 'view-balances',
    type: 'link',
    label: 'Saldi',
    description: 'Controlla i saldi e i rimborsi',
    icon: BarChart3,
    href: `/trips/${tripId}/expenses?tab=balances`,
    variant: 'secondary'
  },
  {
    id: 'add-expense',
    type: 'action',
    label: 'Aggiungi Spesa',
    description: 'Registra una nuova spesa',
    icon: Plus,
    variant: 'outline'
  }
];

export const createBalancesActions = (tripId: string): ContextualAction[] => [
  {
    id: 'view-balances',
    type: 'link',
    label: 'Vedi Saldi',
    description: 'Controlla chi deve pagare e chi deve ricevere',
    icon: BarChart3,
    href: `/trips/${tripId}/expenses?tab=balances`,
    variant: 'primary'
  },
  {
    id: 'view-expenses',
    type: 'link',
    label: 'Vedi Spese',
    description: 'Visualizza tutte le spese del viaggio',
    icon: Receipt,
    href: `/trips/${tripId}/expenses`,
    variant: 'secondary'
  }
];

export const createItineraryActions = (tripId: string): ContextualAction[] => [
  {
    id: 'view-itinerary',
    type: 'link',
    label: 'Vedi Itinerario',
    description: 'Visualizza il programma del viaggio',
    icon: Calendar,
    href: `/trips/${tripId}/itinerary`,
    variant: 'primary'
  },
  {
    id: 'calendar-view',
    type: 'link',
    label: 'Vista Calendario',
    description: 'Visualizza le attività nel calendario',
    icon: Calendar,
    href: `/trips/${tripId}/itinerary?view=calendar`,
    variant: 'secondary'
  }
];

export const createAccommodationsActions = (tripId: string): ContextualAction[] => [
  {
    id: 'view-accommodations',
    type: 'link',
    label: 'Vedi Alloggi',
    description: 'Visualizza gli alloggi prenotati',
    icon: Building2,
    href: `/trips/${tripId}/accommodations`,
    variant: 'primary'
  }
];

export const createTransportationActions = (tripId: string): ContextualAction[] => [
  {
    id: 'view-transportation',
    type: 'link',
    label: 'Vedi Trasporti',
    description: 'Visualizza i trasporti prenotati',
    icon: Car,
    href: `/trips/${tripId}/transportation`,
    variant: 'primary'
  }
];

export const createTripOverviewActions = (tripId: string): ContextualAction[] => [
  {
    id: 'trip-overview',
    type: 'link',
    label: 'Panoramica Viaggio',
    description: 'Torna alla panoramica del viaggio',
    icon: MapPin,
    href: `/trips/${tripId}`,
    variant: 'primary'
  }
];

export const createDynamicBalanceActions = (tripId: string, tripData?: any): ContextualAction[] => {
  const actions: ContextualAction[] = [];

  // Always include the main balances link
  actions.push({
    id: 'view-balances',
    type: 'link',
    label: 'Vedi Saldi',
    description: 'Controlla chi deve pagare e chi deve ricevere',
    icon: BarChart3,
    href: `/trips/${tripId}/expenses?tab=balances`,
    variant: 'primary'
  });

  // Add dynamic actions based on settlements data
  if (tripData?.settlements && Array.isArray(tripData.settlements) && tripData.settlements.length > 0) {
    // Get the first few settlements for quick actions
    const topSettlements = tripData.settlements.slice(0, 2);

    topSettlements.forEach((settlement: any, index: number) => {
      if (settlement.from_name && settlement.to_name && settlement.amount) {
        actions.push({
          id: `quick-payment-${index}`,
          type: 'action',
          label: `${settlement.from_name} → ${settlement.to_name}`,
          description: `${settlement.from_name} deve pagare ${settlement.amount.toFixed(2)}€ a ${settlement.to_name}`,
          icon: DollarSign,
          variant: 'secondary'
        });
      }
    });
  }

  // Add general expense actions as fallback
  if (actions.length < 3) {
    actions.push({
      id: 'view-expenses',
      type: 'link',
      label: 'Vedi Spese',
      description: 'Visualizza tutte le spese del viaggio',
      icon: Receipt,
      href: `/trips/${tripId}/expenses`,
      variant: 'outline'
    });
  }

  return actions.slice(0, 4); // Limit to 4 actions
};

export const createQuickExpenseActions = (tripId: string, tripData?: any): ContextualAction[] => {
  const actions: ContextualAction[] = [];

  // Always include main expense actions
  actions.push({
    id: 'view-expenses',
    type: 'link',
    label: 'Vedi Spese',
    description: 'Visualizza tutte le spese del viaggio',
    icon: Receipt,
    href: `/trips/${tripId}/expenses`,
    variant: 'primary'
  });

  // Add quick actions for common expense types
  const commonExpenseTypes = [
    { label: 'Ristorante', icon: Utensils, category: 'food' },
    { label: 'Trasporto', icon: Car, category: 'transport' },
    { label: 'Alloggio', icon: Building2, category: 'accommodation' },
    { label: 'Attività', icon: Camera, category: 'activity' }
  ];

  // Add 2-3 quick expense actions
  commonExpenseTypes.slice(0, 2).forEach((expenseType, index) => {
    actions.push({
      id: `quick-expense-${expenseType.category}`,
      type: 'action',
      label: `+ ${expenseType.label}`,
      description: `Aggiungi rapidamente una spesa per ${expenseType.label.toLowerCase()}`,
      icon: expenseType.icon,
      variant: 'outline'
    });
  });

  return actions.slice(0, 4);
};

export const createDynamicItineraryActions = (tripId: string, tripData?: any): ContextualAction[] => {
  const actions: ContextualAction[] = [];

  // Always include main itinerary link
  actions.push({
    id: 'view-itinerary',
    type: 'link',
    label: 'Vedi Itinerario',
    description: 'Visualizza il programma del viaggio',
    icon: Calendar,
    href: `/trips/${tripId}/itinerary`,
    variant: 'primary'
  });

  // Add dynamic actions based on itinerary data
  if (tripData?.itinerary && Array.isArray(tripData.itinerary) && tripData.itinerary.length > 0) {
    // Find today's activities or next day with activities
    const today = new Date().toISOString().split('T')[0];
    const todayActivities = tripData.itinerary.find((day: any) =>
      day.day_date === today || day.date === today
    );

    if (todayActivities && todayActivities.activities?.length > 0) {
      actions.push({
        id: 'today-activities',
        type: 'action',
        label: `Oggi (${todayActivities.activities.length} attività)`,
        description: `Vedi le ${todayActivities.activities.length} attività programmate per oggi`,
        icon: Sun,
        variant: 'secondary'
      });
    }

    // Add calendar view
    actions.push({
      id: 'calendar-view',
      type: 'link',
      label: 'Vista Calendario',
      description: 'Visualizza le attività nel calendario',
      icon: Calendar,
      href: `/trips/${tripId}/itinerary?view=calendar`,
      variant: 'outline'
    });
  } else {
    // No itinerary yet, suggest adding activities
    actions.push({
      id: 'add-activity',
      type: 'action',
      label: 'Aggiungi Attività',
      description: 'Inizia a pianificare il tuo itinerario',
      icon: Plus,
      variant: 'secondary'
    });
  }

  return actions.slice(0, 4);
};
