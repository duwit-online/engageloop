import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export interface BankTransfer {
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

export function useBankTransfer() {
  const { supabaseUser } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transfers, setTransfers] = useState<BankTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const submitBankTransfer = useCallback(async (
    file: File,
    amountNgn: number,
    capsulesToCredit: number,
    packageId?: string,
    bankReference?: string
  ) => {
    if (!supabaseUser) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return null;
    }

    setIsSubmitting(true);
    try {
      // Upload proof image
      const fileExt = file.name.split('.').pop();
      const fileName = `${supabaseUser.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Get signed URL
      const { data: urlData } = await supabase.storage
        .from('screenshots')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

      const proofUrl = urlData?.signedUrl || fileName;

      // Create bank transfer record
      const { data, error } = await supabase
        .from('bank_transfers')
        .insert({
          user_id: supabaseUser.id,
          amount_ngn: amountNgn,
          capsules_to_credit: capsulesToCredit,
          package_id: packageId,
          proof_url: proofUrl,
          bank_reference: bankReference,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Transfer Submitted',
        description: 'Your payment proof has been submitted for review.',
      });

      return data as BankTransfer;
    } catch (error) {
      console.error('Error submitting bank transfer:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit bank transfer. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [supabaseUser, toast]);

  const fetchUserTransfers = useCallback(async () => {
    if (!supabaseUser) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bank_transfers')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransfers((data || []) as BankTransfer[]);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabaseUser]);

  return {
    submitBankTransfer,
    fetchUserTransfers,
    transfers,
    isSubmitting,
    isLoading,
  };
}
