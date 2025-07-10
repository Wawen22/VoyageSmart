# Expense Management

VoyageSmart's expense management system provides comprehensive tools for tracking, categorizing, and splitting travel costs among trip participants. Keep your budget on track and ensure fair cost sharing with powerful expense tracking features.

## 🎯 Overview

The expense management system allows you to:
- Track all trip-related expenses with detailed categorization
- Set and monitor trip budgets with real-time updates
- Split costs fairly among trip participants
- Support multiple currencies with automatic conversion
- Generate detailed expense reports and analytics
- Upload and store receipt images for record keeping

## ✨ Key Features

### Expense Tracking

#### Expense Structure
```typescript
interface Expense {
  id: string;
  trip_id: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: string;
  paid_by: string;              // User ID who paid
  receipt_url?: string;         // Receipt image URL
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants: ExpenseParticipant[];  // Who owes what
}

type ExpenseCategory = 
  | 'accommodation'
  | 'transportation'
  | 'food'
  | 'entertainment'
  | 'shopping'
  | 'activities'
  | 'miscellaneous';

interface ExpenseParticipant {
  id: string;
  expense_id: string;
  user_id: string;
  amount_owed: number;
  amount_paid: number;
  created_at: string;
}
```

#### Adding Expenses
```typescript
const createExpense = async (expenseData: Partial<Expense>) => {
  try {
    // Create the expense record
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert([{
        trip_id: expenseData.trip_id,
        description: expenseData.description,
        amount: expenseData.amount,
        currency: expenseData.currency || 'USD',
        category: expenseData.category,
        date: expenseData.date,
        paid_by: expenseData.paid_by,
        receipt_url: expenseData.receipt_url,
        notes: expenseData.notes,
        created_by: user.id
      }])
      .select()
      .single();

    // Handle expense splitting
    if (expenseData.participants) {
      await splitExpense(expense.id, expenseData.participants);
    }

    return expense;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};
```

### Budget Management

#### Budget Structure
```typescript
interface TripBudget {
  total_budget: number;
  currency: string;
  category_budgets: {
    [key in ExpenseCategory]?: number;
  };
  daily_budget?: number;
  per_person_budget?: number;
  alerts: {
    percentage_threshold: number;  // Alert when X% of budget is spent
    amount_threshold: number;      // Alert when X amount remaining
    enabled: boolean;
  };
}
```

#### Budget Tracking
```typescript
const getBudgetStatus = async (tripId: string) => {
  // Get trip budget
  const { data: trip } = await supabase
    .from('trips')
    .select('budget_total, preferences')
    .eq('id', tripId)
    .single();

  // Get total expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, currency, category')
    .eq('trip_id', tripId);

  // Calculate budget status
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = trip.budget_total - totalSpent;
  const percentageUsed = (totalSpent / trip.budget_total) * 100;

  return {
    total_budget: trip.budget_total,
    total_spent: totalSpent,
    remaining,
    percentage_used: percentageUsed,
    category_breakdown: calculateCategoryBreakdown(expenses),
    is_over_budget: remaining < 0,
    alerts: checkBudgetAlerts(trip.preferences.alerts, percentageUsed, remaining)
  };
};
```

### Expense Splitting

#### Splitting Methods
```typescript
type SplitMethod = 'equal' | 'custom' | 'percentage' | 'shares';

interface SplitConfiguration {
  method: SplitMethod;
  participants: {
    user_id: string;
    amount?: number;        // For custom splits
    percentage?: number;    // For percentage splits
    shares?: number;        // For share-based splits
  }[];
}

const splitExpense = async (expenseId: string, splitConfig: SplitConfiguration) => {
  const expense = await getExpense(expenseId);
  const participants = [];

  switch (splitConfig.method) {
    case 'equal':
      const amountPerPerson = expense.amount / splitConfig.participants.length;
      splitConfig.participants.forEach(participant => {
        participants.push({
          expense_id: expenseId,
          user_id: participant.user_id,
          amount_owed: amountPerPerson,
          amount_paid: participant.user_id === expense.paid_by ? expense.amount : 0
        });
      });
      break;

    case 'custom':
      splitConfig.participants.forEach(participant => {
        participants.push({
          expense_id: expenseId,
          user_id: participant.user_id,
          amount_owed: participant.amount || 0,
          amount_paid: participant.user_id === expense.paid_by ? expense.amount : 0
        });
      });
      break;

    // Additional split methods...
  }

  const { data, error } = await supabase
    .from('expense_participants')
    .insert(participants)
    .select();

  return data;
};
```

### Multi-Currency Support

