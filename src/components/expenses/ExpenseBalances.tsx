import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRightIcon, BarChart3Icon, ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

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
};

export default function ExpenseBalances({ 
  balances, 
  settlements, 
  currency, 
  currentUserId 
}: ExpenseBalancesProps) {
  // Sort balances by amount (highest to lowest)
  const sortedBalances = [...balances].sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-8">
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3Icon className="h-5 w-5" />
            Balance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balances.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                No balance information available yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBalances.map((balance) => (
                <div 
                  key={balance.user_id} 
                  className={`flex items-center justify-between p-3 rounded-md ${
                    balance.user_id === currentUserId ? 'bg-primary/5 border border-primary/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {balance.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">
                      {balance.full_name}
                      {balance.user_id === currentUserId && (
                        <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {balance.balance > 0 ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                        Gets back {formatCurrency(balance.balance, currency)}
                      </Badge>
                    ) : balance.balance < 0 ? (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
                        <ArrowDownIcon className="h-3 w-3 mr-1" />
                        Owes {formatCurrency(Math.abs(balance.balance), currency)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Settled up</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-lg">Settlements</CardTitle>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                Everyone is settled up! No payments needed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {settlements.map((settlement, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-md border ${
                    settlement.from_id === currentUserId || settlement.to_id === currentUserId
                      ? 'bg-primary/5 border-primary/20'
                      : 'border-border'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-grow">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {settlement.from_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">
                        {settlement.from_name}
                        {settlement.from_id === currentUserId && (
                          <span className="ml-1 text-xs text-muted-foreground">(You)</span>
                        )}
                      </span>
                      <ArrowRightIcon className="h-4 w-4 text-muted-foreground mx-1" />
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {settlement.to_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">
                        {settlement.to_name}
                        {settlement.to_id === currentUserId && (
                          <span className="ml-1 text-xs text-muted-foreground">(You)</span>
                        )}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-foreground">
                        {formatCurrency(settlement.amount, currency)}
                      </span>
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
