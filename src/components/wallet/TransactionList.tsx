import { CapsuleBadge } from '@/components/CapsuleBadge';
import { TrendingUp, TrendingDown, ShoppingCart, Zap, Gift, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { WalletTransaction } from '@/hooks/useWallet';

const transactionIcons: Record<string, React.ElementType> = {
  earned: TrendingUp,
  spent: TrendingDown,
  purchased: ShoppingCart,
  slashed: AlertTriangle,
  refund: Gift,
  bonus: Zap,
};

const transactionColors: Record<string, string> = {
  earned: 'bg-success/10 text-success',
  spent: 'bg-accent/10 text-accent',
  purchased: 'bg-capsule/10 text-capsule',
  slashed: 'bg-destructive/10 text-destructive',
  refund: 'bg-primary/10 text-primary',
  bonus: 'bg-warning/10 text-warning',
};

interface TransactionListProps {
  transactions: WalletTransaction[];
  isLoading: boolean;
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-border animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
            </div>
            <div className="h-6 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No transactions yet</p>
        <p className="text-sm">Complete tasks or purchase capsules to see your history</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {transactions.map(tx => {
        const Icon = transactionIcons[tx.type] || TrendingUp;
        const colorClass = transactionColors[tx.type] || 'bg-muted text-muted-foreground';
        const isPositive = tx.amount > 0;

        return (
          <div 
            key={tx.id} 
            className="flex items-center justify-between py-3 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{tx.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <CapsuleBadge 
              amount={Math.abs(tx.amount)} 
              size="sm" 
              showPlus={isPositive}
              className={!isPositive ? 'text-destructive' : ''}
            />
          </div>
        );
      })}
    </div>
  );
}
