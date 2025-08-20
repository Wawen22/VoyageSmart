'use client';

import { useState, memo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

      <div className="relative z-10 p-4 md:p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <div
                className="p-2 rounded-xl backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-all duration-300 flex-shrink-0"
                style={{ backgroundColor: `${getCategoryColor(expense.category)}20` }}
              >
                {getCategoryIcon(expense.category)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-amber-500 transition-colors duration-300 truncate">
                  {expense.description || getCategoryLabel(expense.category)}
                </h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                    style={{
                      backgroundColor: `${getCategoryColor(expense.category)}20`,
                      color: getCategoryColor(expense.category),
                      borderColor: `${getCategoryColor(expense.category)}30`
                    }}
                  >
                    {getCategoryLabel(expense.category)}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-600 border border-blue-500/30">
                    {expense.split_type === 'equal' ? 'Split equally' : 'Custom split'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 sm:text-right sm:ml-4">
              <div className="glass-info-card px-3 py-1.5 rounded-xl">
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(expense.amount, expense.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Expense Details Section */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Date */}
            <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10">
              <div className="flex items-center space-x-2 mb-1">
                <div className="p-1 rounded-lg bg-blue-500/20">
                  <CalendarIcon className="h-3 w-3 text-blue-500" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Date</p>
              </div>
              <p className="text-sm font-semibold text-foreground">{formatDate(expense.date)}</p>
            </div>

            {/* Paid By */}
            <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10">
              <div className="flex items-center space-x-2 mb-1">
                <div className="p-1 rounded-lg bg-green-500/20">
                  <UserIcon className="h-3 w-3 text-green-500" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Paid by</p>
              </div>
              <p className="text-sm font-semibold text-foreground truncate">{expense.paid_by_name}</p>
            </div>

            {/* Split Type */}
            <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10">
              <div className="flex items-center space-x-2 mb-1">
                <div className="p-1 rounded-lg bg-purple-500/20">
                  <UsersIcon className="h-3 w-3 text-purple-500" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Split</p>
              </div>
              <p className="text-sm font-semibold text-foreground">{expense.split_type === 'equal' ? 'Equal' : 'Custom'}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => onEdit(expense)}
              className="glass-button-primary flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105"
            >
              <EditIcon className="h-4 w-4 mr-1.5" />
              Edit
            </button>

            <button
              onClick={() => onDelete(expense.id)}
              className="glass-button flex items-center px-3 py-2 rounded-xl text-sm font-medium text-destructive-foreground bg-destructive/90 hover:bg-destructive backdrop-blur-sm border border-white/10 transition-all duration-300 hover:scale-105"
            >
              <Trash2Icon className="h-4 w-4 mr-1.5" />
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
