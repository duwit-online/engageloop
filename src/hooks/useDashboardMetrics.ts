import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

interface DashboardMetrics {
  capsulesEarned: number;
  capsulesSpent: number;
  tasksCompleted: number;
  linksPromoted: number;
  engagementsReceived: number;
  pendingSubmissions: number;
}

interface RecentActivity {
  id: string;
  type: 'earned' | 'spent';
  amount: number;
  description: string;
  time: string;
}

export function useDashboardMetrics() {
  const { supabaseUser } = useApp();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    capsulesEarned: 0,
    capsulesSpent: 0,
    tasksCompleted: 0,
    linksPromoted: 0,
    engagementsReceived: 0,
    pendingSubmissions: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!supabaseUser) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch wallet transactions
      const { data: transactions } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch task submissions
      const { data: submissions } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('user_id', supabaseUser.id);

      // Fetch trust score data
      const { data: trustScore } = await supabase
        .from('user_trust_scores')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();

      // Calculate metrics
      let earned = 0;
      let spent = 0;

      if (transactions) {
        transactions.forEach((tx) => {
          if (tx.type === 'credit' || tx.type === 'earned') {
            earned += tx.amount;
          } else if (tx.type === 'debit' || tx.type === 'spent') {
            spent += Math.abs(tx.amount);
          }
        });
      }

      const completedTasks = submissions?.filter((s) => s.status === 'released').length || 0;
      const pendingTasks = submissions?.filter((s) => s.status === 'pending' || s.status === 'verified').length || 0;

      setMetrics({
        capsulesEarned: trustScore?.total_capsules_earned || earned,
        capsulesSpent: spent,
        tasksCompleted: trustScore?.total_tasks_completed || completedTasks,
        linksPromoted: 0, // TODO: implement when we have promo link tracking
        engagementsReceived: 0, // TODO: implement when we have engagement tracking
        pendingSubmissions: pendingTasks,
      });

      // Build recent activity from transactions
      const activity: RecentActivity[] = (transactions || []).slice(0, 10).map((tx) => ({
        id: tx.id,
        type: tx.type === 'credit' || tx.type === 'earned' ? 'earned' : 'spent',
        amount: Math.abs(tx.amount),
        description: tx.description || 'Transaction',
        time: new Date(tx.created_at).toLocaleString(),
      }));

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabaseUser]);

  useEffect(() => {
    fetchMetrics();

    if (!supabaseUser) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel('dashboard-metrics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${supabaseUser.id}` },
        () => fetchMetrics()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_submissions', filter: `user_id=eq.${supabaseUser.id}` },
        () => fetchMetrics()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_trust_scores', filter: `user_id=eq.${supabaseUser.id}` },
        () => fetchMetrics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabaseUser, fetchMetrics]);

  return { metrics, recentActivity, isLoading, refetch: fetchMetrics };
}
