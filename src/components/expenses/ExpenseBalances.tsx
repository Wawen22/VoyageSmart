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
    <div className="space-y-6">
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 backdrop-blur-sm">
              <BarChart3Icon className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Balance Summary</h3>
              <p className="text-sm text-muted-foreground">Who owes what to whom</p>
            </div>
          </div>
        </div>
        <div className="p-0">
          {balances.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-white/20 mx-auto w-fit">
                  <WalletIcon className="h-12 w-12 text-amber-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400/20 rounded-full animate-ping"></div>
              </div>
              <div className="space-y-2 mt-6">
                <h4 className="text-lg font-bold text-foreground">No balances yet</h4>
                <p className="text-muted-foreground">
                  No balance information available yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {sortedBalances.map((balance) => (
                <div
                  key={balance.user_id}
                  className={`flex items-center justify-between p-4 ${balance.user_id === currentUserId ? 'bg-amber-500/5 border-l-2 border-amber-500/30' : 'hover:bg-background/30'} transition-all duration-300`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-600 backdrop-blur-sm border border-white/20">
                      {balance.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {balance.full_name}
                        {balance.user_id === currentUserId && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-amber-500/20 text-amber-600 rounded-full border border-amber-500/30">You</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {balance.balance === 0 ? 'All settled up' : balance.balance > 0 ? 'To receive' : 'To pay'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {balance.balance > 0 ? (
                      <div className="glass-info-card px-3 py-1.5 rounded-xl bg-green-500/20 text-green-600 border border-green-500/30 flex items-center">
                        <ArrowUpIcon className="h-3.5 w-3.5 mr-1.5" />
                        <span className="font-bold">{formatCurrency(balance.balance, currency)}</span>
                      </div>
                    ) : balance.balance < 0 ? (
                      <div className="glass-info-card px-3 py-1.5 rounded-xl bg-red-500/20 text-red-600 border border-red-500/30 flex items-center">
                        <ArrowDownIcon className="h-3.5 w-3.5 mr-1.5" />
                        <span className="font-bold">{formatCurrency(Math.abs(balance.balance), currency)}</span>
                      </div>
                    ) : (
                      <div className="glass-info-card px-3 py-1.5 rounded-xl bg-green-500/20 text-green-600 border border-green-500/30 flex items-center">
                        <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                        <span className="font-bold">Settled</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-green-500/20 backdrop-blur-sm">
              <UsersIcon className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Settlements</h3>
              <p className="text-sm text-muted-foreground">Required payments to settle balances</p>
            </div>
          </div>
        </div>
        <div className="p-0">
          {settlements.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-white/20 mx-auto w-fit">
                  <CheckCircleIcon className="h-12 w-12 text-green-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400/20 rounded-full animate-ping"></div>
              </div>
              <div className="space-y-2 mt-6">
                <h4 className="text-lg font-bold text-foreground">All settled up!</h4>
                <p className="text-muted-foreground">
                  Everyone is settled up! No payments needed.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {settlements.map((settlement, index) => (
                <div
                  key={index}
                  className={`p-4 ${settlement.from_id === currentUserId || settlement.to_id === currentUserId
                    ? 'bg-amber-500/5 border-l-2 border-amber-500/30'
                    : 'hover:bg-background/30'
                  } transition-all duration-300`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-grow">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/20 text-red-600 flex items-center justify-center text-sm font-bold backdrop-blur-sm border border-white/20">
                        {settlement.from_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {settlement.from_name}
                          {settlement.from_id === currentUserId && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-amber-500/20 text-amber-600 rounded-full border border-amber-500/30">You</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">Pays</div>
                      </div>

                      <ArrowRightIcon className="h-5 w-5 text-amber-500 mx-2" />

                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-500/20 text-green-600 flex items-center justify-center text-sm font-bold backdrop-blur-sm border border-white/20">
                        {settlement.to_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {settlement.to_name}
                          {settlement.to_id === currentUserId && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-amber-500/20 text-amber-600 rounded-full border border-amber-500/30">You</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">Receives</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="glass-info-card px-4 py-2 rounded-xl">
                        <span className="font-bold text-foreground">
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
                          className="glass-button-primary px-3 py-1.5 text-xs rounded-xl transition-all duration-300 hover:scale-105"
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
        </div>
      </div>
    </div>
  );
}
