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
              <h3 className="text-base font-semibold text-foreground sm:text-lg">Balance Summary</h3>
              <p className="text-xs text-muted-foreground sm:text-sm">Who owes what to whom</p>
            </div>
          </div>
        </div>
        <div className="p-0">
          {balances.length === 0 ? (
            <div className="py-12 text-center">
              <div className="relative">
                <div className="mx-auto w-fit rounded-3xl border border-white/20 bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-6 backdrop-blur-sm">
                  <WalletIcon className="h-12 w-12 text-amber-500" />
                </div>
                <div className="absolute -top-2 -right-2 h-6 w-6 animate-ping rounded-full bg-amber-400/20"></div>
              </div>
              <div className="mt-6 space-y-2">
                <h4 className="text-base font-bold text-foreground sm:text-lg">No balances yet</h4>
                <p className="text-xs text-muted-foreground sm:text-sm">
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
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/20 bg-amber-500/20 text-sm font-bold text-amber-600 backdrop-blur-sm">
                      {balance.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground sm:text-base">
                        {balance.full_name}
                        {balance.user_id === currentUserId && (
                          <span className="ml-2 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-xs text-amber-600">You</span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
                        {balance.balance === 0 ? 'All settled up' : balance.balance > 0 ? 'To receive' : 'To pay'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {balance.balance > 0 ? (
                      <div className="glass-info-card flex items-center rounded-xl border border-green-500/30 bg-green-500/20 px-3 py-1.5 text-green-600">
                        <ArrowUpIcon className="mr-1.5 h-3.5 w-3.5" />
                        <span className="text-sm font-bold sm:text-base">{formatCurrency(balance.balance, currency)}</span>
                      </div>
                    ) : balance.balance < 0 ? (
                      <div className="glass-info-card flex items-center rounded-xl border border-red-500/30 bg-red-500/20 px-3 py-1.5 text-red-600">
                        <ArrowDownIcon className="mr-1.5 h-3.5 w-3.5" />
                        <span className="text-sm font-bold sm:text-base">{formatCurrency(Math.abs(balance.balance), currency)}</span>
                      </div>
                    ) : (
                      <div className="glass-info-card flex items-center rounded-xl border border-green-500/30 bg-green-500/20 px-3 py-1.5 text-green-600">
                        <CheckCircleIcon className="mr-1.5 h-3.5 w-3.5" />
                        <span className="text-sm font-bold sm:text-base">Settled</span>
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
              <h3 className="text-base font-semibold text-foreground sm:text-lg">Settlements</h3>
              <p className="text-xs text-muted-foreground sm:text-sm">Required payments to settle balances</p>
            </div>
          </div>
        </div>
        <div className="p-0">
          {settlements.length === 0 ? (
            <div className="py-12 text-center">
              <div className="relative">
                <div className="mx-auto w-fit rounded-3xl border border-white/20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-6 backdrop-blur-sm">
                  <CheckCircleIcon className="h-12 w-12 text-green-500" />
                </div>
                <div className="absolute -top-2 -right-2 h-6 w-6 animate-ping rounded-full bg-green-400/20"></div>
              </div>
              <div className="mt-6 space-y-2">
                <h4 className="text-base font-bold text-foreground sm:text-lg">All settled up!</h4>
                <p className="text-xs text-muted-foreground sm:text-sm">
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
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-grow items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/20 bg-red-500/20 text-sm font-bold text-red-600 backdrop-blur-sm">
                        {settlement.from_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground sm:text-base">
                          {settlement.from_name}
                          {settlement.from_id === currentUserId && (
                            <span className="ml-2 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-xs text-amber-600">You</span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground sm:text-xs">Pays</div>
                      </div>

                      <ArrowRightIcon className="mx-2 h-5 w-5 text-amber-500" />

                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/20 bg-green-500/20 text-sm font-bold text-green-600 backdrop-blur-sm">
                        {settlement.to_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground sm:text-base">
                          {settlement.to_name}
                          {settlement.to_id === currentUserId && (
                            <span className="ml-2 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-xs text-amber-600">You</span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground sm:text-xs">Receives</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="glass-info-card rounded-xl px-4 py-2">
                        <span className="text-sm font-bold text-foreground sm:text-base">
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
