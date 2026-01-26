import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { PlatformIcon } from '@/components/PlatformIcon';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { useAdminRealtime } from '@/hooks/useAdminRealtime';
import { formatDistanceToNow } from 'date-fns';
import {
  Users,
  ClipboardCheck,
  Shield,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  Activity,
  AlertTriangle,
  Inbox,
  Eye,
  CheckCheck,
  Search,
  Zap,
} from 'lucide-react';

const AdminOverview = () => {
  const {
    submissions,
    users,
    trustScores,
    isLoading,
    refetch,
    approveSubmission,
    rejectSubmission,
    releaseSubmission,
  } = useAdminRealtime();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const verifiedSubmissions = submissions.filter(s => s.status === 'verified');
  const releasedSubmissions = submissions.filter(s => s.status === 'released');
  const rejectedSubmissions = submissions.filter(s => s.status === 'rejected');

  const stats = {
    totalUsers: users.length,
    activeSubmissions: submissions.length,
    pending: pendingSubmissions.length,
    verified: verifiedSubmissions.length,
    released: releasedSubmissions.length,
    rejected: rejectedSubmissions.length,
    totalCapsules: trustScores.reduce((sum, t) => sum + (t.total_capsules_earned || 0), 0),
  };

  const handleQuickApprove = async (id: string) => {
    setActionLoading(id);
    await approveSubmission(id);
    setActionLoading(null);
  };

  const handleQuickReject = async (id: string) => {
    setActionLoading(id);
    await rejectSubmission(id, 'Quick rejection from overview');
    setActionLoading(null);
  };

  const handleQuickRelease = async (id: string) => {
    setActionLoading(id);
    await releaseSubmission(id);
    setActionLoading(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'verified': return 'bg-success/10 text-success border-success/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'released': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Real-Time Control Center
          </h2>
          <p className="text-sm text-muted-foreground">Live admin dashboard with full CRUD</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Users</p>
              <p className="text-lg font-bold">{stats.totalUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{stats.activeSubmissions}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 border-warning/30">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning" />
            <div>
              <p className="text-xs text-warning">Pending</p>
              <p className="text-lg font-bold text-warning">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 border-success/30">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <div>
              <p className="text-xs text-success">Verified</p>
              <p className="text-lg font-bold text-success">{stats.verified}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 border-primary/30">
          <div className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-primary">Released</p>
              <p className="text-lg font-bold text-primary">{stats.released}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 border-destructive/30">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-destructive" />
            <div>
              <p className="text-xs text-destructive">Rejected</p>
              <p className="text-lg font-bold text-destructive">{stats.rejected}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-capsule" />
            <div>
              <p className="text-xs text-muted-foreground">Capsules</p>
              <CapsuleBadge amount={stats.totalCapsules} size="sm" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="pending" className="text-xs sm:text-sm">
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="verified" className="text-xs sm:text-sm">
            Verified ({stats.verified})
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm">
            Users ({stats.totalUsers})
          </TabsTrigger>
          <TabsTrigger value="trust" className="text-xs sm:text-sm">
            Trust Scores
          </TabsTrigger>
        </TabsList>

        {/* Pending Submissions */}
        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : pendingSubmissions.length === 0 ? (
            <Card className="py-8">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Inbox className="w-10 h-10" />
                <p className="text-sm">No pending submissions</p>
              </div>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {pendingSubmissions.map((submission) => (
                  <Card key={submission.id} className="p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <PlatformIcon icon={submission.platform?.toLowerCase() || 'tiktok'} size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">@{submission.platform_username}</p>
                          <p className="text-xs text-muted-foreground">
                            {submission.task_type} • {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CapsuleBadge amount={submission.capsules_earned} size="sm" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-success hover:text-success h-8"
                          onClick={() => handleQuickApprove(submission.id)}
                          disabled={actionLoading === submission.id}
                        >
                          {actionLoading === submission.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive h-8"
                          onClick={() => handleQuickReject(submission.id)}
                          disabled={actionLoading === submission.id}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Verified Submissions */}
        <TabsContent value="verified" className="mt-4">
          {verifiedSubmissions.length === 0 ? (
            <Card className="py-8">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Inbox className="w-10 h-10" />
                <p className="text-sm">No verified submissions awaiting release</p>
              </div>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {verifiedSubmissions.map((submission) => (
                  <Card key={submission.id} className="p-3 border-success/20">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <CheckCircle className="w-5 h-5 text-success shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">@{submission.platform_username}</p>
                          <p className="text-xs text-muted-foreground">
                            {submission.task_type} • Verified {formatDistanceToNow(new Date(submission.verified_at || submission.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CapsuleBadge amount={submission.capsules_earned} size="sm" />
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-primary hover:bg-primary/90 h-8"
                          onClick={() => handleQuickRelease(submission.id)}
                          disabled={actionLoading === submission.id}
                        >
                          {actionLoading === submission.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCheck className="w-4 h-4 mr-1" />
                              Release
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="mt-4">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {users.length === 0 ? (
            <Card className="py-8">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Users className="w-10 h-10" />
                <p className="text-sm">No users found</p>
              </div>
            </Card>
          ) : (
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {users
                  .filter(u => 
                    (u.display_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                    (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                  )
                  .map((user) => {
                    const userTrust = trustScores.find(t => t.user_id === user.id);
                    return (
                      <Card key={user.id} className="p-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                              {(user.display_name || user.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{user.display_name || 'No name'}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {userTrust && (
                              <>
                                <TrustScoreBadge score={userTrust.trust_score} />
                                <CapsuleBadge amount={userTrust.total_capsules_earned || 0} size="sm" />
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Trust Scores */}
        <TabsContent value="trust" className="mt-4">
          {trustScores.length === 0 ? (
            <Card className="py-8">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Shield className="w-10 h-10" />
                <p className="text-sm">No trust scores found</p>
              </div>
            </Card>
          ) : (
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {trustScores.map((trust) => {
                  const user = users.find(u => u.id === trust.user_id);
                  return (
                    <Card key={trust.id} className="p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Shield className="w-5 h-5 text-primary shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {user?.display_name || trust.identifier || 'Unknown User'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {trust.total_tasks_completed || 0} tasks • {trust.total_tasks_rejected || 0} rejected
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrustScoreBadge score={trust.trust_score} />
                          <CapsuleBadge amount={trust.total_capsules_earned || 0} size="sm" />
                          {trust.cooldown_until && new Date(trust.cooldown_until) > new Date() && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Cooldown
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Real-time indicator */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <p className="text-xs text-muted-foreground">
            Live updates enabled • Changes sync in real-time
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
