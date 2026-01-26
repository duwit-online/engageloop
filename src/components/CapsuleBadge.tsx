import { cn } from '@/lib/utils';

interface CapsuleBadgeProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showPlus?: boolean;
  className?: string;
}

export function CapsuleBadge({ amount, size = 'md', showPlus = false, className }: CapsuleBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold gradient-capsule text-primary-foreground shadow-capsule',
        sizeClasses[size],
        className
      )}
    >
      <svg
        className={cn(
          'animate-pulse-slow',
          size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
        )}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        <circle cx="12" cy="12" r="5" />
      </svg>
      {showPlus && '+'}{amount.toLocaleString()}
    </span>
  );
}
