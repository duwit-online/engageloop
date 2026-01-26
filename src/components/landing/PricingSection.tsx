import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Loader2 } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { CurrencySelector } from '@/components/CurrencySelector';
import { Link } from 'react-router-dom';
import { useAppSettings } from '@/hooks/useAppSettings';

const subscriptionDurations = [
  { months: 1, label: 'Monthly', discountKey: 'none' },
  { months: 3, label: 'Quarterly', discountKey: 'quarterly_discount' },
  { months: 6, label: 'Biannual', discountKey: 'biannual_discount' },
  { months: 12, label: 'Annual', discountKey: 'annual_discount' },
];

const freemiumFeatures = [
  '1,500 Capsules/month',
  '100 Capsules daily limit',
  '200 Signup bonus',
  '1x earning multiplier',
  'Standard support',
];

const premiumFeatures = [
  '6,000 Capsules/month',
  'No daily spending limit',
  '200 Signup bonus',
  '1.5x earning multiplier',
  'Ad-free experience',
  'Priority 24/7 support',
  'Batch tasks enabled',
  'One-click auto-tasking UI',
];

export function PricingSection() {
  const { formatPrice } = useCurrency();
  const { settings, isLoading } = useAppSettings();
  const [duration, setDuration] = useState(1);

  const selectedDuration = subscriptionDurations.find(d => d.months === duration)!;
  
  // Get discount from settings
  const discount = selectedDuration.discountKey === 'none' 
    ? 0 
    : settings.premium_pricing[selectedDuration.discountKey as keyof typeof settings.premium_pricing] || 0;
  
  const premiumPrice = settings.premium_pricing.monthly * duration * (1 - discount);

  if (isLoading) {
    return (
      <section id="pricing" className="py-20 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade when you're ready to accelerate your growth.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <CurrencySelector />

          <div className="flex rounded-lg bg-card border border-border p-1">
            {subscriptionDurations.map(d => {
              const dDiscount = d.discountKey === 'none' 
                ? 0 
                : settings.premium_pricing[d.discountKey as keyof typeof settings.premium_pricing] || 0;
              
              return (
                <button
                  key={d.months}
                  onClick={() => setDuration(d.months)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    duration === d.months
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {d.label}
                  {dDiscount > 0 && (
                    <span className="ml-1 text-xs text-accent">-{Math.round(dDiscount * 100)}%</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Freemium */}
          <Card className="relative border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="text-2xl">Freemium</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold">Free</span>
                <span className="text-muted-foreground"> forever</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {freemiumFeatures.map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block">
                <Button variant="outline" className="w-full">
                  Get Started Free
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Premium */}
          <Card className="relative border-primary/50 bg-card shadow-glow">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="gradient-primary text-primary-foreground px-4">
                <Zap className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Premium</CardTitle>
              <CardDescription>For serious growth</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold">
                  {formatPrice(premiumPrice)}
                </span>
                <span className="text-muted-foreground">
                  {' '}/ {selectedDuration.label.toLowerCase()}
                </span>
              </div>
              {discount > 0 && (
                <p className="text-sm text-success">
                  Save {formatPrice(settings.premium_pricing.monthly * duration * discount)}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {premiumFeatures.map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block">
                <Button variant="gradient" className="w-full">
                  Upgrade to Premium
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
