import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { useApp } from '@/contexts/AppContext';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { plans } from '@/lib/economy';
import { 
  TrendingUp, 
  ArrowUpRight, 
  Coins, 
  Link2, 
  Users, 
  CheckCircle,
  Zap,
  Clock,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardHome = () => {
  const { user, capsuleBalance } = useApp();
  const { metrics, recentActivity, isLoading } = useDashboardMetrics();
  const plan = plans[user?.plan || 'freemium'];
  
  const usedAllowance = metrics.capsulesSpent;
  const allowancePercent = plan.monthlyAllowance ? Math.min((usedAllowance / plan.monthlyAllowance) * 100, 100) : 0;

  const stats = [
    {
      label: 'Capsules Earned',
      value: metrics.capsulesEarned.toLocaleString(),
      icon: Coins,
      color: 'text-capsule',
    },
    {
      label: 'Tasks Completed',
      value: metrics.tasksCompleted.toString(),
      icon: CheckCircle,
      color: 'text-success',
    },
    {
      label: 'Pending Tasks',
      value: metrics.pendingSubmissions.toString(),
      icon: Clock,
      color: 'text-warning',
    },
    {
      label: 'Capsules Spent',
      value: metrics.capsulesSpent.toString(),
      icon: Users,
      color: 'text-accent',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="border-0 gradient-primary text-primary-foreground overflow-hidden relative">
        <div className="absolute inset-0 bg-primary-foreground/5 opacity-50" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold mb-2 truncate">Welcome back, {user?.name || 'User'}</h2>
              <p className="text-primary-foreground/80">Your live dashboard metrics</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link to="/dashboard/earn">
                <Button variant="glass" className="gap-2 bg-background/20 hover:bg-background/30 border-primary-foreground/20">
                  <Coins className="w-4 h-4" />
                  Earn Capsules
                </Button>
              </Link>
              <Link to="/dashboard/promote">
                <Button variant="glass" className="gap-2 bg-background/20 hover:bg-background/30 border-primary-foreground/20">
                  <Link2 className="w-4 h-4" />
                  Promote Link
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance & Allowance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Capsule Balance</span>
              <TrustScoreBadge score={user?.trustScore || 0} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                <CapsuleBadge amount={capsuleBalance} size="lg" />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Multiplier</p>
                <span className="text-2xl font-bold text-primary">{plan.multiplier}x</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly Allowance Used</span>
                <span>{usedAllowance.toLocaleString()} / {plan.monthlyAllowance.toLocaleString()}</span>
              </div>
              <Progress value={allowancePercent} className="h-2" />
            </div>

            {plan.dailyLimit && (
              <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Daily Spending Limit</p>
                  <p className="text-xs text-muted-foreground">Resets at midnight</p>
                </div>
                <span className="font-semibold">{plan.dailyLimit} Capsules</span>
              </div>
            )}

            {user?.plan === 'freemium' && (
              <Link to="/dashboard/subscription">
                <Button variant="gradient" className="w-full gap-2">
                  <Zap className="w-4 h-4" />
                  Upgrade to Premium for 1.5x Earnings
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No recent activity</p>
                <Link to="/dashboard/earn">
                  <Button variant="link" className="mt-2">Start earning</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'earned' ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'
                    }`}>
                      {activity.type === 'earned' ? '+' : '-'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    <CapsuleBadge 
                      amount={activity.amount} 
                      size="sm" 
                      showPlus={activity.type === 'earned'}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
