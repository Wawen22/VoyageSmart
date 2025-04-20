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
import { PlusIcon, ReceiptIcon, BarChart3Icon, UsersIcon } from 'lucide-react';

type Expense = {
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
  // Joined fields
  paid_by_name?: string;
};

type Participant = {
  id: string;
  user_id: string;
  trip_id: string;
  role: string;
  invitation_status: string;
  created_at: string;
  // Joined fields
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
  const [trip, setTrip] = useState<any | null>(null);
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
          .select('*')
          .eq('id', id)
          .single();

        if (tripError) throw tripError;
        setTrip(tripData);

        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('trip_participants')
          .select(`
            id,
            user_id,
            trip_id,
            role,
            invitation_status,
            created_at,
            users:user_id (
              full_name,
              email
            )
          `)
          .eq('trip_id', id)
          .eq('invitation_status', 'accepted');

        if (participantsError) throw participantsError;

        // Format participants data
        const formattedParticipants = participantsData.map(p => ({
          id: p.id,
          user_id: p.user_id,
          trip_id: p.trip_id,
          role: p.role,
          invitation_status: p.invitation_status,
          created_at: p.created_at,
          full_name: p.users?.full_name || 'Unknown',
          email: p.users?.email || '',
        }));

        setParticipants(formattedParticipants);

        // Fetch expenses
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select(`
            *,
            users:paid_by (
              full_name
            )
          `)
          .eq('trip_id', id)
          .order('date', { ascending: false });

        if (expensesError) throw expensesError;

        // Format expenses data
        const formattedExpenses = expensesData.map(e => ({
          ...e,
          paid_by_name: e.users?.full_name || 'Unknown',
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
      // Add the full amount to the payer's balance
      const payerId = expense.paid_by;
      const currentPayerBalance = balanceMap.get(payerId) || 0;
      balanceMap.set(payerId, currentPayerBalance + expense.amount);

      // Fetch expense participants to see how the expense is split
      // For now, we'll assume equal split among all participants
      const splitAmount = expense.amount / participants.length;
      
      participants.forEach(p => {
        const currentBalance = balanceMap.get(p.user_id) || 0;
        balanceMap.set(p.user_id, currentBalance - splitAmount);
      });
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

    // Calculate settlements (who pays whom)
    calculateSettlements(balancesArray);
  };

  const calculateSettlements = (balances: Balance[]) => {
    // Separate positive (creditors) and negative (debtors) balances
    const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
    
    const settlements: Settlement[] = [];

    // For each debtor, find creditors to pay
    debtors.forEach(debtor => {
      let remainingDebt = Math.abs(debtor.balance);
      
      while (remainingDebt > 0.01 && creditors.length > 0) {
        const creditor = creditors[0];
        const paymentAmount = Math.min(remainingDebt, creditor.balance);
        
        if (paymentAmount > 0.01) {
          settlements.push({
            from_id: debtor.user_id,
            from_name: debtor.full_name,
            to_id: creditor.user_id,
            to_name: creditor.full_name,
            amount: parseFloat(paymentAmount.toFixed(2)),
          });
          
          remainingDebt -= paymentAmount;
          creditor.balance -= paymentAmount;
          
          // If creditor is fully paid, remove from list
          if (creditor.balance < 0.01) {
            creditors.shift();
          }
        } else {
          break;
        }
      }
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
            users:paid_by (
              full_name
            )
          `)
          .eq('trip_id', id)
          .order('date', { ascending: false });
          
        if (fetchError) throw fetchError;
        
        const formattedExpenses = updatedExpenses.map(e => ({
          ...e,
          paid_by_name: e.users?.full_name || 'Unknown',
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
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Expenses</h1>
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
