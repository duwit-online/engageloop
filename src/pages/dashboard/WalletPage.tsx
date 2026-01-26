import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { useApp } from '@/contexts/AppContext';
import { useWallet, usePaymentConfigs } from '@/hooks/useWallet';
import { useBankTransfer } from '@/hooks/useBankTransfer';
import { capsulePackages } from '@/lib/economy';
import { currencies, formatPrice } from '@/lib/currency';
import { TransactionList } from '@/components/wallet/TransactionList';
import { PaymentMethodSelector } from '@/components/wallet/PaymentMethodSelector';
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart,
  History,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';

const WalletPage = () => {
  const { capsuleBalance, currency, setCurrency } = useApp();
  const { transactions, isLoading: txLoading, totalEarned, totalSpent } = useWallet();
  const { transfers, fetchUserTransfers, isLoading: transfersLoading } = useBankTransfer();
  const [selectedPackage, setSelectedPackage] = useState<typeof capsulePackages[0] | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchUserTransfers();
  }, [fetchUserTransfers]);

  const handlePurchase = (pkg: typeof capsulePackages[0]) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const statusIcons = {
    pending: <Clock className="w-4 h-4 text-warning" />,
    approved: <CheckCircle className="w-4 h-4 text-success" />,
    rejected: <XCircle className="w-4 h-4 text-destructive" />,
  };

  const statusColors = {
    pending: 'bg-warning/10 text-warning',
    approved: 'bg-success/10 text-success',
    rejected: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Wallet</h2>
          <p className="text-muted-foreground">Manage your Capsules</p>
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

      {/* Balance Card */}
      <Card className="gradient-primary border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-primary-foreground/80 flex items-center gap-2">
                <WalletIcon className="w-5 h-5" />
                Current Balance
              </p>
              <CapsuleBadge amount={capsuleBalance} size="lg" className="text-2xl" />
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-foreground">{totalEarned.toLocaleString()}</p>
                <p className="text-sm text-primary-foreground/80 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Earned
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-foreground">{totalSpent.toLocaleString()}</p>
                <p className="text-sm text-primary-foreground/80 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  Spent
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Capsules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Top-Up Capsules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {capsulePackages.map((pkg) => (
              <Card 
                key={pkg.capsules} 
                className={`relative ${pkg.featured ? 'border-primary shadow-glow' : 'border-border'}`}
              >
                {pkg.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-capsule text-primary-foreground px-3">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Best Value
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6 text-center space-y-4">
                  <CapsuleBadge amount={pkg.capsules} size="lg" />
                  <p className="text-2xl font-bold">{formatPrice(pkg.priceNGN, currency)}</p>
                  <p className="text-sm text-muted-foreground">{pkg.label}</p>
                  <Button 
                    variant={pkg.featured ? 'gradient' : 'outline'} 
                    className="w-full"
                    onClick={() => handlePurchase(pkg)}
                  >
                    Purchase
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History & Pending Transfers */}
      <Tabs defaultValue="transactions">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Transfers
            {transfers.filter(t => t.status === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {transfers.filter(t => t.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={transactions} isLoading={txLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Bank Transfer Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transfersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : transfers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No bank transfer requests</p>
                  <p className="text-sm">When you pay via bank transfer, your requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transfers.map(transfer => (
                    <div 
                      key={transfer.id} 
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusColors[transfer.status]}`}>
                          {statusIcons[transfer.status]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CapsuleBadge amount={transfer.capsules_to_credit} size="sm" />
                            <Badge variant="outline" className={statusColors[transfer.status]}>
                              {transfer.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatPrice(Number(transfer.amount_ngn), currency)} • {formatDistanceToNow(new Date(transfer.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      {transfer.review_notes && (
                        <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {transfer.review_notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
      {selectedPackage && (
        <PaymentMethodSelector
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          capsules={selectedPackage.capsules}
          priceNGN={selectedPackage.priceNGN}
          packageId={selectedPackage.label}
          currency={currency}
          label={selectedPackage.label}
        />
      )}
    </div>
  );
};

export default WalletPage;
