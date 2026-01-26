import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { PlatformIcon } from '@/components/PlatformIcon';
import { useAdminData } from '@/hooks/useAdminData';
import { taskLabels } from '@/lib/economy';
import { platforms } from '@/lib/platforms';
import { CheckCircle, XCircle, Clock, ExternalLink, RefreshCw, Loader2, Flag, Inbox, Plus, Trash2, Edit, Star, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface AdminTask {
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
  created_at: string;
}

export default function TaskModeration() {
  const { 
    submissions, 
    trustScores, 
    adminTasks,
    isLoading, 
    refetch, 
    approveSubmission, 
    rejectSubmission, 
    releaseSubmission,
    createAdminTask,
    updateAdminTask,
    deleteAdminTask,
  } = useAdminData();
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AdminTask | null>(null);
  const [creating, setCreating] = useState(false);

  // New task form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    platform: 'Facebook',
    task_type: 'like',
    target_url: '',
    capsule_reward: 20,
    priority: 1,
    is_promoted: true,
    max_completions: null as number | null,
  });

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    await approveSubmission(id);
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    await rejectSubmission(id, 'Rejected via task moderation');
    setActionLoading(null);
  };

  const handleRelease = async (id: string) => {
    setActionLoading(id);
    await releaseSubmission(id);
    setActionLoading(null);
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.platform) {
      toast.error('Please fill required fields');
      return;
    }
    setCreating(true);
    await createAdminTask(newTask);
    setCreating(false);
    setIsCreateDialogOpen(false);
    setNewTask({
      title: '',
      description: '',
      platform: 'Facebook',
      task_type: 'like',
      target_url: '',
      capsule_reward: 20,
      priority: 1,
      is_promoted: true,
      max_completions: null,
    });
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    setCreating(true);
    await updateAdminTask(editingTask.id, editingTask);
    setCreating(false);
    setEditingTask(null);
  };

  const handleDeleteTask = async (id: string) => {
    setActionLoading(id);
    await deleteAdminTask(id);
    setActionLoading(null);
  };

  const handleToggleActive = async (task: AdminTask) => {
    await updateAdminTask(task.id, { is_active: !task.is_active });
  };

  // Group submissions by status
  const pendingTasks = submissions.filter(t => t.status === 'pending');
  const verifiedTasks = submissions.filter(t => t.status === 'verified');
  const rejectedTasks = submissions.filter(t => t.status === 'rejected');

  const getUserTrustScore = (userId: string | null) => {
    if (!userId) return 50;
    const trust = trustScores.find(t => t.user_id === userId);
    return trust?.trust_score || 50;
  };

  const TaskTable = ({ data }: { data: typeof submissions }) => {
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Inbox className="w-12 h-12 mb-2" />
          <p>No tasks in this category</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Platform</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Reward</TableHead>
            <TableHead>Trust</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <PlatformIcon icon={task.platform.toLowerCase()} size={16} />
                  <span className="text-sm">{task.platform}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {taskLabels[task.task_type as keyof typeof taskLabels] || task.task_type}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium">@{task.platform_username}</span>
              </TableCell>
              <TableCell>
                <CapsuleBadge amount={task.capsules_earned} size="sm" />
              </TableCell>
              <TableCell>
                <TrustScoreBadge score={getUserTrustScore(task.user_id)} />
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {task.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleApprove(task.id)}
                        disabled={actionLoading === task.id}
                      >
                        {actionLoading === task.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-success" />
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleReject(task.id)}
                        disabled={actionLoading === task.id}
                      >
                        <XCircle className="w-4 h-4 text-destructive" />
                      </Button>
                    </>
                  )}
                  {task.status === 'verified' && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleRelease(task.id)}
                      disabled={actionLoading === task.id}
                    >
                      {actionLoading === task.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </Button>
                  )}
                  {task.screenshot_url && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={task.screenshot_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Task Moderation</h2>
          <p className="text-muted-foreground">Review submissions and manage admin tasks</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
          <Button variant="outline" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto text-warning mb-2" />
            <p className="text-2xl font-bold">{pendingTasks.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Flag className="w-6 h-6 mx-auto text-destructive mb-2" />
            <p className="text-2xl font-bold">{rejectedTasks.length}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-success mb-2" />
            <p className="text-2xl font-bold">{verifiedTasks.length}</p>
            <p className="text-xs text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-6 h-6 mx-auto text-capsule mb-2" />
            <p className="text-2xl font-bold">{adminTasks.length}</p>
            <p className="text-xs text-muted-foreground">Admin Tasks</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="admin-tasks">Admin Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>User Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending">
                <TabsList>
                  <TabsTrigger value="pending">
                    Pending ({pendingTasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="verified">
                    Verified ({verifiedTasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Rejected ({rejectedTasks.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                  <TaskTable data={pendingTasks} />
                </TabsContent>
                <TabsContent value="verified" className="mt-4">
                  <TaskTable data={verifiedTasks} />
                </TabsContent>
                <TabsContent value="rejected" className="mt-4">
                  <TaskTable data={rejectedTasks} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin-tasks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Admin-Created Tasks</CardTitle>
                  <CardDescription>High-priority promoted tasks created by admin</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Completions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No admin tasks created yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    adminTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {task.title}
                              {task.is_promoted && <Star className="w-4 h-4 text-capsule fill-capsule" />}
                            </p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">{task.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PlatformIcon icon={task.platform.toLowerCase()} size={16} />
                            <span className="text-sm">{task.platform}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <CapsuleBadge amount={task.capsule_reward} size="sm" />
                        </TableCell>
                        <TableCell>
                          <Badge variant={task.priority >= 3 ? 'default' : 'secondary'}>
                            P{task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {task.current_completions}
                            {task.max_completions && ` / ${task.max_completions}`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={task.is_active}
                            onCheckedChange={() => handleToggleActive(task)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => setEditingTask(task)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleDeleteTask(task.id)}
                              disabled={actionLoading === task.id}
                            >
                              {actionLoading === task.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 text-destructive" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Admin Task</DialogTitle>
            <DialogDescription>
              Create a high-priority promoted task with unlimited completions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              <Label>Task Title *</Label>
              <Input
                placeholder="e.g., Like our new post"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform *</Label>
                <Select
                  value={newTask.platform}
                  onValueChange={(value) => setNewTask({ ...newTask, platform: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => (
                      <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Task Type *</Label>
                <Select
                  value={newTask.task_type}
                  onValueChange={(value) => setNewTask({ ...newTask, task_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="like">Like</SelectItem>
                    <SelectItem value="comment">Comment</SelectItem>
                    <SelectItem value="follow">Follow</SelectItem>
                    <SelectItem value="stream">Stream/Watch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Target URL</Label>
              <Input
                placeholder="https://..."
                value={newTask.target_url}
                onChange={(e) => setNewTask({ ...newTask, target_url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capsule Reward</Label>
                <Input
                  type="number"
                  value={newTask.capsule_reward}
                  onChange={(e) => setNewTask({ ...newTask, capsule_reward: parseInt(e.target.value) || 20 })}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority (1-5)</Label>
                <Input
                  type="number"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })}
                  min={1}
                  max={5}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Max Completions (leave empty for unlimited)</Label>
              <Input
                type="number"
                value={newTask.max_completions || ''}
                onChange={(e) => setNewTask({ ...newTask, max_completions: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Unlimited"
                min={1}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newTask.is_promoted}
                onCheckedChange={(checked) => setNewTask({ ...newTask, is_promoted: checked })}
              />
              <Label>Promoted (shown first)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                <Label>Task Title</Label>
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capsule Reward</Label>
                  <Input
                    type="number"
                    value={editingTask.capsule_reward}
                    onChange={(e) => setEditingTask({ ...editingTask, capsule_reward: parseInt(e.target.value) || 20 })}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority (1-5)</Label>
                  <Input
                    type="number"
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })}
                    min={1}
                    max={5}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingTask.is_promoted}
                  onCheckedChange={(checked) => setEditingTask({ ...editingTask, is_promoted: checked })}
                />
                <Label>Promoted</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
            <Button onClick={handleUpdateTask} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Update Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
