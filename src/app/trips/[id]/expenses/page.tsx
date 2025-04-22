'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import ExpenseList from '@/components/expenses/ExpenseList';
import ExpenseBalances from '@/components/expenses/ExpenseBalances';
import AddExpenseModal from '@/components/expenses/AddExpenseModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusIcon, ReceiptIcon, BarChart3Icon, UsersIcon, DollarSignIcon } from 'lucide-react';

type DatabaseUser = {
  full_name: string;
  email: string;
};

type DatabaseParticipant = {
  id: string;
  user_id: string;
  trip_id: string;
  role: string;
  invitation_status: string;
  created_at: string;
  users: DatabaseUser;
};

type DatabaseExpenseParticipant = {
  user_id: string;
  amount: number;
  is_paid: boolean;
  users: {
    full_name: string;
  };
};

type DatabaseExpense = {
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

// Types for our component state
type Expense = Omit<DatabaseExpense, 'users' | 'expense_participants'> & {
  paid_by_name: string;
  participants: {
    user_id: string;
    amount: number;
    is_paid: boolean;
    full_name: string;
  }[];
};

type Participant = {
  id: string;
  user_id: string;
  trip_id: string;
  role: string;
  invitation_status: string;
  created_at: string;
  full_name: string;
  email: string;
};

type Balance = {
  user_id: string;
  full_name: string;
  balance: number;
};

type Settlement = {
  from_id: string;
  from_name: string;
  to_id: string;
  to_name: string;
  amount: number;
};

export default function ExpensesPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  interface Trip {
    id: string;
    name: string;
    destination?: string;
    preferences?: {
      currency: string;
    };
  }

  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('expenses');

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) return;

        // Fetch trip details
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select(`
            id,
            name,
            destination,
            preferences
          `)
          .eq('id', id)
          .single();

        if (tripError) throw tripError;
        setTrip(tripData);

        // Fetch accepted participants with user details
        const { data: participantsData, error: participantsError } = await supabase
          .from('trip_participants')
          .select('*, users!inner(*)')
          .eq('trip_id', id)
          .eq('invitation_status', 'accepted')
          .order('created_at', { ascending: true });

        if (participantsError) throw participantsError;

        // Format participants data with type assertion
        const formattedParticipants: Participant[] = ((participantsData || []) as any[]).map(p => ({
          id: p.id,
          user_id: p.user_id,
          trip_id: p.trip_id,
          role: p.role,
          invitation_status: p.invitation_status,
          created_at: p.created_at,
          full_name: p.users.full_name,
          email: p.users.email
        }));

        setParticipants(formattedParticipants);

        // Fetch expenses
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select(`
            *,
            users!inner(*),
            expense_participants!inner(
              user_id,
              amount,
              is_paid,
              users:user_id!inner(*)
            )
          `)
          .eq('trip_id', id)
          .order('date', { ascending: false });

        if (expensesError) throw expensesError;

        // Format expenses data
        const formattedExpenses: Expense[] = (expensesData || []).map((e: any) => ({
          id: e.id,
          trip_id: e.trip_id,
          category: e.category,
          amount: e.amount,
          currency: e.currency,
          date: e.date,
          description: e.description,
          paid_by: e.paid_by,
          split_type: e.split_type,
          receipt_url: e.receipt_url,
          status: e.status,
          created_at: e.created_at,
          updated_at: e.updated_at,
          paid_by_name: e.users.full_name,
          participants: (e.expense_participants || []).map((p: any) => ({
            user_id: p.user_id,
            amount: p.amount,
            is_paid: p.is_paid,
            full_name: p.users.full_name
          }))
        }));

        setExpenses(formattedExpenses);

        // Calculate balances
        calculateBalances(formattedExpenses, formattedParticipants);
      } catch (err) {
        console.error('Error fetching trip details:', err);
        setError('Failed to load trip details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [id, user]);

  const calculateBalances = (expenses: Expense[], participants: Participant[]) => {
    // Initialize balances for all participants
    const balanceMap = new Map<string, number>();
    participants.forEach(p => {
      balanceMap.set(p.user_id, 0);
    });

    // Calculate how much each person has paid and owes
    expenses.forEach(expense => {
      const payerId = expense.paid_by;

      // Add what each participant owes
      expense.participants.forEach(p => {
        const currentBalance = balanceMap.get(p.user_id) || 0;
        balanceMap.set(p.user_id, currentBalance - p.amount);
      });

      // Add what the payer paid
      const payerBalance = balanceMap.get(payerId) || 0;
      balanceMap.set(payerId, payerBalance + expense.amount);
    });

    // Convert the balance map to an array
    const balancesArray: Balance[] = [];
    balanceMap.forEach((balance, userId) => {
      const participant = participants.find(p => p.user_id === userId);
      if (participant) {
        balancesArray.push({
          user_id: userId,
          full_name: participant.full_name,
          balance: parseFloat(balance.toFixed(2)),
        });
      }
    });

    setBalances(balancesArray);

    // Calculate settlements and make sure they are ordered correctly for display
    calculateSettlements(balancesArray);
  };

  const calculateSettlements = (balances: Balance[]) => {
    // Separate positive (creditors) and negative (debtors) balances
    const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);

    const settlements: Settlement[] = [];

    // Process each debtor in order
    debtors.forEach(debtor => {
      const debtorSettlements: Settlement[] = [];
      let remainingDebt = Math.abs(debtor.balance);

      // Find all creditors this debtor needs to pay
      while (remainingDebt > 0.01 && creditors.length > 0) {
        const creditor = creditors[0];
        const paymentAmount = Math.min(remainingDebt, creditor.balance);

        if (paymentAmount > 0.01) {
          debtorSettlements.push({
            from_id: debtor.user_id,
            from_name: debtor.full_name,
            to_id: creditor.user_id,
            to_name: creditor.full_name,
            amount: parseFloat(paymentAmount.toFixed(2)),
          });

          remainingDebt -= paymentAmount;
          creditor.balance -= paymentAmount;

          if (creditor.balance < 0.01) {
            creditors.shift();
          }
        }
      }

      // Add all settlements for this debtor
      settlements.push(...debtorSettlements);
    });

    setSettlements(settlements);
  };

  const handleAddExpense = async (newExpense: any) => {
    try {
      setLoading(true);

      // Insert the new expense
      const { data, error } = await supabase
        .from('expenses')
        .insert([
          {
            trip_id: id,
            category: newExpense.category,
            amount: parseFloat(newExpense.amount),
            currency: newExpense.currency,
            date: newExpense.date,
            description: newExpense.description,
            paid_by: newExpense.paidBy,
            split_type: newExpense.splitType,
            status: 'active',
          },
        ])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const expenseId = data[0].id;

        // Handle expense participants based on split type
        if (newExpense.splitType === 'equal') {
          const splitAmount = parseFloat(newExpense.amount) / newExpense.participants.length;

          const participantInserts = newExpense.participants.map((participantId: string) => ({
            expense_id: expenseId,
            user_id: participantId,
            amount: splitAmount,
            currency: newExpense.currency,
            is_paid: participantId === newExpense.paidBy, // The payer has already paid their share
          }));

          const { error: participantError } = await supabase
            .from('expense_participants')
            .insert(participantInserts);

          if (participantError) throw participantError;
        } else if (newExpense.splitType === 'custom') {
          // Handle custom split (would need custom amounts from the form)
          // Not implemented in this version
        }

        // Refresh expenses
        const { data: updatedExpenses, error: fetchError } = await supabase
          .from('expenses')
          .select(`
            *,
            users!inner(*),
            expense_participants!inner(
              user_id,
              amount,
              is_paid,
              users:user_id!inner(*)
            )
          `)
          .eq('trip_id', id)
          .order('date', { ascending: false });

        if (fetchError) throw fetchError;

        const formattedExpenses: Expense[] = (updatedExpenses || []).map((e: any) => ({
          id: e.id,
          trip_id: e.trip_id,
          category: e.category,
          amount: e.amount,
          currency: e.currency,
          date: e.date,
          description: e.description,
          paid_by: e.paid_by,
          split_type: e.split_type,
          receipt_url: e.receipt_url,
          status: e.status,
          created_at: e.created_at,
          updated_at: e.updated_at,
          paid_by_name: e.users.full_name,
          participants: (e.expense_participants || []).map((p: any) => ({
            user_id: p.user_id,
            amount: p.amount,
            is_paid: p.is_paid,
            full_name: p.users.full_name
          }))
        }));

        setExpenses(formattedExpenses);

        // Recalculate balances
        calculateBalances(formattedExpenses, participants);
      }

      setIsAddExpenseModalOpen(false);
    } catch (err) {
      console.error('Error adding expense:', err);
      setError('Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      setLoading(true);

      // First delete the expense participants
      const { error: participantError } = await supabase
        .from('expense_participants')
        .delete()
        .eq('expense_id', expenseId);

      if (participantError) throw participantError;

      // Then delete the expense
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      // Update the expenses list
      setExpenses(expenses.filter(e => e.id !== expenseId));

      // Recalculate balances
      calculateBalances(
        expenses.filter(e => e.id !== expenseId),
        participants
      );
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-destructive mb-6 max-w-md w-full">
          <p>{error}</p>
        </div>
        <Link
          href={`/trips/${id}`}
          className="text-primary hover:text-primary/90 transition-colors"
        >
          ← Back to Trip
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <BackButton href={`/trips/${id}`} label="Back to Trip" />
        </div>

        <div className="max-w-7xl mx-auto py-3 px-3 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center">
              <DollarSignIcon className="h-6 w-6 mr-2" />
              Expenses
            </h1>
            {trip && (
              <p className="text-sm text-muted-foreground">
                {trip.name} • {trip.destination || 'No destination'}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Tabs
            defaultValue="expenses"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="expenses" className="flex items-center gap-2">
                <ReceiptIcon className="h-4 w-4" />
                <span>Expenses</span>
              </TabsTrigger>
              <TabsTrigger value="balances" className="flex items-center gap-2">
                <BarChart3Icon className="h-4 w-4" />
                <span>Balances</span>
              </TabsTrigger>
            </TabsList>

            <Button
              onClick={() => setIsAddExpenseModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mb-6 w-full sm:w-auto"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Expense
            </Button>

            <TabsContent value="expenses" className="mt-0">
              <ExpenseList
                expenses={expenses}
                participants={participants}
                currency={trip?.preferences?.currency || 'USD'}
                onDelete={handleDeleteExpense}
              />
            </TabsContent>

            <TabsContent value="balances" className="mt-0">
              <ExpenseBalances
                balances={balances}
                settlements={settlements}
                currency={trip?.preferences?.currency || 'USD'}
                currentUserId={user?.id}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        onSubmit={handleAddExpense}
        participants={participants}
        currentUserId={user?.id}
        currency={trip?.preferences?.currency || 'USD'}
      />
    </div>
  );
}
