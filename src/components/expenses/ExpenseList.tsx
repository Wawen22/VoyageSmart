import { Card, CardContent } from '@/components/ui/card';
import { ReceiptIcon } from 'lucide-react';
import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled to avoid hydration issues
const ExpenseCard = dynamic(() => import('./ExpenseCard'), { ssr: false });

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
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
