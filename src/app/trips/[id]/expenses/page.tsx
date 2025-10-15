'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import ExpenseList from '@/components/expenses/ExpenseList';
import ExpensesSkeleton from '@/components/expenses/ExpensesSkeleton';
import ExpenseBalances from '@/components/expenses/ExpenseBalances';
import AddExpenseModal from '@/components/expenses/AddExpenseModal';
import EditExpenseModal from '@/components/expenses/EditExpenseModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusIcon, ReceiptIcon, BarChart3Icon, UsersIcon, DollarSignIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { ProactiveSuggestionsTray } from '@/components/dashboard/ProactiveSuggestionsTray';
import { useProactiveSuggestions } from '@/hooks/useProactiveSuggestions';

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
type ExpenseWithParticipants = Omit<DatabaseExpense, 'users' | 'expense_participants'> & {
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
  const { toast } = useToast();
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
  const [expenses, setExpenses] = useState<ExpenseWithParticipants[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<ExpenseWithParticipants | null>(null);
  const [activeTab, setActiveTab] = useState('expenses');

  const {
    activeSuggestions,
    snoozedSuggestions,
    recentCompletedSuggestions,
    retentionDays: suggestionRetentionDays,
    trigger: triggerProactiveSuggestions,
    refresh: refreshProactiveSuggestions,
    markAsRead: markSuggestionAsRead,
    snooze: snoozeSuggestion,
    restore: restoreSuggestion,
    uncomplete: uncompleteSuggestion
  } = useProactiveSuggestions();

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) return;

        // Create user-specific cache keys for this trip to prevent data leakage between accounts
        const tripCacheKey = `${user.id}:expenses_trip_${id}`;
        const participantsCacheKey = `${user.id}:expenses_participants_${id}`;
        const expensesCacheKey = `${user.id}:expenses_data_${id}`;

        // Check if we have cached data
        let cachedTrip = null;
        let cachedParticipants = null;
        let cachedExpenses = null;
        let shouldFetchFresh = false;

        try {
          const tripCache = sessionStorage.getItem(tripCacheKey);
          const participantsCache = sessionStorage.getItem(participantsCacheKey);
          const expensesCache = sessionStorage.getItem(expensesCacheKey);

          if (tripCache && participantsCache && expensesCache) {
            const parsedTripCache = JSON.parse(tripCache);
            const parsedParticipantsCache = JSON.parse(participantsCache);
            const parsedExpensesCache = JSON.parse(expensesCache);

            const now = Date.now();
            const cacheTime = parsedTripCache.timestamp;

            // Use cache if it's less than 5 minutes old
            if (now - cacheTime < 5 * 60 * 1000) {
              console.log('[Expenses] Using cached data');
              cachedTrip = parsedTripCache.data;
              cachedParticipants = parsedParticipantsCache.data;
              cachedExpenses = parsedExpensesCache.data;
            } else {
              shouldFetchFresh = true;
            }
          } else {
            shouldFetchFresh = true;
          }
        } catch (e) {
          console.error('Error parsing cached data:', e);
          shouldFetchFresh = true;
        }

        // If we have valid cached data, use it
        if (cachedTrip && cachedParticipants && cachedExpenses) {
          setTrip(cachedTrip);
          setParticipants(cachedParticipants);
          setExpenses(cachedExpenses);
          calculateBalances(cachedExpenses, cachedParticipants);
          setLoading(false);
          return;
        }

        // Otherwise fetch fresh data

        // Fetch trip details and participants in parallel
        const [tripResponse, participantsResponse] = await Promise.all([
          supabase
            .from('trips')
            .select(`
              id,
              name,
              destination,
              preferences
            `)
            .eq('id', id)
            .single(),
          supabase
            .from('trip_participants')
            .select('*, users!inner(*)')
            .eq('trip_id', id)
            .eq('invitation_status', 'accepted')
            .order('created_at', { ascending: true })
        ]);

        if (tripResponse.error) throw tripResponse.error;
        const tripData = tripResponse.data;
        setTrip(tripData);

        if (participantsResponse.error) throw participantsResponse.error;

        // Format participants data with type assertion
        const formattedParticipants: Participant[] = ((participantsResponse.data || []) as any[]).map(p => ({
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
            expense_participants(
              user_id,
              amount,
              is_paid,
              users(*)
            )
          `)
          .eq('trip_id', id)
          .order('date', { ascending: false });

        if (expensesError) throw expensesError;

        // Format expenses data
        const formattedExpenses: ExpenseWithParticipants[] = (expensesData || []).map((e: any) => ({
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

        // Cache the data
        try {
          const timestamp = Date.now();
          sessionStorage.setItem(tripCacheKey, JSON.stringify({ timestamp, data: tripData }));
          sessionStorage.setItem(participantsCacheKey, JSON.stringify({ timestamp, data: formattedParticipants }));
          sessionStorage.setItem(expensesCacheKey, JSON.stringify({ timestamp, data: formattedExpenses }));
        } catch (e) {
          // Continue even if caching fails
        }
      } catch (err) {
        console.error('Error fetching trip details:', err);
        setError('Failed to load trip details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [id, user]);

  useEffect(() => {
    if (!user?.id || !id) return;

    const run = async () => {
      await refreshProactiveSuggestions({ silent: true });
      await triggerProactiveSuggestions({ trigger: 'app_open' });
    };

    void run();
  }, [user?.id, id, refreshProactiveSuggestions, triggerProactiveSuggestions]);

  const filteredActiveSuggestions = useMemo(
    () => activeSuggestions.filter((suggestion) => suggestion.tripId === id),
    [activeSuggestions, id]
  );
  const filteredSnoozedSuggestions = useMemo(
    () => snoozedSuggestions.filter((suggestion) => suggestion.tripId === id),
    [snoozedSuggestions, id]
  );
  const filteredCompletedSuggestions = useMemo(
    () => recentCompletedSuggestions.filter((suggestion) => suggestion.tripId === id),
    [recentCompletedSuggestions, id]
  );

  // Helper function to refresh expenses data - wrapped in useCallback for real-time subscription
  const refreshExpenses = useCallback(async () => {
    if (!id) return;

    try {
      const { data: updatedExpenses, error: fetchError } = await supabase
        .from('expenses')
        .select(`
          *,
          users!inner(*),
          expense_participants(
            user_id,
            amount,
            is_paid,
            users(*)
          )
        `)
        .eq('trip_id', id)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      // Format expenses data
      const formattedExpenses: ExpenseWithParticipants[] = (updatedExpenses || []).map((e: any) => ({
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

      // Invalidate cache
      try {
        if (user) {
          const expensesCacheKey = `${user.id}:expenses_data_${id}`;
          sessionStorage.removeItem(expensesCacheKey);
        }
      } catch (e) {
        console.error('Error invalidating cache:', e);
      }

      return formattedExpenses;
    } catch (error) {
      console.error('Error refreshing expenses:', error);
      throw error;
    }
  }, [id, participants, user]);

  // Real-time subscription for expenses - ensures all users see the same balances and settlements
  useEffect(() => {
    if (!user || !id) return;

    console.log('[Expenses] Setting up real-time subscription for trip:', id);

    // Set up real-time subscription for expenses and expense_participants
    const expensesChannel = supabase
      .channel(`trip-expenses-realtime-${id}`)
      .on('postgres_changes', {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'expenses',
        filter: `trip_id=eq.${id}`
      }, async (payload) => {
        console.log('[Expenses] Expense change detected:', payload.eventType, payload);
        // Refresh expenses when any change occurs
        try {
          await refreshExpenses();
        } catch (error) {
          console.error('[Expenses] Error refreshing after expense change:', error);
        }
      })
      .on('postgres_changes', {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'expense_participants'
      }, async (payload) => {
        console.log('[Expenses] Expense participant change detected:', payload.eventType, payload);
        // Refresh expenses when participant splits change
        try {
          await refreshExpenses();
        } catch (error) {
          console.error('[Expenses] Error refreshing after participant change:', error);
        }
      })
      .subscribe((status) => {
        console.log('[Expenses] Subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('[Expenses] Cleaning up real-time subscription');
      expensesChannel.unsubscribe();
    };
  }, [id, user, refreshExpenses]);

  const calculateBalances = (expenses: ExpenseWithParticipants[], participants: Participant[]) => {
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
    // Create deep copies to avoid mutating the original balances
    // This ensures consistent settlement calculations for all users
    const creditors = balances
      .filter(b => b.balance > 0)
      .map(b => ({ ...b, balance: b.balance })) // Deep copy
      .sort((a, b) => b.balance - a.balance);

    const debtors = balances
      .filter(b => b.balance < 0)
      .map(b => ({ ...b, balance: Math.abs(b.balance) })) // Deep copy with absolute value
      .sort((a, b) => b.balance - a.balance); // Sort by largest debt first

    const settlements: Settlement[] = [];

    // Process each debtor in order (largest debts first for consistency)
    debtors.forEach(debtor => {
      let remainingDebt = debtor.balance;

      // Find all creditors this debtor needs to pay
      for (let i = 0; i < creditors.length && remainingDebt > 0.01; i++) {
        const creditor = creditors[i];

        if (creditor.balance > 0.01) {
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
          }
        }
      }
    });

    // Sort settlements for consistent display order across all users
    // Sort by: 1) from_name, 2) to_name, 3) amount
    settlements.sort((a, b) => {
      if (a.from_name !== b.from_name) {
        return a.from_name.localeCompare(b.from_name);
      }
      if (a.to_name !== b.to_name) {
        return a.to_name.localeCompare(b.to_name);
      }
      return b.amount - a.amount;
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
        await refreshExpenses();
      }

      setIsAddExpenseModalOpen(false);
    } catch (err) {
      console.error('Error adding expense:', err);
      setError('Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = async (updatedExpense: any) => {
    try {
      setLoading(true);

      // Update the expense
      const { error } = await supabase
        .from('expenses')
        .update({
          category: updatedExpense.category,
          amount: parseFloat(updatedExpense.amount),
          currency: updatedExpense.currency,
          date: updatedExpense.date,
          description: updatedExpense.description,
          paid_by: updatedExpense.paidBy,
          split_type: updatedExpense.splitType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedExpense.id);

      if (error) throw error;

      // First delete existing expense participants
      const { error: deleteError } = await supabase
        .from('expense_participants')
        .delete()
        .eq('expense_id', updatedExpense.id);

      if (deleteError) throw deleteError;

      // Calculate the amount per person
      const amountPerPerson = parseFloat(updatedExpense.amount) / updatedExpense.participants.length;

      // Create new expense participants
      const expenseParticipants = updatedExpense.participants.map((userId: string) => ({
        expense_id: updatedExpense.id,
        user_id: userId,
        amount: amountPerPerson,
        currency: updatedExpense.currency,
        is_paid: userId === updatedExpense.paidBy, // The payer has already paid their share
      }));

      // Insert new expense participants
      const { error: participantsError } = await supabase
        .from('expense_participants')
        .insert(expenseParticipants);

      if (participantsError) throw participantsError;

      // Refresh expenses
      await refreshExpenses();

      setIsEditExpenseModalOpen(false);
      setCurrentExpense(null);
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('Failed to update expense. Please try again.');
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

      // Invalidate cache
      try {
        const expensesCacheKey = `expenses_data_${id}`;
        sessionStorage.removeItem(expensesCacheKey);
      } catch (e) {
        console.error('Error invalidating cache:', e);
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (fromId: string, toId: string, amount: number) => {
    console.log('handleMarkAsPaid called with:', { fromId, toId, amount });

    if (!confirm('Are you sure you want to mark this payment as completed?')) {
      return;
    }

    try {
      setLoading(true);


      // Approccio semplificato: creiamo direttamente una spesa di tipo settlement
      // Questo è più affidabile e non richiede di cercare spese esistenti

      // Creiamo una spesa fittizia per registrare il pagamento
      const { data: newExpense, error: newExpenseError } = await supabase
        .from('expenses')
        .insert([
          {
            trip_id: id,
            category: 'settlement',
            amount: amount,
            currency: trip?.preferences?.currency || 'USD',
            date: new Date().toISOString().split('T')[0],
            description: `Settlement payment`,
            paid_by: fromId,
            split_type: 'custom',
            status: 'settled',
          }
        ])
        .select();

      if (newExpenseError) throw newExpenseError;

      console.log('Settlement expense created:', newExpense);

      if (newExpense && newExpense[0]) {
        // Creiamo i partecipanti alla spesa
        const { data: participant, error: participantError } = await supabase
          .from('expense_participants')
          .insert([
            {
              expense_id: newExpense[0].id,
              user_id: toId,
              amount: amount,
              currency: trip?.preferences?.currency || 'USD',
              is_paid: true, // Già pagato
            }
          ])
          .select();

        if (participantError) {
          console.error('Error creating expense participant:', participantError);
          throw participantError;
        }

        console.log('Expense participant created:', participant);
      }

      // Refresh expenses to update the UI
      await refreshExpenses();

      // Show success message
      toast({
        title: 'Payment marked as completed',
        description: `The payment has been successfully marked as completed.`,
        variant: 'success',
      });


    } catch (err) {
      console.error('Error marking payment as paid:', err);
      setError('Failed to mark payment as paid. Please try again.');

      toast({
        title: 'Error',
        description: 'Failed to mark payment as paid. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="relative overflow-visible mb-6">
          {/* Modern Glassmorphism Background - Amber/Orange Theme */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-background/95 to-orange-500/10 backdrop-blur-xl"></div>

          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl animate-pulse glass-orb-float"></div>
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl animate-pulse glass-orb-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute inset-0 opacity-[0.02] glass-grid-pattern"></div>
          </div>

          {/* Glass border effect */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

          {/* Navigation Bar with Glass Effect */}
          <div className="relative z-20 backdrop-blur-sm bg-background/30 border-b border-white/10">
            <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BackButton
                  href={`/trips/${id}`}
                  label="Back to Trip"
                  theme="amber"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-end">
                <ProactiveSuggestionsTray
                  activeSuggestions={filteredActiveSuggestions}
                  snoozedSuggestions={filteredSnoozedSuggestions}
                  recentCompletedSuggestions={filteredCompletedSuggestions}
                  retentionDays={suggestionRetentionDays}
                  onMarkRead={(suggestionId) => {
                    void markSuggestionAsRead(suggestionId);
                  }}
                  onSnooze={(suggestionId) => {
                    void snoozeSuggestion(suggestionId);
                  }}
                  onRestore={(suggestionId) => {
                    void restoreSuggestion(suggestionId);
                  }}
                  onUncomplete={(suggestionId) => {
                    void uncompleteSuggestion(suggestionId);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Main Header Content */}
          <div className="max-w-7xl mx-auto py-4 px-4 sm:py-8 md:py-12 sm:px-6 lg:px-8 relative z-10">
            <div className="animate-glass-fade-in">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-white/20">
                    <DollarSignIcon className="h-6 w-6 text-amber-500" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                    <span className="bg-gradient-to-r from-foreground via-amber-500 to-foreground bg-clip-text text-transparent">
                      Expenses
                    </span>
                  </h1>
                  <div className="h-4 bg-muted-foreground/20 rounded w-48 mt-2 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <ExpensesSkeleton />
        </main>
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
      <header className="relative overflow-visible mb-6">
        {/* Modern Glassmorphism Background - Amber/Orange Theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-background/95 to-orange-500/10 backdrop-blur-xl"></div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating orbs */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl animate-pulse glass-orb-float"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl animate-pulse glass-orb-float" style={{ animationDelay: '2s' }}></div>

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.02] glass-grid-pattern"></div>
        </div>

        {/* Glass border effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

        {/* Navigation Bar with Glass Effect */}
        <div className="relative z-20 backdrop-blur-sm bg-background/30 border-b border-white/10">
          <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BackButton
                href={`/trips/${id}`}
                label="Back to Trip"
                theme="amber"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-end">
              <ProactiveSuggestionsTray
                activeSuggestions={filteredActiveSuggestions}
                snoozedSuggestions={filteredSnoozedSuggestions}
                recentCompletedSuggestions={filteredCompletedSuggestions}
                retentionDays={suggestionRetentionDays}
                onMarkRead={(suggestionId) => {
                  void markSuggestionAsRead(suggestionId);
                }}
                onSnooze={(suggestionId) => {
                  void snoozeSuggestion(suggestionId);
                }}
                onRestore={(suggestionId) => {
                  void restoreSuggestion(suggestionId);
                }}
                onUncomplete={(suggestionId) => {
                  void uncompleteSuggestion(suggestionId);
                }}
              />
            </div>
          </div>
        </div>

        {/* Main Header Content */}
        <div className="max-w-7xl mx-auto py-4 px-4 sm:py-8 md:py-12 sm:px-6 lg:px-8 relative z-10 trip-header-mobile expenses-header-mobile">
          <div className="animate-glass-fade-in">
            {/* Section Title with Modern Typography */}
            <div className="relative mb-6">
              {/* Mobile Layout - Stacked */}
              <div className="flex flex-col space-y-4 md:hidden">
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-white/20">
                      <DollarSignIcon className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold">
                      <span className="bg-gradient-to-r from-foreground via-amber-500 to-foreground bg-clip-text text-transparent">
                        Expenses
                      </span>
                    </h1>
                    {trip && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {trip.name} • {trip.destination || 'No destination'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats Widget - Mobile */}
                <div className="flex justify-center">
                  <div className="glass-info-card flex items-center px-4 py-2 rounded-xl">
                    <div className="p-1 rounded-full bg-amber-500/20 mr-2">
                      <ReceiptIcon className="h-3 w-3 text-amber-500" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-amber-500">{expenses.length}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {expenses.length === 1 ? 'Expense' : 'Expenses'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout - Side by Side */}
              <div className="hidden md:flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-white/20">
                      <DollarSignIcon className="h-6 w-6 text-amber-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                      <span className="bg-gradient-to-r from-foreground via-amber-500 to-foreground bg-clip-text text-transparent">
                        Expenses
                      </span>
                    </h1>
                    {trip && (
                      <p className="text-base text-muted-foreground mt-1">
                        {trip.name} • {trip.destination || 'No destination'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats Widget - Desktop */}
                <div className="flex-shrink-0">
                  <div className="glass-info-card flex items-center px-4 py-2.5 rounded-2xl">
                    <div className="p-1.5 rounded-full bg-amber-500/20 mr-3">
                      <ReceiptIcon className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-500">{expenses.length}</div>
                      <div className="text-xs text-muted-foreground">
                        {expenses.length === 1 ? 'Expense' : 'Expenses'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-amber-500/20 rounded-full animate-ping"></div>
              <div className="absolute -bottom-1 -right-4 w-2 h-2 bg-orange-500/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 expenses-section-mobile">
        {/* Controls Section - Modernized */}
        <div className="mb-6 glass-card rounded-2xl p-4 md:p-6 animate-glass-fade-in expenses-controls-mobile" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Add Button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="glass-button-primary inline-flex items-center px-4 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/25"
              >
                <div className="p-1 rounded-lg bg-white/20 mr-2">
                  <PlusIcon className="h-4 w-4" />
                </div>
                Add Expense
              </button>

              {/* Quick Stats */}
              <div className="hidden md:flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  <span>{expenses.length} total</span>
                </div>
                {expenses.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>{balances.filter(b => b.balance === 0).length} settled</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Tabs - Modernized */}
        <Tabs
          defaultValue="expenses"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <div className="glass-card rounded-2xl p-4 animate-glass-fade-in expenses-view-mobile" style={{ animationDelay: '200ms' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Financial Overview</h3>
                <p className="text-sm text-muted-foreground">Track expenses and manage balances</p>
              </div>

              <div className="flex justify-center sm:justify-end">
                <TabsList className="glass-nav rounded-xl p-1 border border-white/20 bg-background/50 backdrop-blur-sm">
                  <TabsTrigger
                    value="expenses"
                    className="flex items-center px-4 py-2 rounded-lg data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-600 data-[state=active]:shadow-sm transition-all duration-300 hover:bg-amber-500/10"
                  >
                    <ReceiptIcon className="h-4 w-4 mr-2" />
                    Expenses
                  </TabsTrigger>
                  <TabsTrigger
                    value="balances"
                    className="flex items-center px-4 py-2 rounded-lg data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-600 data-[state=active]:shadow-sm transition-all duration-300 hover:bg-amber-500/10"
                  >
                    <BarChart3Icon className="h-4 w-4 mr-2" />
                    Balances
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </div>

          <TabsContent value="expenses" className="mt-0">
            <div className="animate-glass-fade-in" style={{ animationDelay: '300ms' }}>
              <ExpenseList
                expenses={expenses}
                participants={participants}
                currency={trip?.preferences?.currency || 'USD'}
                onDelete={handleDeleteExpense}
                onEdit={(expense) => {
                  setCurrentExpense(expense as ExpenseWithParticipants);
                  setIsEditExpenseModalOpen(true);
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="balances" className="mt-0">
            <div className="animate-glass-fade-in" style={{ animationDelay: '300ms' }}>
              <ExpenseBalances
                balances={balances}
                settlements={settlements}
                currency={trip?.preferences?.currency || 'USD'}
                currentUserId={user?.id}
                onMarkAsPaid={handleMarkAsPaid}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        onSubmit={handleAddExpense}
        participants={participants}
        currentUserId={user?.id}
        currency={trip?.preferences?.currency || 'USD'}
      />

      <EditExpenseModal
        isOpen={isEditExpenseModalOpen}
        onClose={() => {
          setIsEditExpenseModalOpen(false);
          setCurrentExpense(null);
        }}
        onSubmit={handleEditExpense}
        expense={currentExpense}
        participants={participants}
        currentUserId={user?.id}
        currency={trip?.preferences?.currency || 'USD'}
      />
      <Toaster />
    </div>
  );
}
