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
  onEdit: (expense: Expense) => void;
};

export default function ExpenseList({ expenses, participants, currency, onDelete, onEdit }: ExpenseListProps) {

  if (expenses.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center animate-glass-fade-in">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-white/20">
              <ReceiptIcon className="h-12 w-12 text-amber-500" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400/20 rounded-full animate-ping"></div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">No expenses yet</h3>
            <p className="text-muted-foreground max-w-md">
              Add your first expense to start tracking your trip spending and managing balances.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 expense-grid-mobile">
      {expenses.map((expense, index) => (
        <div
          key={expense.id}
          className="animate-stagger-in"
          style={{ animationDelay: `${index * 100 + 400}ms` }}
        >
          <ExpenseCard
            expense={expense}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </div>
      ))}
    </div>
  );
}
