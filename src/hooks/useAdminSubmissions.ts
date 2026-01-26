import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TaskSubmission {
  id: string;
  task_id: string;
  platform: string;
  task_type: string;
  platform_username: string;
  content_question: string;
  content_answer: string;
  screenshot_url: string | null;
  timer_seconds: number;
  status: 'pending' | 'verified' | 'rejected' | 'released';
  capsules_earned: number;
  verification_result: unknown;
  created_at: string;
  verified_at: string | null;
  released_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  user_id: string | null;
}

export interface SubmissionStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  released: number;
}

export function useAdminSubmissions() {
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [stats, setStats] = useState<SubmissionStats>({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    released: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected' | 'released'>('pending');

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('task_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('Error fetching submissions:', error);
        return;
      }

      setSubmissions((data as TaskSubmission[]) || []);

      // Fetch stats
      const { data: statsData } = await supabase
        .from('task_submissions')
        .select('status');

      if (statsData) {
        const newStats: SubmissionStats = {
          total: statsData.length,
          pending: statsData.filter(s => s.status === 'pending').length,
          verified: statsData.filter(s => s.status === 'verified').length,
          rejected: statsData.filter(s => s.status === 'rejected').length,
          released: statsData.filter(s => s.status === 'released').length,
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const approveSubmission = useCallback(async (id: string, notes?: string) => {
    const { error } = await supabase
      .from('task_submissions')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        review_notes: notes || null,
      } as never)
      .eq('id', id);

    if (error) {
      console.error('Error approving submission:', error);
      return false;
    }

    await fetchSubmissions();
    return true;
  }, [fetchSubmissions]);

  const rejectSubmission = useCallback(async (id: string, notes: string) => {
    const { error } = await supabase
      .from('task_submissions')
      .update({
        status: 'rejected',
        review_notes: notes,
      } as never)
      .eq('id', id);

    if (error) {
      console.error('Error rejecting submission:', error);
      return false;
    }

    await fetchSubmissions();
    return true;
  }, [fetchSubmissions]);

  const releaseSubmission = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('task_submissions')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
      } as never)
      .eq('id', id);

    if (error) {
      console.error('Error releasing submission:', error);
      return false;
    }

    await fetchSubmissions();
    return true;
  }, [fetchSubmissions]);

  return {
    submissions,
    stats,
    isLoading,
    filter,
    setFilter,
    fetchSubmissions,
    approveSubmission,
    rejectSubmission,
    releaseSubmission,
  };
}
