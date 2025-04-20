import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2Icon, InfoIcon, ReceiptIcon } from 'lucide-react';

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

type Participant = {
  id: string;
  user_id: string;
  full_name: string;
};

type ExpenseListProps = {
  expenses: Expense[];
  participants: Participant[];
  currency: string;
  onDelete: (id: string) => void;
};

export default function ExpenseList({ expenses, participants, currency, onDelete }: ExpenseListProps) {
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  const toggleExpenseDetails = (id: string) => {
    if (expandedExpenseId === id) {
      setExpandedExpenseId(null);
    } else {
      setExpandedExpenseId(id);
    }
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (expenses.length === 0) {
    return (
      <Card className="bg-card border border-border">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <ReceiptIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No expenses yet</h3>
            <p className="text-muted-foreground">
              Add your first expense to start tracking your trip spending.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <Card key={expense.id} className="bg-card border border-border overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            <div className="flex-grow p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground">
                      {expense.description || getCategoryLabel(expense.category)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(expense.date)} • Paid by {expense.paid_by_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-foreground">
                    {formatCurrency(expense.amount, expense.currency)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {expense.split_type === 'equal' ? 'Split equally' : 'Custom split'}
                  </Badge>
                </div>
              </div>

              {expandedExpenseId === expense.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Category</h4>
                      <p className="text-sm text-foreground">{getCategoryLabel(expense.category)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Split Type</h4>
                      <p className="text-sm text-foreground">
                        {expense.split_type === 'equal' ? 'Split equally' : 'Custom split'}
                      </p>
                    </div>
                    {expense.description && (
                      <div className="sm:col-span-2">
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                        <p className="text-sm text-foreground">{expense.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex sm:flex-col border-t sm:border-t-0 sm:border-l border-border">
              <Button
                variant="ghost"
                size="icon"
                className="flex-1 rounded-none h-12"
                onClick={() => toggleExpenseDetails(expense.id)}
                aria-label="Toggle expense details"
              >
                <InfoIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="flex-1 rounded-none h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(expense.id)}
                aria-label="Delete expense"
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
