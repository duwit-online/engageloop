import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { formatPrice } from '@/lib/currency';
import { useBankTransfer } from '@/hooks/useBankTransfer';
import { usePaymentConfigs } from '@/hooks/useWallet';
import { Upload, Copy, CheckCircle, Loader2, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BankTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capsules: number;
  priceNGN: number;
  packageId?: string;
  currency: string;
}

export function BankTransferDialog({
  open,
  onOpenChange,
  capsules,
  priceNGN,
  packageId,
  currency,
}: BankTransferDialogProps) {
  const { toast } = useToast();
  const { submitBankTransfer, isSubmitting } = useBankTransfer();
  const { configs } = usePaymentConfigs();
  const [file, setFile] = useState<File | null>(null);
  const [bankReference, setBankReference] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const bankConfig = configs.find(c => c.provider === 'manual_bank');
  const bankDetails = bankConfig?.config as {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    instructions?: string;
  } | undefined;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: 'Copied!', description: `${field} copied to clipboard` });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({ title: 'Error', description: 'File size must be less than 5MB', variant: 'destructive' });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({ title: 'Error', description: 'Please upload proof of payment', variant: 'destructive' });
      return;
    }

    const result = await submitBankTransfer(file, priceNGN, capsules, packageId, bankReference);
    if (result) {
      onOpenChange(false);
      setFile(null);
      setBankReference('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Bank Transfer Payment
          </DialogTitle>
          <DialogDescription>
            Transfer {formatPrice(priceNGN, currency)} and upload proof
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Package info */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <CapsuleBadge amount={capsules} size="lg" />
            <p className="text-lg font-bold mt-2">{formatPrice(priceNGN, currency)}</p>
          </div>

          {/* Bank details */}
          {bankDetails ? (
            <div className="space-y-3 bg-card border rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground">Transfer to:</p>
              
              {bankDetails.bank_name && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Bank</p>
                    <p className="font-medium">{bankDetails.bank_name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(bankDetails.bank_name!, 'Bank')}
                  >
                    {copied === 'Bank' ? <CheckCircle className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              )}

              {bankDetails.account_number && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Account Number</p>
                    <p className="font-medium font-mono">{bankDetails.account_number}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(bankDetails.account_number!, 'Account')}
                  >
                    {copied === 'Account' ? <CheckCircle className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              )}

              {bankDetails.account_name && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Account Name</p>
                    <p className="font-medium">{bankDetails.account_name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(bankDetails.account_name!, 'Name')}
                  >
                    {copied === 'Name' ? <CheckCircle className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              )}

              {bankDetails.instructions && (
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  {bankDetails.instructions}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-4 text-center text-muted-foreground">
              <p>Bank details not configured yet.</p>
              <p className="text-sm">Please contact support.</p>
            </div>
          )}

          {/* Upload proof */}
          <div className="space-y-2">
            <Label>Upload Proof of Payment</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="proof-upload"
              />
              <label htmlFor="proof-upload" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-success">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="w-8 h-8" />
                    <span className="text-sm">Click to upload screenshot</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Bank reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">Transaction Reference (optional)</Label>
            <Input
              id="reference"
              placeholder="Enter bank transaction reference"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
            />
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            variant="gradient"
            onClick={handleSubmit}
            disabled={!file || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit for Review'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
