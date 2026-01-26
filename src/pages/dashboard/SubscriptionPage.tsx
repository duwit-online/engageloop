import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Loader2, CreditCard, Building2 } from 'lucide-react';
import { plans, subscriptionDurations } from '@/lib/economy';
import { currencies, formatPrice } from '@/lib/currency';
import { useApp } from '@/contexts/AppContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface PaymentConfig {
  provider: string;
  is_enabled: boolean;
}

interface UserSubscription {
  id: string;
  plan: string;
  starts_at: string;
  expires_at: string | null;
  auto_renew: boolean;
}

const SubscriptionPage = () => {
  const { user, currency, setCurrency, setUser, supabaseUser } = useApp();
  const { toast } = useToast();
  const [duration, setDuration] = useState(1);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);

  const currentPlan = plans[user?.plan || 'freemium'];
  const selectedDuration = subscriptionDurations.find(d => d.months === duration)!;
  const premiumPrice = plans.premium.priceMonthly * duration * (1 - selectedDuration.discount);

  // Fetch payment configs and subscription
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingConfigs(true);
      try {
        // Fetch enabled payment configs
        const { data: configs } = await supabase
          .from('payment_configs')
          .select('provider, is_enabled')
          .eq('is_enabled', true);

        setPaymentConfigs(configs || []);

        // Fetch user subscription
        if (supabaseUser?.id) {
          const { data: sub } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', supabaseUser.id)
            .eq('plan', 'premium')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (sub) {
            setSubscription(sub);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingConfigs(false);
      }
    };

    fetchData();
  }, [supabaseUser?.id]);

  const handleUpgradeClick = () => {
    const enabledConfigs = paymentConfigs.filter(c => 
      c.is_enabled && (c.provider === 'paystack' || c.provider === 'flutterwave')
    );

    if (enabledConfigs.length === 0) {
      toast({
        title: 'Payment Unavailable',
        description: 'No payment methods are currently available. Please try again later.',
        variant: 'destructive',
      });
      return;
    }

    if (enabledConfigs.length === 1) {
      handlePayment(enabledConfigs[0].provider);
    } else {
      setShowPaymentDialog(true);
    }
  };

  const handlePayment = async (provider: string) => {
    setSelectedProvider(provider);
    setIsUpgrading(true);
    setShowPaymentDialog(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: 'Error',
          description: 'Please log in to continue',
          variant: 'destructive',
        });
        setIsUpgrading(false);
        return;
      }

      const response = await supabase.functions.invoke('initialize-payment', {
        body: {
          provider,
          amount_ngn: premiumPrice,
          capsules: 0, // No capsules for subscription
          payment_type: 'subscription',
          subscription_months: duration,
          email: supabaseUser?.email,
          callback_url: `${window.location.origin}/dashboard/subscription`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Payment initialization failed');
      }

      if (response.data?.payment_url) {
        // Redirect to payment page
        window.location.href = response.data.payment_url;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Failed to initialize payment',
        variant: 'destructive',
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      await supabase
        .from('user_subscriptions')
        .update({ auto_renew: false })
        .eq('id', subscription.id);

      setSubscription({ ...subscription, auto_renew: false });
      toast({
        title: 'Subscription Updated',
        description: 'Auto-renewal has been disabled. Your subscription will end on the expiry date.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update subscription',
        variant: 'destructive',
      });
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription) return;

    try {
      await supabase
        .from('user_subscriptions')
        .update({ auto_renew: true })
        .eq('id', subscription.id);

      setSubscription({ ...subscription, auto_renew: true });
      toast({
        title: 'Subscription Reactivated',
        description: 'Your subscription will automatically renew.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reactivate subscription',
        variant: 'destructive',
      });
    }
  };

  const availableGateways = paymentConfigs.filter(c => 
    c.is_enabled && (c.provider === 'paystack' || c.provider === 'flutterwave')
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Subscription</h2>
          <p className="text-muted-foreground">Manage your plan and billing</p>
        </div>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-40 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {currencies.map(c => (
              <SelectItem key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current Plan */}
      <Card className={user?.plan === 'premium' ? 'border-primary/50 shadow-glow' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {user?.plan === 'premium' ? (
                  <Crown className="w-5 h-5 text-primary" />
                ) : null}
                Current Plan: {currentPlan.name}
              </CardTitle>
              <CardDescription>
                {user?.plan === 'premium' 
                  ? 'You have access to all premium features'
                  : 'Upgrade to unlock more features'}
              </CardDescription>
            </div>
            <Badge variant={user?.plan === 'premium' ? 'default' : 'secondary'} className="text-sm">
              {user?.plan === 'premium' ? 'Active' : 'Free'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">{currentPlan.monthlyAllowance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Monthly Allowance</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">{currentPlan.dailyLimit || '∞'}</p>
              <p className="text-xs text-muted-foreground">Daily Limit</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">{currentPlan.multiplier}x</p>
              <p className="text-xs text-muted-foreground">Earning Multiplier</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">{currentPlan.adsEnabled ? 'Yes' : 'No'}</p>
              <p className="text-xs text-muted-foreground">Ads</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Section */}
      {user?.plan === 'freemium' && (
        <>
          {/* Duration Selector */}
          <div className="flex justify-center">
            <div className="inline-flex flex-wrap justify-center rounded-lg bg-card border border-border p-1 gap-1">
              {subscriptionDurations.map(d => (
                <button
                  key={d.months}
                  onClick={() => setDuration(d.months)}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    duration === d.months
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {d.label}
                  {d.discount > 0 && (
                    <span className="ml-1 text-xs text-accent">-{d.discount * 100}%</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Premium Plan Card */}
          <Card className="border-primary/50 shadow-glow">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Premium Plan
                  </CardTitle>
                  <CardDescription>Unlock your full potential</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{formatPrice(premiumPrice, currency)}</p>
                  <p className="text-sm text-muted-foreground">
                    for {selectedDuration.months} {selectedDuration.months === 1 ? 'month' : 'months'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plans.premium.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant="gradient" 
                size="lg" 
                className="w-full gap-2"
                onClick={handleUpgradeClick}
                disabled={isUpgrading || isLoadingConfigs}
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    Upgrade to Premium
                  </>
                )}
              </Button>

              {availableGateways.length === 0 && !isLoadingConfigs && (
                <p className="text-center text-sm text-muted-foreground">
                  Payment methods are being configured. Please check back later.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Premium User Management */}
      {user?.plan === 'premium' && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Renewal Date</p>
                <p className="text-sm text-muted-foreground">
                  {subscription?.expires_at 
                    ? `Your subscription ${subscription.auto_renew ? 'renews' : 'expires'} on ${format(new Date(subscription.expires_at), 'MMMM d, yyyy')}`
                    : 'Lifetime subscription'}
                </p>
              </div>
              <Badge variant={subscription?.auto_renew ? 'default' : 'secondary'}>
                Auto-renew {subscription?.auto_renew ? 'ON' : 'OFF'}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex-1" onClick={handleUpgradeClick}>
                Extend Subscription
              </Button>
              {subscription?.auto_renew ? (
                <Button 
                  variant="outline" 
                  className="flex-1 text-destructive hover:text-destructive"
                  onClick={handleCancelSubscription}
                >
                  Cancel Auto-Renewal
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleReactivateSubscription}
                >
                  Enable Auto-Renewal
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
            <DialogDescription>
              Select your preferred payment method to continue
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            {availableGateways.map(config => (
              <Button
                key={config.provider}
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4"
                onClick={() => handlePayment(config.provider)}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium capitalize">{config.provider}</p>
                  <p className="text-sm text-muted-foreground">
                    Pay with card, bank transfer, or USSD
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPage;