'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trash2Icon,
  CalendarIcon,
  UserIcon,
  UsersIcon
} from 'lucide-react';

type Expense = {
  id: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  paid_by: string;
  paid_by_name?: string;
  split_type: string;
};

interface ExpenseCardProps {
  expense: Expense;
  onDelete: (id: string) => void;
}

export default function ExpenseCard({ expense, onDelete }: ExpenseCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food':
        return '🍔';
      case 'accommodation':
        return '🏨';
      case 'transportation':
        return '🚗';
      case 'activities':
        return '🎭';
      case 'shopping':
        return '🛍️';
      default:
        return '💰';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'food':
        return 'Food & Drinks';
      case 'accommodation':
        return 'Accommodation';
      case 'transportation':
        return 'Transportation';
      case 'activities':
        return 'Activities';
      case 'shopping':
        return 'Shopping';
      default:
        return category || 'Other';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food':
        return '#FF9800'; // Orange
      case 'accommodation':
        return '#2196F3'; // Blue
      case 'transportation':
        return '#4CAF50'; // Green
      case 'activities':
        return '#9C27B0'; // Purple
      case 'shopping':
        return '#F44336'; // Red
      default:
        return '#607D8B'; // Blue Grey
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-all border-l-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderLeftColor: isHovered ? 'var(--primary)' : getCategoryColor(expense.category)
      }}
    >
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          {/* Header with amount and category */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: `${getCategoryColor(expense.category)}20` }}
              >
                {getCategoryIcon(expense.category)}
              </div>
              <div>
                <h3 className="font-medium text-lg line-clamp-1">
                  {expense.description || getCategoryLabel(expense.category)}
                </h3>
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
              <div className="text-lg font-semibold">
                {formatCurrency(expense.amount, expense.currency)}
              </div>
              <Badge variant="outline" className="text-xs bg-muted">
                {expense.split_type === 'equal' ? 'Split equally' : 'Custom split'}
              </Badge>
            </div>
          </div>

          {/* Basic info with delete button */}
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                {formatDate(expense.date)}
              </div>
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                Paid by {expense.paid_by_name}
              </div>
              <div className="flex items-center">
                <UsersIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                Split: {expense.split_type === 'equal' ? 'Equal' : 'Custom'}
              </div>
            </div>

            {/* Delete button moved inline */}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 px-2"
              onClick={() => onDelete(expense.id)}
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
