import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface PendingCapsule {
  id: string;
  amount: number;
  taskType: string;
  submittedAt: Date;
  releaseAt: Date;
  status: 'pending' | 'verified' | 'released' | 'reversed' | 'flagged';
}

interface PendingCapsulesCardProps {
  pendingCapsules: PendingCapsule[];
  totalPending: number;
}

export function PendingCapsulesCard({ pendingCapsules, totalPending }: PendingCapsulesCardProps) {
  if (pendingCapsules.length === 0) {
    return null;
  }

  const getStatusIcon = (status: PendingCapsule['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-4 h-4 animate-spin text-warning" />;
      case 'verified':
        return <Clock className="w-4 h-4 text-primary" />;
      case 'released':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'reversed':
      case 'flagged':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: PendingCapsule['status']) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      verified: 'default',
      released: 'default',
      reversed: 'destructive',
      flagged: 'destructive',
    };

    return (
      <Badge variant={variants[status]} className="capitalize text-xs">
        {status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Capsules
          </div>
          <CapsuleBadge amount={totalPending} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingCapsules.slice(0, 5).map((pending) => {
          const now = new Date();
          const total = pending.releaseAt.getTime() - pending.submittedAt.getTime();
          const elapsed = now.getTime() - pending.submittedAt.getTime();
          const progress = Math.min((elapsed / total) * 100, 100);
          
          return (
            <div key={pending.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              {getStatusIcon(pending.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium capitalize">{pending.taskType}</span>
                  <CapsuleBadge amount={pending.amount} size="sm" />
                </div>
                {pending.status === 'pending' || pending.status === 'verified' ? (
                  <div className="space-y-1">
                    <Progress value={progress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">
                      Releases {formatDistanceToNow(pending.releaseAt, { addSuffix: true })}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {getStatusBadge(pending.status)}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(pending.submittedAt, { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {pendingCapsules.length > 5 && (
          <p className="text-xs text-muted-foreground text-center">
            +{pendingCapsules.length - 5} more pending
          </p>
        )}
      </CardContent>
    </Card>
  );
}
