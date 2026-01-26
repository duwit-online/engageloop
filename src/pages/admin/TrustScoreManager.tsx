import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { useAdminData } from '@/hooks/useAdminData';
import { getTrustTier } from '@/lib/trust';
import { formatDistanceToNow } from 'date-fns';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Edit,
  Clock,
  Loader2,
  RefreshCw,
  Timer,
  Minus,
  Users,
  TrendingDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function TrustScoreManager() {
  const { trustScores, profiles, isLoading, refetch, updateTrustScore, setCooldown, slashCapsules } = useAdminData();

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [newScore, setNewScore] = useState(50);
  const [cooldownHours, setCooldownHours] = useState(24);
  const [slashAmount, setSlashAmount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleUpdateScore = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    await updateTrustScore(selectedUser.id, newScore);
    setSelectedUser(null);
    setActionLoading(false);
  };

  const handleSetCooldown = async (user: any) => {
    setActionLoading(true);
    await setCooldown(user.id, cooldownHours);
    setActionLoading(false);
  };

  const handleClearCooldown = async (user: any) => {
    setActionLoading(true);
    await setCooldown(user.id, 0);
    setActionLoading(false);
  };

  const handleSlash = async (user: any) => {
    if (slashAmount <= 0) return;
    setActionLoading(true);
    await slashCapsules(user.id, slashAmount);
    setSlashAmount(0);
    setActionLoading(false);
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'trusted': return <ShieldCheck className="w-4 h-4 text-success" />;
      case 'normal': return <Shield className="w-4 h-4 text-primary" />;
      case 'restricted': return <ShieldAlert className="w-4 h-4 text-warning" />;
      case 'suspended': return <ShieldX className="w-4 h-4 text-destructive" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'trusted': return 'bg-success/10 text-success border-success/20';
      case 'normal': return 'bg-primary/10 text-primary border-primary/20';
      case 'restricted': return 'bg-warning/10 text-warning border-warning/20';
      case 'suspended': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getUserEmail = (userId: string | null) => {
    if (!userId) return 'Anonymous';
    const profile = profiles.find(p => p.id === userId);
    return profile?.email || profile?.display_name || userId.slice(0, 8) + '...';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Trust Score Manager</h1>
          <p className="text-sm text-muted-foreground">Manage user trust scores and apply penalties</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Users</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold mt-1">{trustScores.length}</div>
        </Card>
        <Card className="p-3 border-success/30">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span className="text-xs text-success">Trusted</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold mt-1 text-success">
            {trustScores.filter(t => getTrustTier(t.trust_score).tier === 'trusted').length}
          </div>
        </Card>
        <Card className="p-3 border-warning/30">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-warning" />
            <span className="text-xs text-warning">Restricted</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold mt-1 text-warning">
            {trustScores.filter(t => getTrustTier(t.trust_score).tier === 'restricted').length}
          </div>
        </Card>
        <Card className="p-3 border-destructive/30">
          <div className="flex items-center gap-2">
            <ShieldX className="w-4 h-4 text-destructive" />
            <span className="text-xs text-destructive">Suspended</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold mt-1 text-destructive">
            {trustScores.filter(t => getTrustTier(t.trust_score).tier === 'suspended').length}
          </div>
        </Card>
      </div>

      {/* Users List */}
      {trustScores.length === 0 ? (
        <Card className="py-12">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Users className="w-12 h-12" />
            <p>No users with trust scores yet</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {trustScores.map((user) => {
            const tier = getTrustTier(user.trust_score);
            const isExpanded = expandedId === user.id;
            const hasCooldown = user.cooldown_until && new Date(user.cooldown_until) > new Date();

            return (
              <Card key={user.id} className="overflow-hidden">
                <div 
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : user.id)}
                >
                  <div className="shrink-0">
                    <TrustScoreBadge score={user.trust_score} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">
                        {getUserEmail(user.user_id)}
                      </span>
                      <Badge className={`${getTierColor(tier.tier)} text-xs gap-1`}>
                        {getTierIcon(tier.tier)}
                        {tier.label}
                      </Badge>
                      {hasCooldown && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Timer className="w-3 h-3" />
                          Cooldown
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{user.total_tasks_completed} completed</span>
                      <span>{user.total_tasks_rejected} rejected</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <CapsuleBadge amount={user.total_capsules_earned} size="sm" />
                    {user.total_capsules_slashed > 0 && (
                      <span className="text-xs text-destructive flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        -{user.total_capsules_slashed}
                      </span>
                    )}
                  </div>

                  <div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t bg-muted/30 p-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                          setNewScore(user.trust_score);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Score
                      </Button>
                      {hasCooldown ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleClearCooldown(user); }}
                          disabled={actionLoading}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Clear Cooldown
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleSetCooldown(user); }}
                          disabled={actionLoading}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Set {cooldownHours}h Cooldown
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Cooldown Duration: {cooldownHours}h</label>
                      <Slider
                        value={[cooldownHours]}
                        onValueChange={(v) => setCooldownHours(v[0])}
                        min={1}
                        max={72}
                        step={1}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Amount to slash"
                        value={slashAmount || ''}
                        onChange={(e) => setSlashAmount(parseInt(e.target.value) || 0)}
                        className="w-32"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleSlash(user); }}
                        disabled={actionLoading || slashAmount <= 0}
                      >
                        <Minus className="w-4 h-4 mr-2" />
                        Slash
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Last task:</span>{' '}
                        {user.last_task_at ? formatDistanceToNow(new Date(user.last_task_at), { addSuffix: true }) : 'Never'}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>{' '}
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </div>
                      {hasCooldown && (
                        <div className="col-span-2">
                          <span className="font-medium text-warning">Cooldown until:</span>{' '}
                          {formatDistanceToNow(new Date(user.cooldown_until!), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Score Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trust Score</DialogTitle>
            <DialogDescription>Adjust the trust score for this user</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Score</span>
                <TrustScoreBadge score={selectedUser.trust_score} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">New Score</span>
                  <span className="text-2xl font-bold">{newScore}</span>
                </div>
                <Slider
                  value={[newScore]}
                  onValueChange={(v) => setNewScore(v[0])}
                  min={0}
                  max={100}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Suspended (0-19)</span>
                  <span>Restricted (20-49)</span>
                  <span>Normal (50-79)</span>
                  <span>Trusted (80+)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                {getTierIcon(getTrustTier(newScore).tier)}
                <span className="text-sm">
                  New tier: <strong>{getTrustTier(newScore).label}</strong>
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
            <Button onClick={handleUpdateScore} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
