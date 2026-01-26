import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

export interface WalletTransaction {
  id: string;
  type: 'earned' | 'spent' | 'purchased' | 'slashed' | 'refund' | 'bonus';
  amount: number;
  balance_after: number;
  description: string;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}

export interface PaymentConfig {
  id: string;
  provider: string;
  is_enabled: boolean;
  public_key?: string;
  config: Record<string, unknown>;
}

export interface CapsulePackage {
  id: string;
  capsules: number;
  priceNGN: number;
  label: string;
  featured?: boolean;
}

export function useWallet() {
  const { supabaseUser, capsuleBalance, setCapsuleBalance } = useApp();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  const fetchTransactions = useCallback(async () => {
    if (!supabaseUser) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const txs = (data || []) as WalletTransaction[];
      setTransactions(txs);

      // Calculate totals
      let earned = 0;
      let spent = 0;
      txs.forEach(tx => {
        if (tx.amount > 0) {
          earned += tx.amount;
        } else {
          spent += Math.abs(tx.amount);
        }
      });
      setTotalEarned(earned);
      setTotalSpent(spent);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabaseUser]);

  const refreshBalance = useCallback(async () => {
    if (!supabaseUser) return;

    try {
      const { data } = await supabase
        .from('user_trust_scores')
        .select('total_capsules_earned')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();

      if (data) {
        setCapsuleBalance(data.total_capsules_earned || 0);
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  }, [supabaseUser, setCapsuleBalance]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!supabaseUser) return;

    const channel = supabase
      .channel('wallet_transactions_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${supabaseUser.id}`,
        },
        (payload) => {
          const newTx = payload.new as WalletTransaction;
          setTransactions(prev => [newTx, ...prev]);
          refreshBalance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabaseUser, refreshBalance]);

  return {
    transactions,
    isLoading,
    totalEarned,
    totalSpent,
    capsuleBalance,
    fetchTransactions,
    refreshBalance,
  };
}

export function usePaymentConfigs() {
  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_configs')
        .select('*')
        .eq('is_enabled', true);

      if (error) throw error;
      setConfigs((data || []) as PaymentConfig[]);
    } catch (error) {
      console.error('Error fetching payment configs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return { configs, isLoading, fetchConfigs };
}