#### Currency Handling
```typescript
interface CurrencyRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  date: string;
}

const convertCurrency = async (amount: number, fromCurrency: string, toCurrency: string) => {
  if (fromCurrency === toCurrency) return amount;

  // Get exchange rate (from cache or API)
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
};

const normalizeExpenseAmounts = async (expenses: Expense[], baseCurrency: string) => {
  const normalizedExpenses = [];

  for (const expense of expenses) {
    const convertedAmount = await convertCurrency(
      expense.amount,
      expense.currency,
      baseCurrency
    );

    normalizedExpenses.push({
      ...expense,
      normalized_amount: convertedAmount,
      base_currency: baseCurrency
    });
  }

  return normalizedExpenses;
};
```

## 📊 Expense Analytics

### Spending Analysis

#### Category Breakdown
```typescript
const getCategoryBreakdown = (expenses: Expense[]) => {
  const breakdown = expenses.reduce((acc, expense) => {
    const category = expense.category;
    if (!acc[category]) {
      acc[category] = {
        total: 0,
        count: 0,
        percentage: 0
      };
    }
    acc[category].total += expense.amount;
    acc[category].count += 1;
    return acc;
  }, {} as Record<ExpenseCategory, { total: number; count: number; percentage: number }>);

  // Calculate percentages
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  Object.keys(breakdown).forEach(category => {
    breakdown[category as ExpenseCategory].percentage = 
      (breakdown[category as ExpenseCategory].total / totalAmount) * 100;
  });

  return breakdown;
};
```

#### Daily Spending Trends
```typescript
const getDailySpendingTrends = (expenses: Expense[]) => {
  const dailySpending = expenses.reduce((acc, expense) => {
    const date = expense.date;
    if (!acc[date]) {
      acc[date] = {
        total: 0,
        count: 0,
        categories: {}
      };
    }
    acc[date].total += expense.amount;
    acc[date].count += 1;
    
    if (!acc[date].categories[expense.category]) {
      acc[date].categories[expense.category] = 0;
    }
    acc[date].categories[expense.category] += expense.amount;
    
    return acc;
  }, {} as Record<string, any>);

  return Object.entries(dailySpending).map(([date, data]) => ({
    date,
    ...data
  }));
};
```

### Participant Balance

#### Balance Calculation
```typescript
const calculateParticipantBalances = async (tripId: string) => {
  const { data: participants } = await supabase
    .from('trip_participants')
    .select('user_id, users(full_name)')
    .eq('trip_id', tripId)
    .eq('invitation_status', 'accepted');

  const { data: expenseParticipants } = await supabase
    .from('expense_participants')
    .select(`
      user_id,
      amount_owed,
      amount_paid,
      expenses(trip_id)
    `)
    .eq('expenses.trip_id', tripId);

  const balances = participants.map(participant => {
    const userExpenses = expenseParticipants.filter(ep => ep.user_id === participant.user_id);
    
    const totalOwed = userExpenses.reduce((sum, ep) => sum + ep.amount_owed, 0);
    const totalPaid = userExpenses.reduce((sum, ep) => sum + ep.amount_paid, 0);
    const balance = totalPaid - totalOwed;

    return {
      user_id: participant.user_id,
      name: participant.users.full_name,
      total_owed: totalOwed,
      total_paid: totalPaid,
      balance: balance,
      status: balance > 0 ? 'owed' : balance < 0 ? 'owes' : 'settled'
    };
  });

  return balances;
};
```

## 📱 Receipt Management

### Receipt Upload and Storage

#### Image Upload
```typescript
const uploadReceipt = async (file: File, expenseId: string) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${expenseId}-${Date.now()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { data, error } = await supabase.storage
      .from('expense-receipts')
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('expense-receipts')
      .getPublicUrl(filePath);

    // Update expense with receipt URL
    await supabase
      .from('expenses')
      .update({ receipt_url: publicUrl })
      .eq('id', expenseId);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading receipt:', error);
    throw error;
  }
};
```

#### OCR Integration (Future Feature)
```typescript
// Planned feature for automatic receipt data extraction
const extractReceiptData = async (receiptUrl: string) => {
  // Integration with OCR service to extract:
  // - Merchant name
  // - Date
  // - Total amount
  // - Individual items
  // - Tax information
  
  const response = await fetch('/api/ocr/extract-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receipt_url: receiptUrl })
  });

  return response.json();
};
```

## 📈 Reporting and Export

### Expense Reports

#### Report Generation
```typescript
interface ExpenseReport {
  trip_id: string;
  trip_name: string;
  date_range: { start: string; end: string };
  total_expenses: number;
  currency: string;
  category_breakdown: Record<ExpenseCategory, number>;
  participant_breakdown: Array<{
    name: string;
    total_paid: number;
    total_owed: number;
    balance: number;
  }>;
  daily_breakdown: Array<{
    date: string;
    total: number;
    expenses: Expense[];
  }>;
}

const generateExpenseReport = async (tripId: string) => {
  const trip = await getTrip(tripId);
  const expenses = await getTripExpenses(tripId);
  const participants = await calculateParticipantBalances(tripId);

  const report: ExpenseReport = {
    trip_id: tripId,
    trip_name: trip.name,
    date_range: {
      start: trip.start_date,
      end: trip.end_date
    },
    total_expenses: expenses.reduce((sum, e) => sum + e.amount, 0),
    currency: trip.preferences.currency,
    category_breakdown: getCategoryBreakdown(expenses),
    participant_breakdown: participants,
    daily_breakdown: getDailySpendingTrends(expenses)
  };

  return report;
};
```

### Export Options

#### PDF Export
```typescript
const exportToPDF = async (report: ExpenseReport) => {
  // Generate PDF using a library like jsPDF or Puppeteer
  const pdf = new jsPDF();
  
  // Add trip header
  pdf.text(report.trip_name, 20, 20);
  pdf.text(`Expense Report (${report.date_range.start} - ${report.date_range.end})`, 20, 30);
  
  // Add summary
  pdf.text(`Total Expenses: ${report.total_expenses} ${report.currency}`, 20, 50);
  
  // Add category breakdown
  let yPosition = 70;
  Object.entries(report.category_breakdown).forEach(([category, amount]) => {
    pdf.text(`${category}: ${amount} ${report.currency}`, 20, yPosition);
    yPosition += 10;
  });
  
  return pdf.output('blob');
};
```

#### CSV Export
```typescript
const exportToCSV = (expenses: Expense[]) => {
  const headers = ['Date', 'Description', 'Category', 'Amount', 'Currency', 'Paid By', 'Notes'];
  const rows = expenses.map(expense => [
    expense.date,
    expense.description,
    expense.category,
    expense.amount.toString(),
    expense.currency,
    expense.paid_by,
    expense.notes || ''
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return new Blob([csvContent], { type: 'text/csv' });
};
```

## 🔔 Budget Alerts and Notifications

### Alert System

#### Budget Threshold Alerts
```typescript
const checkBudgetAlerts = async (tripId: string) => {
  const budgetStatus = await getBudgetStatus(tripId);
  const trip = await getTrip(tripId);
  const alerts = [];

  // Check percentage threshold
  if (budgetStatus.percentage_used >= trip.preferences.alerts.percentage_threshold) {
    alerts.push({
      type: 'budget_percentage',
      message: `You've spent ${budgetStatus.percentage_used.toFixed(1)}% of your budget`,
      severity: budgetStatus.percentage_used >= 90 ? 'high' : 'medium'
    });
  }

  // Check amount threshold
  if (budgetStatus.remaining <= trip.preferences.alerts.amount_threshold) {
    alerts.push({
      type: 'budget_amount',
      message: `Only ${budgetStatus.remaining} ${trip.preferences.currency} remaining in budget`,
      severity: budgetStatus.remaining <= 0 ? 'high' : 'medium'
    });
  }

  // Check over budget
  if (budgetStatus.is_over_budget) {
    alerts.push({
      type: 'over_budget',
      message: `You're over budget by ${Math.abs(budgetStatus.remaining)} ${trip.preferences.currency}`,
      severity: 'high'
    });
  }

  return alerts;
};
```

### Notification Delivery
```typescript
const sendBudgetNotification = async (userId: string, alert: BudgetAlert) => {
  // Send in-app notification
  await createNotification({
    user_id: userId,
    type: 'budget_alert',
    title: 'Budget Alert',
    message: alert.message,
    severity: alert.severity
  });

  // Send email notification (if enabled)
  if (await isEmailNotificationEnabled(userId, 'budget_alerts')) {
    await sendEmail({
      to: await getUserEmail(userId),
      subject: 'VoyageSmart Budget Alert',
      template: 'budget_alert',
      data: { alert, trip: await getTrip(alert.trip_id) }
    });
  }
};
```

## 🔧 Advanced Features

### Expense Categories Customization
```typescript
const createCustomCategory = async (tripId: string, categoryName: string, color: string) => {
  const { data, error } = await supabase
    .from('custom_expense_categories')
    .insert([{
      trip_id: tripId,
      name: categoryName,
      color: color,
      created_by: user.id
    }])
    .select()
    .single();

  return data;
};
```

### Recurring Expenses
```typescript
interface RecurringExpense {
  id: string;
  trip_id: string;
  template: Omit<Expense, 'id' | 'date' | 'created_at' | 'updated_at'>;
  frequency: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  end_date?: string;
  next_occurrence: string;
  is_active: boolean;
}

const createRecurringExpenses = async (recurringExpense: RecurringExpense) => {
  // Generate expenses based on frequency and date range
  const expenses = generateExpenseOccurrences(recurringExpense);
  
  const { data, error } = await supabase
    .from('expenses')
    .insert(expenses)
    .select();

  return data;
};
```

---

**Related Features:**
- [Trip Management](./trip-management.md) - Set trip budgets
- [Itinerary Planning](./itinerary-planning.md) - Track activity costs
- [Collaboration](./collaboration.md) - Share expenses with participants
