import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserTrustScore {
  id: string;
  user_id: string | null;
  identifier: string | null;
  trust_score: number;
  total_tasks_completed: number;
  total_tasks_rejected: number;
  total_capsules_earned: number;
  total_capsules_slashed: number;
  last_task_at: string | null;
  cooldown_until: string | null;
  created_at: string;
  updated_at: string;
}

export function useAdminTrustScores() {
  const [trustScores, setTrustScores] = useState<UserTrustScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrustScores = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('user_trust_scores')
        .select('*')
        .order('trust_score', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching trust scores:', error);
        return;
      }

      setTrustScores((data as UserTrustScore[]) || []);
    } catch (error) {
      console.error('Failed to fetch trust scores:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrustScores();
  }, [fetchTrustScores]);

  const updateTrustScore = useCallback(async (id: string, newScore: number) => {
    const clampedScore = Math.max(0, Math.min(100, newScore));
    
    const { error } = await supabase
      .from('user_trust_scores')
      .update({ trust_score: clampedScore } as never)
      .eq('id', id);

    if (error) {
      console.error('Error updating trust score:', error);
      return false;
    }

    await fetchTrustScores();
    return true;
  }, [fetchTrustScores]);

  const setCooldown = useCallback(async (id: string, hours: number) => {
    const cooldownUntil = hours > 0 
      ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await supabase
      .from('user_trust_scores')
      .update({ cooldown_until: cooldownUntil } as never)
      .eq('id', id);

    if (error) {
      console.error('Error setting cooldown:', error);
      return false;
    }

    await fetchTrustScores();
    return true;
  }, [fetchTrustScores]);

  const slashCapsules = useCallback(async (id: string, amount: number) => {
    const record = trustScores.find(t => t.id === id);
    if (!record) return false;

    const { error } = await supabase
      .from('user_trust_scores')
      .update({
        total_capsules_slashed: record.total_capsules_slashed + amount,
      } as never)
      .eq('id', id);

    if (error) {
      console.error('Error slashing capsules:', error);
      return false;
    }

    await fetchTrustScores();
    return true;
  }, [fetchTrustScores, trustScores]);

  return {
    trustScores,
    isLoading,
    fetchTrustScores,
    updateTrustScore,
    setCooldown,
    slashCapsules,
  };
}
