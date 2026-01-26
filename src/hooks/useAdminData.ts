import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'> & {
  status?: string;
  plan?: string;
  cooldown_until?: string | null;
};

export type UserRole = Tables<'user_roles'>;
export type TrustScore = Tables<'user_trust_scores'>;
export type AdZone = Tables<'ad_zones'>;
export type AppSetting = Tables<'app_settings'>;
export type Submission = Tables<'task_submissions'>;
export type UserTask = Tables<'tasks'>;

export interface AdminTask {
  id: string;
  title: string;
  description: string | null;
  platform: string;
  task_type: string;
  target_url: string | null;
  capsule_reward: number;
  priority: number;
  is_promoted: boolean;
  max_completions: number | null;
  current_completions: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  totalCapsules: number;
  totalAds: number;
  totalTasks: number;
}

export function useAdminData() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [trustScores, setTrustScores] = useState<TrustScore[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [adZones, setAdZones] = useState<AdZone[]>([]);
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [adminTasks, setAdminTasks] = useState<AdminTask[]>([]);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    premiumUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    totalCapsules: 0,
    totalAds: 0,
    totalTasks: 0,
  });

  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      // Fetch all data in parallel with individual error handling
      const [profilesRes, rolesRes, trustRes, submissionsRes, adsRes, settingsRes, adminTasksRes, tasksRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*'),
        supabase.from('user_trust_scores').select('*').order('trust_score', { ascending: false }),
        supabase.from('task_submissions').select('*').order('created_at', { ascending: false }),
        supabase.from('ad_zones').select('*').order('created_at', { ascending: false }),
        supabase.from('app_settings').select('*'),
        supabase.from('admin_tasks').select('*').order('priority', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      ]);

      // Log any errors for debugging
      if (profilesRes.error) console.error('Profiles fetch error:', profilesRes.error);
      if (rolesRes.error) console.error('Roles fetch error:', rolesRes.error);
      if (trustRes.error) console.error('Trust scores fetch error:', trustRes.error);
      if (submissionsRes.error) console.error('Submissions fetch error:', submissionsRes.error);
      if (adsRes.error) console.error('Ads fetch error:', adsRes.error);
      if (settingsRes.error) console.error('Settings fetch error:', settingsRes.error);
      if (adminTasksRes.error) console.error('Admin tasks fetch error:', adminTasksRes.error);
      if (tasksRes.error) console.error('Tasks fetch error:', tasksRes.error);

      // Set data even if some queries fail (use empty arrays as fallback)
      setProfiles((profilesRes.data || []) as Profile[]);
      setRoles(rolesRes.data || []);
      setTrustScores(trustRes.data || []);
      setSubmissions(submissionsRes.data || []);
      setAdZones((adsRes.data || []) as AdZone[]);
      setSettings((settingsRes.data || []) as AppSetting[]);
      setAdminTasks((adminTasksRes.data || []) as AdminTask[]);
      setTasks((tasksRes.data || []) as UserTask[]);

      // Calculate stats
      const profs = profilesRes.data || [];
      const subs = submissionsRes.data || [];
      const trust = trustRes.data || [];

      setStats({
        totalUsers: profs.length,
        premiumUsers: profs.filter((p: any) => p.plan === 'premium').length,
        activeUsers: profs.filter((p: any) => p.status === 'active').length,
        suspendedUsers: profs.filter((p: any) => p.status === 'suspended' || p.status === 'banned').length,
        totalSubmissions: subs.length,
        pendingSubmissions: subs.filter(s => s.status === 'pending').length,
        totalCapsules: trust.reduce((sum, t) => sum + t.total_capsules_earned, 0),
        totalAds: (adsRes.data || []).length,
        totalTasks: (tasksRes.data || []).length,
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to fetch data');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    fetchAllData(false);

    const channel = supabase
      .channel('admin-data-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchAllData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => fetchAllData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_trust_scores' }, () => fetchAllData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_submissions' }, () => fetchAllData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_zones' }, () => fetchAllData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => fetchAllData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_tasks' }, () => fetchAllData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchAllData(true))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllData]);

  // Profile CRUD
  const updateProfile = async (id: string, updates: Partial<Profile>) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) {
      toast.error('Failed to update profile');
      return false;
    }
    toast.success('Profile updated');
    return true;
  };

  const suspendUser = async (id: string) => {
    return updateProfile(id, { status: 'suspended' } as any);
  };

  const banUser = async (id: string) => {
    return updateProfile(id, { status: 'banned' } as any);
  };

  const restrictUser = async (id: string) => {
    return updateProfile(id, { status: 'restricted' } as any);
  };

  const activateUser = async (id: string) => {
    return updateProfile(id, { status: 'active' } as any);
  };

  const upgradeToPremiuim = async (id: string) => {
    return updateProfile(id, { plan: 'premium' } as any);
  };

  const downgradeToFree = async (id: string) => {
    return updateProfile(id, { plan: 'freemium' } as any);
  };

  // Create user via edge function (to avoid losing admin session)
  const createUser = async (userData: {
    email: string;
    password: string;
    display_name: string;
    role: 'admin' | 'user';
    plan: 'freemium' | 'premium';
  }): Promise<{ success: boolean; accessLink?: string }> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error('Not authenticated');
        return { success: false };
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify(userData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to create user');
        return { success: false };
      }

      toast.success('User created successfully');
      await fetchAllData(); // Refresh list
      return { success: true, accessLink: result.access_link };
    } catch (error) {
      console.error('Create user error:', error);
      toast.error('Failed to create user');
      return { success: false };
    }
  };

  // Generate access token for existing user
  const generateAccessToken = async (userId: string): Promise<string | null> => {
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase.from('user_access_tokens').insert({
        user_id: userId,
        token,
        expires_at: expiresAt,
      });

      if (error) {
        toast.error('Failed to generate access link');
        return null;
      }

      const accessLink = `${window.location.origin}/login?access_token=${token}`;
      toast.success('Access link generated');
      return accessLink;
    } catch (error) {
      console.error('Generate token error:', error);
      toast.error('Failed to generate access link');
      return null;
    }
  };

  // Roles CRUD
  const assignRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    // Check if role exists
    const existing = roles.find(r => r.user_id === userId && r.role === role);
    if (existing) {
      toast.info('User already has this role');
      return true;
    }

    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
    if (error) {
      toast.error('Failed to assign role');
      return false;
    }
    toast.success(`${role} role assigned`);
    return true;
  };

  const removeRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
    if (error) {
      toast.error('Failed to remove role');
      return false;
    }
    toast.success(`${role} role removed`);
    return true;
  };

  // Trust score CRUD
  const updateTrustScore = async (id: string, score: number) => {
    const { error } = await supabase.from('user_trust_scores').update({ trust_score: Math.max(0, Math.min(100, score)) }).eq('id', id);
    if (error) {
      toast.error('Failed to update trust score');
      return false;
    }
    toast.success('Trust score updated');
    return true;
  };

  const setCooldown = async (id: string, hours: number) => {
    const cooldownUntil = hours > 0 ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() : null;
    const { error } = await supabase.from('user_trust_scores').update({ cooldown_until: cooldownUntil }).eq('id', id);
    if (error) {
      toast.error('Failed to set cooldown');
      return false;
    }
    toast.success(hours > 0 ? `Cooldown set for ${hours}h` : 'Cooldown cleared');
    return true;
  };

