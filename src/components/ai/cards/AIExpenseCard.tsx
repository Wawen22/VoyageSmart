'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  UserIcon,
  UsersIcon,
  DollarSignIcon,
  UtensilsIcon,
  CarIcon,
  BuildingIcon,
  ShoppingBagIcon,
  CameraIcon,
  MapPinIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Expense {
  id?: string;
  category: string;
  amount: number;
  currency?: string;
  date: string;
  description?: string;
  paid_by?: string;
  paid_by_name?: string;
  split_type?: string;
  location?: string;
}

interface AIExpenseCardProps {
  expense: Expense;
  compact?: boolean;
}

export default function AIExpenseCard({ expense, compact = false }: AIExpenseCardProps) {
  const getCategoryIcon = (category: string) => {
    const iconClass = "h-4 w-4";
    switch (category.toLowerCase()) {
      case 'food':
      case 'restaurant':
      case 'dining':
        return <UtensilsIcon className={iconClass} />;
      case 'transport':
      case 'transportation':
        return <CarIcon className={iconClass} />;
      case 'accommodation':
      case 'hotel':
        return <BuildingIcon className={iconClass} />;
      case 'shopping':
        return <ShoppingBagIcon className={iconClass} />;
      case 'entertainment':
      case 'activity':
        return <CameraIcon className={iconClass} />;
      default:
        return <DollarSignIcon className={iconClass} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
      case 'restaurant':
      case 'dining':
        return 'var(--orange-500)';
      case 'transport':
      case 'transportation':
        return 'var(--blue-500)';
      case 'accommodation':
      case 'hotel':
        return 'var(--purple-500)';
      case 'shopping':
        return 'var(--pink-500)';
      case 'entertainment':
      case 'activity':
        return 'var(--green-500)';
      default:
        return 'var(--gray-500)';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
      case 'restaurant':
      case 'dining':
        return 'Cibo';
      case 'transport':
      case 'transportation':
        return 'Trasporto';
      case 'accommodation':
      case 'hotel':
        return 'Alloggio';
      case 'shopping':
        return 'Shopping';
      case 'entertainment':
      case 'activity':
        return 'Intrattenimento';
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Europe/Rome'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getSplitTypeLabel = (splitType: string | undefined) => {
    if (!splitType) return 'Uguale';
    switch (splitType.toLowerCase()) {
      case 'equal': return 'Uguale';
      case 'custom': return 'Personalizzato';
      case 'percentage': return 'Percentuale';
      default: return splitType;
    }
  };

  return (
    <Card 
      className="overflow-hidden border-l-4 hover:shadow-md transition-all duration-200"
      style={{ borderLeftColor: getCategoryColor(expense.category) }}
    >
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="p-2 rounded-full"
                style={{ backgroundColor: `${getCategoryColor(expense.category)}20` }}
              >
                {getCategoryIcon(expense.category)}
              </div>
              <div>
                <h4 className="font-medium text-sm line-clamp-1">
                  {expense.description || getCategoryLabel(expense.category)}
                </h4>
                <Badge
                  variant="outline"
                  className="text-xs mt-1"
                  style={{
                    backgroundColor: `${getCategoryColor(expense.category)}10`,
                    color: getCategoryColor(expense.category),
                    borderColor: `${getCategoryColor(expense.category)}30`
                  }}
                >
                  {getCategoryLabel(expense.category)}
                </Badge>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium">
                {formatCurrency(expense.amount, expense.currency || 'EUR')}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">
                {formatDate(expense.date)}
              </span>
            </div>

            {expense.paid_by_name && (
              <div className="flex items-center gap-2 text-sm">
                <UserIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">
                  Pagato da {expense.paid_by_name}
                </span>
              </div>
            )}

            {expense.split_type && (
              <div className="flex items-center gap-2 text-sm">
                <UsersIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">
                  Divisione: {getSplitTypeLabel(expense.split_type)}
                </span>
              </div>
            )}

            {expense.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPinIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">
                  {expense.location}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
