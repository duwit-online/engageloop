import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminTask {
  id: string;
  title: string;
  description: string | null;
  platform: string;
  task_type: string;
  target_url: string | null;
  capsule_reward: number;
  is_active: boolean;
  is_promoted: boolean;
  priority: number;
  max_completions: number | null;
  current_completions: number;
  created_at: string;
  created_by: string | null;
}

export function useAdminTasks() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('admin_tasks')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('is_promoted', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching admin tasks:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Filter out tasks that have reached max completions
      const availableTasks = (data || []).filter(task => {
        if (task.max_completions === null) return true;
        return task.current_completions < task.max_completions;
      });

      setTasks(availableTasks);
    } catch (err) {
      console.error('Error fetching admin tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_tasks',
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const incrementTaskCompletion = useCallback(async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await supabase
          .from('admin_tasks')
          .update({ current_completions: task.current_completions + 1 })
          .eq('id', taskId);
      }
    } catch (err) {
      console.error('Error incrementing task completion:', err);
    }
  }, [tasks]);

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
    incrementTaskCompletion,
  };
}
