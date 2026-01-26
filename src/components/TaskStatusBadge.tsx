import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertTriangle, Play, RotateCcw, Unlock } from 'lucide-react';
import { TaskState } from '@/lib/trust';

interface TaskStatusBadgeProps {
  status: TaskState;
  className?: string;
}

const statusConfig: Record<TaskState, { label: string; icon: typeof Clock; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  started: { label: 'Started', icon: Play, variant: 'outline' },
  pending: { label: 'Pending', icon: Clock, variant: 'secondary' },
  verified: { label: 'Verified', icon: CheckCircle, variant: 'default' },
  released: { label: 'Released', icon: Unlock, variant: 'default' },
  reversed: { label: 'Reversed', icon: RotateCcw, variant: 'destructive' },
  flagged: { label: 'Flagged', icon: AlertTriangle, variant: 'destructive' },
};

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn('gap-1', className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
