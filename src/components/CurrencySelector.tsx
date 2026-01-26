import { useCurrency } from '@/hooks/useCurrency';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CurrencySelectorProps {
  compact?: boolean;
  showRefresh?: boolean;
}

export function CurrencySelector({ compact = false, showRefresh = false }: CurrencySelectorProps) {
  const { currency, currencies, changeCurrency, refreshRates, isLoading } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      <Select value={currency} onValueChange={changeCurrency}>
        <SelectTrigger className={compact ? "w-[80px]" : "w-[140px]"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {compact ? (
                <span>{c.symbol} {c.code}</span>
              ) : (
                <span>{c.symbol} {c.name}</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showRefresh && (
        <Button
          variant="ghost"
          size="icon"
          onClick={refreshRates}
          disabled={isLoading}
          className="h-8 w-8"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}
