import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { PlatformIcon } from '@/components/PlatformIcon';
import { TaskStatusBadge } from '@/components/TaskStatusBadge';
import { Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface UserTask {
  id: string;
  title: string;
  description: string | null;
  platform: string;
  task_type: string;
  target_url: string;
  capsule_reward: number;
  target_quantity: number;
  completed_quantity: number;
  status: string;
  created_at: string;
}

const MyTasksPage = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserTasks = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching tasks:', error);
          return;
        }

        setTasks(data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTasks();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('user-tasks')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks'
      }, () => {
        fetchUserTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusFromTask = (task: UserTask): 'pending' | 'verified' | 'flagged' => {
    switch (task.status) {
      case 'active': return 'pending';
      case 'completed': return 'verified';
      case 'cancelled': return 'flagged';
      default: return 'pending';
    }
  };

  const activeTasks = tasks.filter(t => t.status === 'active');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const flaggedTasks = tasks.filter(t => t.status === 'cancelled');

  const getTabTasks = () => {
    switch (activeTab) {
      case 'active': return activeTasks;
      case 'completed': return completedTasks;
      case 'flagged': return flaggedTasks;
      default: return activeTasks;
    }
  };

  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('youtube')) return 'youtube';
    if (platformLower.includes('instagram')) return 'instagram';
    if (platformLower.includes('twitter') || platformLower.includes('x')) return 'twitter';
    if (platformLower.includes('tiktok')) return 'music';
    return 'globe';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">My Tasks</h2>
        <p className="text-muted-foreground">Track your promotion campaigns</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeTasks.length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedTasks.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{flaggedTasks.length}</p>
              <p className="text-sm text-muted-foreground">Flagged</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="gap-2">
            Active
            <Badge variant="secondary" className="ml-1">{activeTasks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            Completed
            <Badge variant="secondary" className="ml-1">{completedTasks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="flagged" className="gap-2">
            Flagged
            <Badge variant="secondary" className="ml-1">{flaggedTasks.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {getTabTasks().length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No tasks in this category</p>
                </CardContent>
              </Card>
            ) : (
              getTabTasks().map(task => {
                const completed = task.completed_quantity || 0;
                const target = task.target_quantity || 0;
                const progressPercent = target > 0 ? (completed / target) * 100 : 0;
                
                return (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Platform Info */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <PlatformIcon icon={getPlatformIcon(task.platform)} size={24} />
                          </div>
                          <div>
                            <p className="font-medium">{task.platform}</p>
                            <p className="text-sm text-muted-foreground capitalize">{task.task_type} • {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</p>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span>{completed} / {target}</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-3">
                          <TaskStatusBadge status={task.status} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyTasksPage;
