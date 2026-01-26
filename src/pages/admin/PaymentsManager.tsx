import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  CreditCard,
  Building2,
  Settings,
  Save,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { formatPrice } from '@/lib/currency';
import { formatDistanceToNow } from 'date-fns';

interface PaymentConfig {
  id: string;
  provider: string;
  is_enabled: boolean;
  public_key?: string;
  config: Record<string, unknown>;
  updated_at: string;
}

interface BankTransfer {
  id: string;
  user_id: string;
  amount_ngn: number;
  capsules_to_credit: number;
  package_id?: string;
  proof_url: string;
  bank_reference?: string;
  status: 'pending' | 'approved' | 'rejected';
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

const PaymentsManager = () => {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  const [transfers, setTransfers] = useState<BankTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [processingTransfer, setProcessingTransfer] = useState<string | null>(null);

  // Form states for each provider
  const [formData, setFormData] = useState<Record<string, {
    is_enabled: boolean;
    public_key: string;
    secret_key: string;
    config: Record<string, string>;
  }>>({});

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      // Fetch payment configs
      const { data: configData, error: configError } = await supabase
        .from('payment_configs')
        .select('*')
        .order('provider');

      if (configError) throw configError;

      const cfgs = (configData || []) as PaymentConfig[];
      setConfigs(cfgs);

      // Initialize form data
      const initialFormData: typeof formData = {};
      cfgs.forEach(cfg => {
        initialFormData[cfg.provider] = {
          is_enabled: cfg.is_enabled,
          public_key: cfg.public_key || '',
          secret_key: (cfg.config as Record<string, string>).secret_key || '',
          config: cfg.config as Record<string, string>,
        };
      });
      setFormData(initialFormData);

      // Fetch pending bank transfers
      const { data: transferData, error: transferError } = await supabase
        .from('bank_transfers')
        .select('*')
        .order('created_at', { ascending: false });

      if (transferError) throw transferError;
      setTransfers((transferData || []) as BankTransfer[]);

    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast({ title: 'Error', description: 'Failed to load payment settings', variant: 'destructive' });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveConfig = async (provider: string) => {
    const data = formData[provider];
    if (!data) return;

    setIsSaving(true);
    try {
      const config = { ...data.config };
      if (data.secret_key) {
        config.secret_key = data.secret_key;
      }

      // Find existing config to get the ID
      const existingConfig = configs.find(c => c.provider === provider);
      
      const payload = {
        provider,
        is_enabled: data.is_enabled,
        public_key: data.public_key || null,
        config: config,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (existingConfig) {
        // Update existing
        const result = await supabase
          .from('payment_configs')
          .update(payload)
          .eq('id', existingConfig.id);
        error = result.error;
      } else {
        // Insert new
        const result = await supabase
          .from('payment_configs')
          .insert(payload);
        error = result.error;
      }

      if (error) throw error;

      toast({ title: 'Saved', description: `${provider} settings updated` });
      fetchData(false); // Refresh without full loading state
    } catch (error) {
      console.error('Error saving config:', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveTransfer = async (transfer: BankTransfer) => {
    setProcessingTransfer(transfer.id);
    try {
      // Update transfer status
      const { error: updateError } = await supabase
        .from('bank_transfers')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', transfer.id);

      if (updateError) throw updateError;

      // Credit capsules using the database function
      const { error: creditError } = await supabase.rpc('credit_capsules', {
        p_user_id: transfer.user_id,
        p_amount: transfer.capsules_to_credit,
        p_type: 'purchased',
        p_description: `Bank transfer - ${transfer.package_id || 'Top-up'}`,
        p_reference_id: transfer.id,
        p_reference_type: 'bank_transfer',
      });

      if (creditError) throw creditError;

      toast({ title: 'Approved', description: `${transfer.capsules_to_credit} capsules credited` });
      fetchData(false);
    } catch (error) {
      console.error('Error approving transfer:', error);
      toast({ title: 'Error', description: 'Failed to approve transfer', variant: 'destructive' });
    } finally {
      setProcessingTransfer(null);
    }
  };

  const handleRejectTransfer = async (transfer: BankTransfer, notes: string) => {
    setProcessingTransfer(transfer.id);
    try {
      const { error } = await supabase
        .from('bank_transfers')
        .update({
          status: 'rejected',
          review_notes: notes || 'Payment proof could not be verified',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', transfer.id);

      if (error) throw error;

      toast({ title: 'Rejected', description: 'Transfer marked as rejected' });
      fetchData(false);
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      toast({ title: 'Error', description: 'Failed to reject transfer', variant: 'destructive' });
    } finally {
      setProcessingTransfer(null);
    }
  };

  const updateFormField = (provider: string, field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value,
      },
    }));
  };

  const updateConfigField = (provider: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        config: {
          ...prev[provider]?.config,
          [field]: value,
        },
      },
    }));
  };

  const pendingTransfers = transfers.filter(t => t.status === 'pending');
  const processedTransfers = transfers.filter(t => t.status !== 'pending');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Settings</h2>
          <p className="text-muted-foreground">Configure payment gateways and review bank transfers</p>
        </div>
        <Button variant="outline" onClick={() => fetchData(true)}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="gateways" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto gap-1 p-1">
          <TabsTrigger value="gateways" className="flex-1 min-w-fit flex items-center justify-center gap-1 text-xs sm:text-sm px-2 sm:px-4">
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Payment</span> Gateways
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex-1 min-w-fit flex items-center justify-center gap-1 text-xs sm:text-sm px-2 sm:px-4">
            <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Bank</span> Transfers
            {pendingTransfers.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1">{pendingTransfers.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 min-w-fit flex items-center justify-center gap-1 text-xs sm:text-sm px-2 sm:px-4">
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Payment Gateways Tab */}
        <TabsContent value="gateways" className="space-y-4">
          {configs.filter(c => c.provider !== 'manual_bank').map(config => (
            <Card key={config.provider}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5" />
                    <div>
                      <CardTitle className="capitalize">{config.provider}</CardTitle>
                      <CardDescription>Configure {config.provider} payment gateway</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${config.provider}-enabled`}>Enabled</Label>
                    <Switch
                      id={`${config.provider}-enabled`}
                      checked={formData[config.provider]?.is_enabled || false}
                      onCheckedChange={(checked) => updateFormField(config.provider, 'is_enabled', checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Public Key</Label>
                    <Input
                      placeholder={`${config.provider.toUpperCase()}_PUBLIC_KEY`}
                      value={formData[config.provider]?.public_key || ''}
                      onChange={(e) => updateFormField(config.provider, 'public_key', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <div className="relative">
                      <Input
                        type={showSecrets[config.provider] ? 'text' : 'password'}
                        placeholder={`${config.provider.toUpperCase()}_SECRET_KEY`}
                        value={formData[config.provider]?.secret_key || ''}
                        onChange={(e) => updateFormField(config.provider, 'secret_key', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowSecrets(prev => ({ ...prev, [config.provider]: !prev[config.provider] }))}
                      >
                        {showSecrets[config.provider] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button onClick={() => handleSaveConfig(config.provider)} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save {config.provider}
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Manual Bank Config */}
          {configs.filter(c => c.provider === 'manual_bank').map(config => (
            <Card key={config.provider}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5" />
                    <div>
                      <CardTitle>Manual Bank Transfer</CardTitle>
                      <CardDescription>Configure bank account details for manual transfers</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="bank-enabled">Enabled</Label>
                    <Switch
                      id="bank-enabled"
                      checked={formData[config.provider]?.is_enabled || false}
                      onCheckedChange={(checked) => updateFormField(config.provider, 'is_enabled', checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      placeholder="e.g., GTBank"
                      value={(formData[config.provider]?.config as Record<string, string>)?.bank_name || ''}
                      onChange={(e) => updateConfigField(config.provider, 'bank_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      placeholder="0123456789"
                      value={(formData[config.provider]?.config as Record<string, string>)?.account_number || ''}
                      onChange={(e) => updateConfigField(config.provider, 'account_number', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Name</Label>
                    <Input
                      placeholder="Your Company Name"
                      value={(formData[config.provider]?.config as Record<string, string>)?.account_name || ''}
                      onChange={(e) => updateConfigField(config.provider, 'account_name', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Instructions (shown to users)</Label>
                  <Textarea
                    placeholder="Enter payment instructions for users..."
                    value={(formData[config.provider]?.config as Record<string, string>)?.instructions || ''}
                    onChange={(e) => updateConfigField(config.provider, 'instructions', e.target.value)}
                  />
                </div>
                <Button onClick={() => handleSaveConfig(config.provider)} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Bank Settings
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Bank Transfers Tab */}
        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                Pending Bank Transfers ({pendingTransfers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingTransfers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending transfers to review
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTransfers.map(transfer => (
                    <div key={transfer.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CapsuleBadge amount={transfer.capsules_to_credit} size="md" />
                            <Badge variant="outline">{transfer.package_id || 'Custom'}</Badge>
                          </div>
                          <p className="text-lg font-bold">{formatPrice(Number(transfer.amount_ngn), 'NGN')}</p>
                          <p className="text-sm text-muted-foreground">
                            Submitted {formatDistanceToNow(new Date(transfer.created_at), { addSuffix: true })}
                          </p>
                          {transfer.bank_reference && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Ref:</span> {transfer.bank_reference}
                            </p>
                          )}
                        </div>
                        {transfer.proof_url && (
                          <a 
                            href={transfer.proof_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img 
                              src={transfer.proof_url} 
                              alt="Payment proof" 
                              className="w-32 h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                            />
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          className="flex-1"
                          onClick={() => handleApproveTransfer(transfer)}
                          disabled={processingTransfer === transfer.id}
                        >
                          {processingTransfer === transfer.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Approve & Credit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleRejectTransfer(transfer, '')}
                          disabled={processingTransfer === transfer.id}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transfer History</CardTitle>
            </CardHeader>
            <CardContent>
              {processedTransfers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No processed transfers yet
                </div>
              ) : (
                <div className="space-y-3">
                  {processedTransfers.map(transfer => (
                    <div 
                      key={transfer.id} 
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transfer.status === 'approved' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                        }`}>
                          {transfer.status === 'approved' ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CapsuleBadge amount={transfer.capsules_to_credit} size="sm" />
                            <Badge variant={transfer.status === 'approved' ? 'default' : 'destructive'}>
                              {transfer.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(Number(transfer.amount_ngn), 'NGN')} • {formatDistanceToNow(new Date(transfer.created_at), { addSuffix: true })}
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
    </div>
  );
};

export default PaymentsManager;
