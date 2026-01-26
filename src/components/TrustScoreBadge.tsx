import { Shield, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TrustScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  className?: string;
}

export function TrustScoreBadge({ score, showLabel = true, className }: TrustScoreBadgeProps) {
  const getScoreLevel = (score: number) => {
    if (score >= 90) return { icon: ShieldCheck, label: 'Excellent', color: 'text-success' };
    if (score >= 70) return { icon: Shield, label: 'Good', color: 'text-primary' };
    if (score >= 50) return { icon: ShieldAlert, label: 'Fair', color: 'text-warning' };
    return { icon: ShieldX, label: 'Low', color: 'text-destructive' };
  };

  const { icon: Icon, label, color } = getScoreLevel(score);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('inline-flex items-center gap-1.5', className)}>
          <Icon className={cn('w-4 h-4', color)} />
          {showLabel && (
            <span className={cn('text-sm font-medium', color)}>
              {score}%
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Trust Score: {label} ({score}%)</p>
      </TooltipContent>
    </Tooltip>
  );
}
