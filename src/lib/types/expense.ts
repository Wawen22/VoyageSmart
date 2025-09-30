// Expense type definitions

export type DatabaseExpenseParticipant = {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
  users: {
    full_name: string;
  };
};

export type DatabaseExpense = {
  id: string;
  trip_id: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  paid_by: string;
  split_type: string;
  receipt_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
  users: {
    full_name: string;
  };
  expense_participants: DatabaseExpenseParticipant[];
};

// Types for component state
export type Expense = Omit<DatabaseExpense, 'users' | 'expense_participants'> & {
  paid_by_name: string;
  participants: {
    user_id: string;
    amount: number;
    is_paid: boolean;
    full_name: string;
  }[];
};

export type ExpenseParticipant = {
  user_id: string;
  amount: number;
  is_paid: boolean;
  full_name: string;
};

