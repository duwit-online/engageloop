import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'submission' | 'approval' | 'rejection' | 'release' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function useRealtimeNotifications(isAdmin: boolean = false) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
    
    // Show toast
    toast(notification.title, {
      description: notification.message,
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    // Subscribe to task_submissions changes
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_submissions',
        },
        (payload) => {
          if (isAdmin) {
            addNotification({
              type: 'submission',
              title: 'New Submission',
              message: `New ${payload.new.task_type} task from @${payload.new.platform_username}`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'task_submissions',
        },
        (payload) => {
          const oldStatus = payload.old?.status;
          const newStatus = payload.new?.status;
          
          if (oldStatus !== newStatus) {
            if (newStatus === 'verified') {
              addNotification({
                type: 'approval',
                title: 'Task Approved',
                message: `Your ${payload.new.task_type} task has been verified!`,
              });
            } else if (newStatus === 'rejected') {
              addNotification({
                type: 'rejection',
                title: 'Task Rejected',
                message: `Your ${payload.new.task_type} task was rejected: ${payload.new.review_notes || 'No reason provided'}`,
              });
            } else if (newStatus === 'released') {
              addNotification({
                type: 'release',
                title: 'Capsules Released!',
                message: `${payload.new.capsules_earned} capsules have been added to your wallet!`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, addNotification]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
