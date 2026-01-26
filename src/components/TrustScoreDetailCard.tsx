import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { getTrustTier, trustAdjustments, penalties, type TrustConfig } from '@/lib/trust';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Camera,
  Ban,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface TrustScoreDetailCardProps {
  trustScore: number;
  showRules?: boolean;
}

export function TrustScoreDetailCard({ trustScore, showRules = true }: TrustScoreDetailCardProps) {
  const trustTier = getTrustTier(trustScore);
  
  const positiveAdjustments = trustAdjustments.filter(a => a.points > 0);
  const negativeAdjustments = trustAdjustments.filter(a => a.points < 0);

  const getTierColor = (tier: TrustConfig['tier']) => {
    switch (tier) {
      case 'trusted': return 'text-success';
      case 'normal': return 'text-primary';
      case 'restricted': return 'text-warning';
      case 'suspended': return 'text-destructive';
    }
  };

  const getTierIcon = (tier: TrustConfig['tier']) => {
    switch (tier) {
      case 'trusted': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'normal': return <Shield className="w-5 h-5 text-primary" />;
      case 'restricted': return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'suspended': return <Ban className="w-5 h-5 text-destructive" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Trust Score Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getTierIcon(trustTier.tier)}
            <div>
              <TrustScoreBadge score={trustScore} showLabel />
              <p className={`text-sm ${getTierColor(trustTier.tier)}`}>
                {trustTier.label} Tier ({trustTier.minScore}-{trustTier.maxScore})
              </p>
            </div>
          </div>
          <span className="text-3xl font-bold">{trustScore}</span>
        </div>
        
        <Progress 
          value={trustScore} 
          className={`h-3 ${
            trustTier.tier === 'trusted' ? '[&>div]:bg-success' :
            trustTier.tier === 'restricted' ? '[&>div]:bg-warning' :
            trustTier.tier === 'suspended' ? '[&>div]:bg-destructive' : ''
          }`}
        />

        {/* Current Tier Effects */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Current Status Effects</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Timer: {trustTier.timerMultiplier}x</span>
            </div>
            <div className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Pending: {trustTier.pendingDuration}h</span>
            </div>
            <div className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
              <Camera className="w-4 h-4 text-muted-foreground" />
              <span>Screenshots: {trustTier.screenshotRequired ? 'Required' : 'Optional'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
              <Ban className="w-4 h-4 text-muted-foreground" />
              <span>Daily cap: {trustTier.dailyEarningCap ?? 'None'}</span>
            </div>
          </div>
        </div>

        {/* Suspended/Restricted Alerts */}
        {trustTier.tier === 'suspended' && (
          <Alert variant="destructive">
            <Ban className="w-4 h-4" />
            <AlertDescription>
              Your account is suspended. You cannot earn Capsules. Contact support to appeal.
            </AlertDescription>
          </Alert>
        )}

        {trustTier.tier === 'restricted' && (
          <Alert className="border-warning bg-warning/10">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <AlertDescription className="text-warning">
              Your account has restrictions. Complete tasks honestly to improve your score.
            </AlertDescription>
          </Alert>
        )}

        {showRules && (
          <>
            {/* Score Adjustments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Positive */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1 text-success">
                  <TrendingUp className="w-4 h-4" />
                  Score Increases
                </h4>
                <div className="space-y-1">
                  {positiveAdjustments.map((adj) => (
                    <div key={adj.action} className="flex items-center justify-between text-xs p-2 rounded bg-success/5">
                      <span>{adj.description}</span>
                      <Badge variant="secondary" className="text-success">+{adj.points}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Negative */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1 text-destructive">
                  <TrendingDown className="w-4 h-4" />
                  Score Decreases
                </h4>
                <div className="space-y-1">
                  {negativeAdjustments.map((adj) => (
                    <div key={adj.action} className="flex items-center justify-between text-xs p-2 rounded bg-destructive/5">
                      <span>{adj.description}</span>
                      <Badge variant="secondary" className="text-destructive">{adj.points}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Penalties */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Info className="w-4 h-4" />
                Anti-Cheat Penalties
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {penalties.map((penalty) => (
                  <div key={penalty.type} className="p-2 rounded bg-muted/50 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{penalty.label}</span>
                      <Badge variant="outline" className="text-xs">{penalty.value}</Badge>
                    </div>
                    <p className="text-muted-foreground">{penalty.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
