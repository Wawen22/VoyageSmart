'use client';

import { useState, memo } from 'react';
import { formatCurrency } from '@/lib/utils';
import {
  Trash2Icon,
  CalendarIcon,
  UserIcon,
  UsersIcon,
  EditIcon
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
  onEdit: (expense: Expense) => void;
}

function ExpenseCard({ expense, onDelete, onEdit }: ExpenseCardProps) {
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
    <div
      className="glass-card rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-500 md:hover:scale-[1.02] hover:-translate-y-1 expense-card-mobile w-full max-w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Modern Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

      {/* Status Border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300"
        style={{ backgroundColor: isHovered ? 'var(--primary)' : getCategoryColor(expense.category) }}
      ></div>

      <div className="relative z-10 flex flex-col gap-4 p-4 md:p-6 sm:gap-5">
        {/* Primary Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex flex-1 items-start gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 sm:h-11 sm:w-11"
              style={{ backgroundColor: `${getCategoryColor(expense.category)}20` }}
            >
              <span className="text-lg leading-none sm:text-xl">
                {getCategoryIcon(expense.category)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3 className="truncate text-sm font-semibold text-foreground transition-colors duration-300 group-hover:text-amber-500 sm:text-base">
                  {expense.description || getCategoryLabel(expense.category)}
                </h3>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:text-xs">
                <span
                  className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-background/40 px-2 py-0.5"
                  style={{ color: getCategoryColor(expense.category) }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: getCategoryColor(expense.category) }}
                  ></span>
                  {getCategoryLabel(expense.category)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-blue-500/10 px-2 py-0.5 text-blue-600">
                  <UsersIcon className="h-3 w-3" />
                  {expense.split_type === 'equal' ? 'Split equally' : 'Custom split'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="glass-info-card rounded-lg px-3 py-1.5 text-right">
              <p className="text-base font-semibold text-foreground sm:text-lg">
                {formatCurrency(expense.amount, expense.currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Metadata & Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-background/40 px-2.5 py-1 text-foreground">
              <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
              <span className="font-medium">{formatDate(expense.date)}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-background/40 px-2.5 py-1 text-foreground">
              <UserIcon className="h-3.5 w-3.5 text-green-500" />
              <span className="max-w-[140px] truncate font-medium sm:max-w-none">
                {expense.paid_by_name || 'Unknown'}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-background/40 px-2.5 py-1 text-foreground">
              <UsersIcon className="h-3.5 w-3.5 text-purple-500" />
              <span className="font-medium">
                {expense.split_type === 'equal' ? 'Equal split' : 'Custom split'}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 sm:gap-3">
            <button
              onClick={() => onEdit(expense)}
              className="glass-button-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 hover:scale-105 sm:text-sm"
            >
              <EditIcon className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={() => onDelete(expense.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-destructive/90 px-3 py-1.5 text-xs font-medium text-destructive-foreground transition-all duration-300 hover:scale-105 hover:bg-destructive sm:text-sm"
            >
              <Trash2Icon className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(ExpenseCard);
