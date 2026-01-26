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

// Mock exchange rates (NGN as base)
const exchangeRates: Record<string, number> = {
  NGN: 1,
  USD: 0.00065,
  GBP: 0.00052,
  EUR: 0.00060,
  CAD: 0.00088,
  KES: 0.084,
  GHS: 0.0078,
  ZAR: 0.012,
};

export function convertFromNGN(amountNGN: number, targetCurrency: string): number {
  const rate = exchangeRates[targetCurrency] || 1;
  return amountNGN * rate;
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = currencies.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || currencyCode;
  
  if (currencyCode === 'NGN') {
    return `${symbol}${amount.toLocaleString()}`;
  }
  
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatPrice(priceNGN: number, currencyCode: string): string {
  const converted = convertFromNGN(priceNGN, currencyCode);
  return formatCurrency(converted, currencyCode);
}
