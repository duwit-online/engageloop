import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { formatPrice } from '@/lib/currency';
import { usePaymentConfigs } from '@/hooks/useWallet';
import { BankTransferDialog } from './BankTransferDialog';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Building2, 
  Loader2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface PaymentMethodSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capsules: number;
  priceNGN: number;
  packageId?: string;
  currency: string;
  label: string;
  paymentType?: 'topup' | 'subscription';
  subscriptionMonths?: number;
}

const providerIcons: Record<string, React.ReactNode> = {
  paystack: <CreditCard className="w-5 h-5" />,
  flutterwave: <CreditCard className="w-5 h-5" />,
  paypal: <CreditCard className="w-5 h-5" />,
  manual_bank: <Building2 className="w-5 h-5" />,
};

const providerLabels: Record<string, string> = {
  paystack: 'Pay with Paystack',
  flutterwave: 'Pay with Flutterwave',
  paypal: 'Pay with PayPal',
  manual_bank: 'Bank Transfer',
};

export function PaymentMethodSelector({
  open,
  onOpenChange,
  capsules,
  priceNGN,
  packageId,
  currency,
  label,
  paymentType = 'topup',
  subscriptionMonths,
}: PaymentMethodSelectorProps) {
  const { configs, isLoading } = usePaymentConfigs();
  const { user } = useApp();
  const { toast } = useToast();
  const [showBankTransfer, setShowBankTransfer] = useState(false);
  const [processingProvider, setProcessingProvider] = useState<string | null>(null);

  const handleProviderClick = async (provider: string) => {
    if (provider === 'manual_bank') {
      setShowBankTransfer(true);
      onOpenChange(false);
      return;
    }

    if (!user?.email) {
      toast({ title: 'Error', description: 'Please log in to make a payment', variant: 'destructive' });
      return;
    }

    setProcessingProvider(provider);
    
    try {
      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: {
          provider,
          amount_ngn: priceNGN,
          capsules,
          package_id: packageId,
          payment_type: paymentType,
          subscription_months: subscriptionMonths,
          email: user.email,
          callback_url: `${window.location.origin}/dashboard/wallet`,
        },
      });

      if (error) throw error;

      if (data?.payment_url) {
        // Redirect to payment page
        window.location.href = data.payment_url;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Failed to initialize payment',
        variant: 'destructive',
      });
    } finally {
      setProcessingProvider(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-capsule" />
              Choose Payment Method
            </DialogTitle>
            <DialogDescription>
              Select how you'd like to pay
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Package info */}
            <div className="bg-gradient-to-r from-capsule/20 to-primary/20 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">{label}</p>
              <CapsuleBadge amount={capsules} size="lg" />
              <p className="text-xl font-bold mt-2">{formatPrice(priceNGN, currency)}</p>
            </div>

            {/* Payment methods */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : configs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No payment methods available</p>
                <p className="text-sm">Please contact support</p>
              </div>
            ) : (
              <div className="space-y-2">
                {configs.map(config => (
                  <Button
                    key={config.provider}
                    variant="outline"
                    className="w-full justify-between h-14"
                    onClick={() => handleProviderClick(config.provider)}
                    disabled={processingProvider !== null}
                  >
                    <div className="flex items-center gap-3">
                      {providerIcons[config.provider]}
                      <span>{providerLabels[config.provider] || config.provider}</span>
                    </div>
                    {processingProvider === config.provider ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BankTransferDialog
        open={showBankTransfer}
        onOpenChange={setShowBankTransfer}
        capsules={capsules}
        priceNGN={priceNGN}
        packageId={packageId}
        currency={currency}
      />
    </>
  );
}
