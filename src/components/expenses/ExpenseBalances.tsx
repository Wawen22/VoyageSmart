import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRightIcon,
  BarChart3Icon,
  ArrowDownIcon,
  ArrowUpIcon,
  WalletIcon,
  CheckCircleIcon,
  UserIcon,
  UsersIcon
} from 'lucide-react';

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

type ExpenseBalancesProps = {
  balances: Balance[];
  settlements: Settlement[];
  currency: string;
  currentUserId?: string;
  onMarkAsPaid?: (fromId: string, toId: string, amount: number) => void;
};

export default function ExpenseBalances({
  balances,
  settlements,
  currency,
  currentUserId,
  onMarkAsPaid
}: ExpenseBalancesProps) {
  // Sort balances by amount (highest to lowest)
  const sortedBalances = [...balances].sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-8">
      <Card className="bg-card border border-border overflow-hidden">
        <CardHeader className="bg-muted/50 pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3Icon className="h-5 w-5 text-primary" />
            Balance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {balances.length === 0 ? (
            <div className="text-center py-8">
              <WalletIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No balance information available yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortedBalances.map((balance) => (
                <div
                  key={balance.user_id}
                  className={`flex items-center justify-between p-4 ${balance.user_id === currentUserId ? 'bg-primary/5' : 'hover:bg-muted/30'} transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {balance.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">
                        {balance.full_name}
                        {balance.user_id === currentUserId && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">You</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {balance.balance === 0 ? 'All settled up' : balance.balance > 0 ? 'To receive' : 'To pay'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {balance.balance > 0 ? (
                      <div className="px-3 py-1.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-md flex items-center">
                        <ArrowUpIcon className="h-3.5 w-3.5 mr-1.5" />
                        <span className="font-medium">{formatCurrency(balance.balance, currency)}</span>
                      </div>
                    ) : balance.balance < 0 ? (
                      <div className="px-3 py-1.5 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-md flex items-center">
                        <ArrowDownIcon className="h-3.5 w-3.5 mr-1.5" />
                        <span className="font-medium">{formatCurrency(Math.abs(balance.balance), currency)}</span>
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 bg-muted text-muted-foreground rounded-md flex items-center">
                        <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                        <span className="font-medium">Settled</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border border-border overflow-hidden">
        <CardHeader className="bg-muted/50 pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-primary" />
            Settlements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {settlements.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500/50 mb-3" />
              <p className="text-muted-foreground">
                Everyone is settled up! No payments needed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {settlements.map((settlement, index) => (
                <div
                  key={index}
                  className={`p-4 ${settlement.from_id === currentUserId || settlement.to_id === currentUserId
                    ? 'bg-primary/5'
                    : 'hover:bg-muted/30'
                  } transition-colors`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-grow">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 flex items-center justify-center text-sm font-medium">
                        {settlement.from_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">
                          {settlement.from_name}
                          {settlement.from_id === currentUserId && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">You</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">Pays</div>
                      </div>

                      <ArrowRightIcon className="h-5 w-5 text-muted-foreground mx-2" />

                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 flex items-center justify-center text-sm font-medium">
                        {settlement.to_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">
                          {settlement.to_name}
                          {settlement.to_id === currentUserId && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">You</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">Receives</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right bg-muted/50 px-4 py-2 rounded-md">
                        <span className="font-semibold text-foreground">
                          {formatCurrency(settlement.amount, currency)}
                        </span>
                      </div>
                      {onMarkAsPaid && (settlement.from_id === currentUserId || settlement.to_id === currentUserId) && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Mark as Paid button clicked', {
                              fromId: settlement.from_id,
                              toId: settlement.to_id,
                              amount: settlement.amount
                            });
                            onMarkAsPaid(settlement.from_id, settlement.to_id, settlement.amount);
                          }}
                          className="px-3 py-1.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