const slashCapsules = async (id: string, amount: number) => {
    const trust = trustScores.find(t => t.id === id);
    if (!trust) return false;
    
    const { error } = await supabase.from('user_trust_scores').update({
      total_capsules_slashed: trust.total_capsules_slashed + amount,
    }).eq('id', id);
    if (error) {
      toast.error('Failed to slash capsules');
      return false;
    }
    toast.success(`Slashed ${amount} capsules`);
    return true;
  };

  // Credit capsules to any user (admin only)
  const creditCapsules = async (userId: string, amount: number, description?: string) => {
    const trust = trustScores.find(t => t.user_id === userId);
    if (!trust) {
      toast.error('User trust score not found');
      return false;
    }
    
    const newBalance = trust.total_capsules_earned + amount;
    
    // Update trust score with new balance
    const { error: updateError } = await supabase.from('user_trust_scores').update({
      total_capsules_earned: newBalance,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
    
    if (updateError) {
      console.error('Failed to credit capsules:', updateError);
      toast.error('Failed to credit capsules');
      return false;
    }

    // Add wallet transaction record
    const { error: txError } = await supabase.from('wallet_transactions').insert({
      user_id: userId,
      type: 'admin_credit',
      amount: amount,
      balance_after: newBalance,
      description: description || `Admin credited ${amount} capsules`,
      reference_type: 'admin_action',
    });

    if (txError) {
      console.error('Failed to record transaction:', txError);
      // Don't fail the whole operation, just log it
    }

    toast.success(`Credited ${amount} capsules`);
    await fetchAllData();
    return true;
  };

  // Debit/Remove capsules from user (admin only)
  const debitCapsules = async (userId: string, amount: number, description?: string) => {
    const trust = trustScores.find(t => t.user_id === userId);
    if (!trust) {
      toast.error('User trust score not found');
      return false;
    }
    
    if (trust.total_capsules_earned < amount) {
      toast.error('Insufficient balance');
      return false;
    }
    
    const newBalance = trust.total_capsules_earned - amount;
    
    const { error: updateError } = await supabase.from('user_trust_scores').update({
      total_capsules_earned: newBalance,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
    
    if (updateError) {
      console.error('Failed to debit capsules:', updateError);
      toast.error('Failed to debit capsules');
      return false;
    }

    // Add wallet transaction record
    const { error: txError } = await supabase.from('wallet_transactions').insert({
      user_id: userId,
      type: 'admin_debit',
      amount: -amount,
      balance_after: newBalance,
      description: description || `Admin removed ${amount} capsules`,
      reference_type: 'admin_action',
    });

    if (txError) {
      console.error('Failed to record transaction:', txError);
    }

    toast.success(`Removed ${amount} capsules`);
    await fetchAllData();
    return true;
  };

  // Submissions CRUD
  const approveSubmission = async (id: string, notes?: string) => {
    const { error } = await supabase.from('task_submissions').update({
      status: 'verified',
      verified_at: new Date().toISOString(),
      review_notes: notes,
    }).eq('id', id);
    if (error) {
      toast.error('Failed to approve');
      return false;
    }
    toast.success('Submission approved');
    return true;
  };

  const rejectSubmission = async (id: string, notes: string) => {
    const { error } = await supabase.from('task_submissions').update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    }).eq('id', id);
    if (error) {
      toast.error('Failed to reject');
      return false;
    }
    toast.success('Submission rejected');
    return true;
  };

  const releaseSubmission = async (id: string) => {
    const { error } = await supabase.from('task_submissions').update({
      status: 'released',
      released_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) {
      toast.error('Failed to release');
      return false;
    }
    toast.success('Capsules released');
    return true;
  };

  const deleteSubmission = async (id: string) => {
    const { error } = await supabase.from('task_submissions').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
      return false;
    }
    toast.success('Submission deleted');
    return true;
  };

  const bulkApprove = async (ids: string[], notes?: string) => {
    const { error } = await supabase.from('task_submissions').update({
      status: 'verified',
      verified_at: new Date().toISOString(),
      review_notes: notes || 'Bulk approved',
    }).in('id', ids);
    if (error) {
      toast.error('Failed to bulk approve');
      return false;
    }
    toast.success(`Approved ${ids.length} submissions`);
    return true;
  };

  const bulkReject = async (ids: string[], notes: string) => {
    const { error } = await supabase.from('task_submissions').update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    }).in('id', ids);
    if (error) {
      toast.error('Failed to bulk reject');
      return false;
    }
    toast.success(`Rejected ${ids.length} submissions`);
    return true;
  };

  const bulkRelease = async (ids: string[]) => {
    const { error } = await supabase.from('task_submissions').update({
      status: 'released',
      released_at: new Date().toISOString(),
    }).in('id', ids);
    if (error) {
      toast.error('Failed to bulk release');
      return false;
    }
    toast.success(`Released ${ids.length} submissions`);
    return true;
  };

  // Admin Tasks CRUD
  const createAdminTask = async (task: Omit<AdminTask, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'current_completions' | 'is_active'>) => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('admin_tasks').insert({
      ...task,
      created_by: userData.user?.id,
      is_active: true,
    } as any);
    if (error) {
      toast.error('Failed to create task');
      return false;
    }
    toast.success('Task created');
    return true;
  };

  const updateAdminTask = async (id: string, updates: Partial<AdminTask>) => {
    const { error } = await supabase.from('admin_tasks').update({
      ...updates,
      updated_at: new Date().toISOString(),
    } as any).eq('id', id);
    if (error) {
      toast.error('Failed to update task');
      return false;
    }
    toast.success('Task updated');
    return true;
  };

  const deleteAdminTask = async (id: string) => {
    const { error } = await supabase.from('admin_tasks').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete task');
      return false;
    }
    toast.success('Task deleted');
    return true;
  };

  // Ads CRUD
  const createAd = async (ad: Omit<AdZone, 'id' | 'created_at' | 'updated_at' | 'impressions' | 'clicks' | 'revenue'>) => {
    const { error } = await supabase.from('ad_zones').insert(ad as any);
    if (error) {
      toast.error('Failed to create ad');
      return false;
    }
    toast.success('Ad zone created');
    return true;
  };

  const updateAd = async (id: string, updates: Partial<AdZone>) => {
    const { error } = await supabase.from('ad_zones').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id);
    if (error) {
      toast.error('Failed to update ad');
      return false;
    }
    toast.success('Ad zone updated');
    return true;
  };

  const deleteAd = async (id: string) => {
    const { error } = await supabase.from('ad_zones').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete ad');
      return false;
    }
    toast.success('Ad zone deleted');
    return true;
  };

  const toggleAd = async (id: string, enabled: boolean) => {
    return updateAd(id, { enabled } as any);
  };

  // Settings CRUD - use upsert to handle both create and update
  const updateSetting = async (key: string, value: any): Promise<boolean> => {
    try {
      // Use upsert for atomic create-or-update
      const { error } = await supabase.from('app_settings').upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
      } as any, {
        onConflict: 'key',
      });
      
      if (error) {
        console.error('Failed to save setting:', key, error);
        toast.error(`Failed to save ${key}: ${error.message}`);
        return false;
      }
      
      console.log('Setting saved successfully:', key);
      toast.success(`${key.replace(/_/g, ' ')} saved`);
      
      // Refresh to get latest data
      await fetchAllData();
      return true;
    } catch (err) {
      console.error('Error in updateSetting:', err);
      toast.error('Failed to save setting');
      return false;
    }
  };

  const getSetting = (key: string) => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || null;
  };

  // User with combined data
  const getUsersWithDetails = () => {
    return profiles.map(profile => {
      const userRoles = roles.filter(r => r.user_id === profile.id);
      const trustScore = trustScores.find(t => t.user_id === profile.id);
      const userSubmissions = submissions.filter(s => s.user_id === profile.id);
      
      return {
        ...profile,
        roles: userRoles.map(r => r.role),
        isAdmin: userRoles.some(r => r.role === 'admin'),
        trustScore: trustScore?.trust_score || 50,
        totalCapsules: trustScore?.total_capsules_earned || 0,
        tasksCompleted: trustScore?.total_tasks_completed || 0,
        submissions: userSubmissions,
      };
    });
  };

  return {
    // Data
    profiles,
    roles,
    trustScores,
    submissions,
    adZones,
    settings,
    adminTasks,
    tasks,
    stats,
    isLoading,
    
    // Helpers
    refetch: fetchAllData,
    getUsersWithDetails,
    getSetting,
    
    // Profile actions
    updateProfile,
    suspendUser,
    banUser,
    restrictUser,
    activateUser,
    upgradeToPremiuim,
    downgradeToFree,
    createUser,
    generateAccessToken,
    
    // Role actions
    assignRole,
    removeRole,
    
    // Trust score actions
    updateTrustScore,
    setCooldown,
    slashCapsules,
    creditCapsules,
    debitCapsules,
    
    // Submission actions
    approveSubmission,
    rejectSubmission,
    releaseSubmission,
    deleteSubmission,
    bulkApprove,
    bulkReject,
    bulkRelease,
    
    // Admin task actions
    createAdminTask,
    updateAdminTask,
    deleteAdminTask,
    
    // Ad actions
    createAd,
    updateAd,
    deleteAd,
    toggleAd,
    
    // Settings actions
    updateSetting,
  };
}
