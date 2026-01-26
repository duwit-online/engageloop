import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAdminData } from '@/hooks/useAdminData';
import { Coins, TrendingUp, TrendingDown, Users, Activity, RefreshCw, Loader2, Save, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function EconomyManager() {
  const { stats, settings, isLoading, refetch, updateSetting, getSetting, trustScores, submissions } = useAdminData();
  const [saving, setSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Premium pricing
  const [pricing, setPricing] = useState({
    monthly: 3000,
    quarterly_discount: 0.1,
    biannual_discount: 0.15,
    annual_discount: 0.25,
  });

  useEffect(() => {
    if (settings.length > 0 && !dataLoaded) {
      const pricingData = getSetting('premium_pricing');
      if (pricingData) setPricing(pricingData as typeof pricing);
      setDataLoaded(true);
    }
  }, [settings, getSetting, dataLoaded]);

  const handleRefresh = async () => {
    setDataLoaded(false);
    await refetch();
    toast.success('Economy settings refreshed');
  };

  const handleSavePricing = async () => {
    setSaving(true);
    const success = await updateSetting('premium_pricing', pricing);
    if (!success) {
      toast.error('Failed to save pricing');
    }
    setSaving(false);
  };

  // Calculate economy stats
  const totalEarned = trustScores.reduce((sum, t) => sum + t.total_capsules_earned, 0);
  const totalSlashed = trustScores.reduce((sum, t) => sum + t.total_capsules_slashed, 0);
  const totalTasksCompleted = trustScores.reduce((sum, t) => sum + t.total_tasks_completed, 0);
  const pendingCapsules = submissions.filter(s => s.status === 'verified').reduce((sum, s) => sum + s.capsules_earned, 0);

  const getPrice = (months: number, discount: number) => {
    const base = pricing.monthly * months;
    return Math.round(base * (1 - discount));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="w-6 h-6 text-capsule" />
            Economy Manager
          </h1>
          <p className="text-muted-foreground">Monitor and manage the capsule economy</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Economy Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-capsule/10 flex items-center justify-center">
                <Coins className="w-5 h-5 text-capsule" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEarned.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCapsules.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Pending Release</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSlashed.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Slashed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTasksCompleted.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Tasks Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/30">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card className="border-capsule/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto text-capsule mb-2" />
            <p className="text-2xl font-bold">{stats.premiumUsers}</p>
            <p className="text-xs text-muted-foreground">Premium Users</p>
          </CardContent>
        </Card>
        <Card className="border-success/30">
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 mx-auto text-success mb-2" />
            <p className="text-2xl font-bold">{stats.activeUsers}</p>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-6 h-6 mx-auto text-destructive mb-2" />
            <p className="text-2xl font-bold">{stats.suspendedUsers}</p>
            <p className="text-xs text-muted-foreground">Suspended</p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Premium Pricing (NGN)
          </CardTitle>
          <CardDescription>Configure subscription pricing and discounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Monthly Price</Label>
              <Input
                type="number"
                value={pricing.monthly}
                onChange={(e) => setPricing({ ...pricing, monthly: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Quarterly Discount</Label>
              <Input
                type="number"
                value={pricing.quarterly_discount * 100}
                onChange={(e) => setPricing({ ...pricing, quarterly_discount: (parseInt(e.target.value) || 0) / 100 })}
                max={100}
              />
              <p className="text-xs text-muted-foreground">{(pricing.quarterly_discount * 100).toFixed(0)}% off</p>
            </div>
            <div className="space-y-2">
              <Label>Biannual Discount</Label>
              <Input
                type="number"
                value={pricing.biannual_discount * 100}
                onChange={(e) => setPricing({ ...pricing, biannual_discount: (parseInt(e.target.value) || 0) / 100 })}
                max={100}
              />
              <p className="text-xs text-muted-foreground">{(pricing.biannual_discount * 100).toFixed(0)}% off</p>
            </div>
            <div className="space-y-2">
              <Label>Annual Discount</Label>
              <Input
                type="number"
                value={pricing.annual_discount * 100}
                onChange={(e) => setPricing({ ...pricing, annual_discount: (parseInt(e.target.value) || 0) / 100 })}
                max={100}
              />
              <p className="text-xs text-muted-foreground">{(pricing.annual_discount * 100).toFixed(0)}% off</p>
            </div>
          </div>

          <Separator />

          {/* Preview */}
          <div>
            <Label className="mb-3 block">Price Preview</Label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Monthly</p>
                <p className="text-xl font-bold">₦{pricing.monthly.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Quarterly (3mo)</p>
                <p className="text-xl font-bold">₦{getPrice(3, pricing.quarterly_discount).toLocaleString()}</p>
                <p className="text-xs text-success">Save ₦{(pricing.monthly * 3 - getPrice(3, pricing.quarterly_discount)).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Biannual (6mo)</p>
                <p className="text-xl font-bold">₦{getPrice(6, pricing.biannual_discount).toLocaleString()}</p>
                <p className="text-xs text-success">Save ₦{(pricing.monthly * 6 - getPrice(6, pricing.biannual_discount)).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-sm text-primary">Annual (12mo)</p>
                <p className="text-xl font-bold">₦{getPrice(12, pricing.annual_discount).toLocaleString()}</p>
                <p className="text-xs text-success">Save ₦{(pricing.monthly * 12 - getPrice(12, pricing.annual_discount)).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <Button onClick={handleSavePricing} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Pricing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
