import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Real-time admin hook for managing all app data
export function useAdminRealtime() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [trustScores, setTrustScores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [submissionsRes, profilesRes, trustRes] = await Promise.all([
        supabase.from('task_submissions').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_trust_scores').select('*').order('updated_at', { ascending: false }),
      ]);

      if (submissionsRes.data) setSubmissions(submissionsRes.data);
      if (profilesRes.data) setUsers(profilesRes.data);
      if (trustRes.data) setTrustScores(trustRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    fetchAllData();

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_submissions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setSubmissions(prev => [payload.new as any, ...prev]);
          toast.info('New submission received');
        } else if (payload.eventType === 'UPDATE') {
          setSubmissions(prev => prev.map(s => s.id === payload.new.id ? payload.new as any : s));
        } else if (payload.eventType === 'DELETE') {
          setSubmissions(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setUsers(prev => [payload.new as any, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new as any : u));
        } else if (payload.eventType === 'DELETE') {
          setUsers(prev => prev.filter(u => u.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_trust_scores' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTrustScores(prev => [payload.new as any, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTrustScores(prev => prev.map(t => t.id === payload.new.id ? payload.new as any : t));
        } else if (payload.eventType === 'DELETE') {
          setTrustScores(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllData]);

  // CRUD Operations
  const updateSubmission = async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase.from('task_submissions').update(updates).eq('id', id);
    if (error) {
      toast.error('Failed to update submission');
      return false;
    }
    return true;
  };

  const deleteSubmission = async (id: string) => {
    const { error } = await supabase.from('task_submissions').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete submission');
      return false;
    }
    toast.success('Submission deleted');
    return true;
  };

  const updateUser = async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) {
      toast.error('Failed to update user');
      return false;
    }
    return true;
  };

  const updateTrustScore = async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase.from('user_trust_scores').update(updates).eq('id', id);
    if (error) {
      toast.error('Failed to update trust score');
      return false;
    }
    return true;
  };

  const approveSubmission = async (id: string, notes?: string) => {
    return updateSubmission(id, {
      status: 'verified',
      verified_at: new Date().toISOString(),
      review_notes: notes,
    });
  };

  const rejectSubmission = async (id: string, notes: string) => {
    return updateSubmission(id, {
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    });
  };

  const releaseSubmission = async (id: string) => {
    const submission = submissions.find(s => s.id === id);
    if (!submission) return false;

    const success = await updateSubmission(id, {
      status: 'released',
      released_at: new Date().toISOString(),
    });

    if (success && submission.user_id) {
      // Update user's capsule balance
      const trustScore = trustScores.find(t => t.user_id === submission.user_id);
      if (trustScore) {
        await updateTrustScore(trustScore.id, {
          total_capsules_earned: (trustScore.total_capsules_earned || 0) + submission.capsules_earned,
          total_tasks_completed: (trustScore.total_tasks_completed || 0) + 1,
        });
      }
    }

    return success;
  };

  const adjustUserTrustScore = async (userId: string, adjustment: number, reason?: string) => {
    const trustScore = trustScores.find(t => t.user_id === userId);
    if (!trustScore) return false;

    const newScore = Math.max(0, Math.min(100, trustScore.trust_score + adjustment));
    return updateTrustScore(trustScore.id, { trust_score: newScore });
  };

  const setCooldown = async (userId: string, hours: number) => {
    const trustScore = trustScores.find(t => t.user_id === userId);
    if (!trustScore) return false;

    const cooldownUntil = new Date();
    cooldownUntil.setHours(cooldownUntil.getHours() + hours);
    return updateTrustScore(trustScore.id, { cooldown_until: cooldownUntil.toISOString() });
  };

  return {
    submissions,
    users,
    trustScores,
    isLoading,
    refetch: fetchAllData,
    // Submissions CRUD
    updateSubmission,
    deleteSubmission,
    approveSubmission,
    rejectSubmission,
    releaseSubmission,
    // Users CRUD
    updateUser,
    // Trust Scores CRUD
    updateTrustScore,
    adjustUserTrustScore,
    setCooldown,
  };
}
