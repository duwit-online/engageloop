import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { PlatformIcon } from '@/components/PlatformIcon';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { TaskValidationDialog, type TaskInfo } from '@/components/TaskValidationDialog';
import { PendingCapsulesCard, type PendingCapsule } from '@/components/PendingCapsulesCard';
import { useApp } from '@/contexts/AppContext';
import { taskValues, taskLabels, taskIcons, type TaskType } from '@/lib/economy';
import { getTrustTier } from '@/lib/trust';
import { 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Play,
  Clock,
  CheckCircle,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Ban,
  Loader2,
  Star,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addHours } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type ExtendedTaskInfo = TaskInfo & { source: string };

const iconMap: Record<string, typeof Heart> = {
  heart: Heart,
  'message-circle': MessageCircle,
  'user-plus': UserPlus,
  play: Play,
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  stream: Play,
};

const platformIconMap: Record<string, string> = {
  instagram: 'instagram',
  youtube: 'youtube',
  twitter: 'twitter',
  x: 'twitter',
  tiktok: 'music',
  spotify: 'music-2',
  facebook: 'facebook',
  threads: 'at-sign',
  linkedin: 'linkedin',
};

const EarnCapsulesPage = () => {
  const { addCapsules, user } = useApp();
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<ExtendedTaskInfo | null>(null);
  const [pendingCapsules, setPendingCapsules] = useState<PendingCapsule[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [userTasks, setUserTasks] = useState<ExtendedTaskInfo[]>([]);
  const [adminTasks, setAdminTasks] = useState<Tables<'admin_tasks'>[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const trustScore = user?.trustScore || 50;
  const trustTier = getTrustTier(trustScore);
  const multiplier = user?.plan === 'premium' ? 1.5 : 1;
  const isSuspended = trustTier.tier === 'suspended';
  const isRestricted = trustTier.tier === 'restricted';
  const dailyCap = trustTier.dailyEarningCap;

  const totalPending = pendingCapsules
    .filter(p => p.status === 'pending' || p.status === 'verified')
    .reduce((sum, p) => sum + p.amount, 0);

  // Fetch Admin Tasks directly
  useEffect(() => {
    const fetchAdminTasks = async () => {
      const { data } = await supabase
        .from('admin_tasks')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });
      
      if (data) setAdminTasks(data);
      setTasksLoading(false);
    };

    fetchAdminTasks();
  }, []);

  // Convert admin tasks to TaskInfo format
  const tasksForDisplay = useMemo<ExtendedTaskInfo[]>(() => {
    return adminTasks.map(task => ({
      id: task.id,
      url: task.target_url || '#',
      platform: task.platform.charAt(0).toUpperCase() + task.platform.slice(1),
      platformIcon: platformIconMap[task.platform.toLowerCase()] || 'globe',
      username: task.title,
      type: task.task_type as TaskType,
      reward: task.capsule_reward,
      description: task.description,
      isPromoted: task.is_promoted,
      priority: task.priority,
      source: 'admin', // Mark as admin task
    }));
  }, [adminTasks]);

  // Fetch user-created tasks
  useEffect(() => {
    const fetchUserTasks = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'active')
        .gt('capsule_budget', 0)
        .neq('user_id', user.id) // Don't show own tasks
        .order('created_at', { ascending: false });

      if (data) {
        const mapped: ExtendedTaskInfo[] = data.map((t: Tables<'tasks'>) => ({
          id: t.id,
          url: t.target_url,
          platform: t.platform,
          platformIcon: platformIconMap[t.platform.toLowerCase()] || 'globe',
          username: t.title,
          type: t.task_type as TaskType,
          reward: t.capsule_reward,
          description: t.description,
          isPromoted: false,
          priority: 0,
          source: 'user', // Mark as user task
        }));
        setUserTasks(mapped);
      }
    };

    fetchUserTasks();

    // Subscribe to new tasks
    const channel = supabase
      .channel('public-tasks-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchUserTasks)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const allTasks: ExtendedTaskInfo[] = [...tasksForDisplay, ...userTasks];

  const handleStartTask = (task: ExtendedTaskInfo) => {
    if (isSuspended) {
      toast({
        title: 'Account Suspended',
        description: 'You cannot earn Capsules. Please contact support.',
        variant: 'destructive',
      });
      return;
    }

    if (dailyCap && completedToday >= dailyCap) {
      toast({
        title: 'Daily Limit Reached',
        description: `You've reached your daily earning cap of ${dailyCap} Capsules.`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedTask(task);
  };

  const incrementTaskCompletion = async (task: ExtendedTaskInfo) => {
    try {
      if (task.source === 'admin') {
        const { error } = await supabase
          .from('admin_tasks')
          .update({ current_completions: supabase.raw('current_completions + 1') })
          .eq('id', task.id);
        if (error) throw error;
      } else {
        // For user tasks, increment the completed_quantity
        const { error } = await supabase
          .from('tasks')
          .update({ completed_quantity: supabase.raw('completed_quantity + 1') })
          .eq('id', task.id);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error incrementing task completion:', error);
    }
  };

  const handleTaskComplete = async (
    task: ExtendedTaskInfo,
    state: 'pending' | 'released',
    pendingDuration: number
  ) => {
    const reward = Math.floor(task.reward * multiplier);
    const now = new Date();
    
    // Increment task completion count
    await incrementTaskCompletion(task);
    
    if (state === 'pending') {
      const newPending: PendingCapsule = {
        id: `pending-${Date.now()}`,
        amount: reward,
        taskType: task.type,
        submittedAt: now,
        releaseAt: addHours(now, pendingDuration),
        status: 'pending',
      };
      
      setPendingCapsules(prev => [newPending, ...prev]);
      setCompletedToday(prev => prev + reward);
      
      toast({
        title: 'Task Submitted!',
        description: `${reward} Capsules pending verification (${pendingDuration}h)`,
      });
    } else {
      addCapsules(reward);
      setCompletedToday(prev => prev + reward);
      
      toast({
        title: 'Task Completed!',
        description: `You earned ${reward} Capsules${multiplier > 1 ? ' (1.5x Premium bonus!)' : ''}`,
      });
    }
    
    setSelectedTask(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Earn Capsules</h2>
          <p className="text-sm text-muted-foreground">Complete tasks to earn Capsules</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <TrustScoreBadge score={trustScore} showLabel />
          {multiplier > 1 && (
            <Badge className="gradient-primary text-primary-foreground gap-1 text-xs">
              <Sparkles className="w-3 h-3" />
              1.5x
            </Badge>
          )}
          {dailyCap && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Clock className="w-3 h-3" />
              {completedToday}/{dailyCap}
            </Badge>
          )}
        </div>
      </div>

      {/* Suspended/Restricted Alerts */}
      {isSuspended && (
        <Alert variant="destructive" className="py-2">
          <Ban className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Your account is suspended. You cannot earn Capsules. Contact support.
          </AlertDescription>
        </Alert>
      )}

      {isRestricted && (
        <Alert className="border-warning bg-warning/10 py-2">
          <ShieldAlert className="h-4 w-4 text-warning" />
          <AlertDescription className="text-xs sm:text-sm text-warning">
            Restricted: {trustTier.timerMultiplier}x timers, {trustTier.pendingDuration}h pending
            {dailyCap ? `, ${dailyCap} daily cap` : ''}
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Capsules */}
      {pendingCapsules.length > 0 && (
        <PendingCapsulesCard pendingCapsules={pendingCapsules} totalPending={totalPending} />
      )}

      {/* Task Values Reference */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {(Object.keys(taskValues) as TaskType[]).map((type) => {
              const Icon = iconMap[taskIcons[type]] || iconMap[type];
              return (
                <div key={type} className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  </div>
                  <span className="text-xs sm:text-sm">{taskLabels[type]}</span>
                  <CapsuleBadge amount={Math.floor(taskValues[type] * multiplier)} size="sm" />
                </div>
              );
            })}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 border border-success/20">
              <CheckCircle className="w-3 h-3 text-success" />
              <span className="text-xs sm:text-sm">Combo</span>
              <CapsuleBadge amount={Math.floor(60 * multiplier)} size="sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {tasksLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* No Tasks Available */}
      {!tasksLoading && allTasks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tasks available at the moment. Check back later!</p>
          </CardContent>
        </Card>
      )}

      {/* Task Feed */}
      {!tasksLoading && allTasks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {allTasks.map((task) => {
            const Icon = iconMap[task.type] || Heart;
            const reward = Math.floor(task.reward * multiplier);
            
            return (
              <Card 
                key={task.id} 
                className={`hover:shadow-md transition-all duration-300 hover:border-primary/50 ${
                  isSuspended ? 'opacity-50' : ''
                } ${task.isPromoted ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <PlatformIcon icon={task.platformIcon} size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{task.username}</p>
                        <p className="text-xs text-muted-foreground">{task.platform}</p>
                      </div>
                    </div>
                    <CapsuleBadge amount={reward} size="sm" showPlus />
                  </div>

                  {task.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                  )}

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Icon className="w-3 h-3" />
                      {taskLabels[task.type] || task.type}
                    </Badge>
                    {task.isPromoted && (
                      <Badge className="gap-1 text-xs bg-primary/20 text-primary border-primary/30">
                        <Star className="w-3 h-3" />
                        Featured
                      </Badge>
                    )}
                    {isRestricted && (
                      <Badge variant="secondary" className="gap-1 text-xs text-warning">
                        <AlertTriangle className="w-3 h-3" />
                        Extended
                      </Badge>
                    )}
                  </div>

                  <Button 
                    variant="gradient" 
                    className="w-full"
                    size="sm"
                    onClick={() => handleStartTask(task)}
                    disabled={isSuspended}
                  >
                    {isSuspended ? 'Suspended' : 'Start Task'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Legal Disclaimer */}
      <p className="text-[10px] sm:text-xs text-muted-foreground text-center max-w-2xl mx-auto leading-snug">
        EngageLoop uses community verification and best-effort public signals. We do not access social media accounts, automate actions, or guarantee engagement outcomes.
      </p>

      {/* Task Validation Dialog */}
      <TaskValidationDialog
        task={selectedTask}
        trustScore={trustScore}
        multiplier={multiplier}
        onClose={() => setSelectedTask(null)}
        onComplete={handleTaskComplete}
      />
    </div>
  );
};

export default EarnCapsulesPage;
