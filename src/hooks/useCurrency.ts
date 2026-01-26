import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const currencies: Currency[] = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];

// Default fallback rates (NGN as base)
const fallbackRates: Record<string, number> = {
  NGN: 1,
  USD: 0.00065,
  GBP: 0.00052,
  EUR: 0.00060,
  CAD: 0.00088,
  KES: 0.084,
  GHS: 0.0078,
  ZAR: 0.012,
};

export function useCurrency() {
  const { currency, setCurrency } = useApp();
  const [rates, setRates] = useState<Record<string, number>>(fallbackRates);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch exchange rates from free API
  const fetchRates = useCallback(async () => {
    try {
      setIsLoading(true);
      // Using exchangerate-api.com free tier (or fallback)
      const response = await fetch(
        'https://api.exchangerate-api.com/v4/latest/NGN'
      );
      
      if (!response.ok) throw new Error('Failed to fetch rates');
      
      const data = await response.json();
      
      const newRates: Record<string, number> = { NGN: 1 };
      currencies.forEach(c => {
        if (data.rates[c.code]) {
          newRates[c.code] = data.rates[c.code];
        } else if (fallbackRates[c.code]) {
          newRates[c.code] = fallbackRates[c.code];
        }
      });
      
      setRates(newRates);
      setLastUpdated(new Date());
      localStorage.setItem('exchangeRates', JSON.stringify({ rates: newRates, timestamp: Date.now() }));
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Try to use cached rates
      const cached = localStorage.getItem('exchangeRates');
      if (cached) {
        const { rates: cachedRates } = JSON.parse(cached);
        setRates(cachedRates);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Detect user's location and set currency
  const detectCurrency = useCallback(async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error('Failed to detect location');
      
      const data = await response.json();
      const countryCurrency = data.currency;
      
      // Check if we support this currency
      const supported = currencies.find(c => c.code === countryCurrency);
      if (supported) {
        setCurrency(countryCurrency);
        localStorage.setItem('preferredCurrency', countryCurrency);
      }
    } catch (error) {
      console.error('Error detecting currency:', error);
      // Check for saved preference
      const saved = localStorage.getItem('preferredCurrency');
      if (saved) {
        setCurrency(saved);
      }
    }
  }, [setCurrency]);

  useEffect(() => {
    // Check for cached rates first
    const cached = localStorage.getItem('exchangeRates');
    if (cached) {
      const { rates: cachedRates, timestamp } = JSON.parse(cached);
      const hoursSinceUpdate = (Date.now() - timestamp) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate < 6) {
        setRates(cachedRates);
        setIsLoading(false);
      } else {
        fetchRates();
      }
    } else {
      fetchRates();
    }

    // Check for saved currency preference
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency) {
      setCurrency(savedCurrency);
    } else {
      // Detect currency based on location
      detectCurrency();
    }
  }, [fetchRates, detectCurrency, setCurrency]);

  const convertFromNGN = useCallback((amountNGN: number, targetCurrency?: string): number => {
    const target = targetCurrency || currency;
    const rate = rates[target] || 1;
    return amountNGN * rate;
  }, [currency, rates]);

  const formatCurrency = useCallback((amount: number, currencyCode?: string): string => {
    const code = currencyCode || currency;
    const curr = currencies.find(c => c.code === code);
    const symbol = curr?.symbol || code;
    
    if (code === 'NGN') {
      return `${symbol}${amount.toLocaleString()}`;
    }
    
    return `${symbol}${amount.toFixed(2)}`;
  }, [currency]);

  const formatPrice = useCallback((priceNGN: number, currencyCode?: string): string => {
    const code = currencyCode || currency;
    const converted = convertFromNGN(priceNGN, code);
    return formatCurrency(converted, code);
  }, [currency, convertFromNGN, formatCurrency]);

  const changeCurrency = useCallback((code: string) => {
    setCurrency(code);
    localStorage.setItem('preferredCurrency', code);
  }, [setCurrency]);

  const getCurrentCurrency = useCallback((): Currency => {
    return currencies.find(c => c.code === currency) || currencies[0];
  }, [currency]);

  return {
    currency,
    currencies,
    rates,
    isLoading,
    lastUpdated,
    convertFromNGN,
    formatCurrency,
    formatPrice,
    changeCurrency,
    getCurrentCurrency,
    refreshRates: fetchRates,
  };
}
