import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminData } from '@/hooks/useAdminData';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { DollarSign, Package, Plus, Edit, Trash2, RefreshCw, Loader2, Save, Star } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';

interface CapsulePackage {
  id: string;
  capsules: number;
  price: number;
  label: string;
  featured?: boolean;
}

export default function PricingManager() {
  const { settings, isLoading, refetch, updateSetting, getSetting } = useAdminData();
  const [saving, setSaving] = useState(false);
  const [packages, setPackages] = useState<CapsulePackage[]>([]);
  const [editingPackage, setEditingPackage] = useState<CapsulePackage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPackage, setNewPackage] = useState<CapsulePackage>({
    id: '',
    capsules: 100,
    price: 500,
    label: '',
    featured: false,
  });

  // Premium pricing
  const [pricing, setPricing] = useState({
    monthly: 3000,
    quarterly_discount: 0.1,
    biannual_discount: 0.15,
    annual_discount: 0.25,
  });

  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (settings.length > 0 && !dataLoaded) {
      const pricingData = getSetting('premium_pricing');
      const packagesData = getSetting('capsule_packages');
      if (pricingData) setPricing(pricingData as typeof pricing);
      if (packagesData) setPackages(packagesData as unknown as CapsulePackage[]);
      setDataLoaded(true);
    }
  }, [settings, getSetting, dataLoaded]);

  const handleRefresh = async () => {
    setDataLoaded(false);
    await refetch();
    toast.success('Pricing refreshed');
  };

  const handleSavePricing = async () => {
    setSaving(true);
    const success = await updateSetting('premium_pricing', pricing);
    if (!success) {
      toast.error('Failed to save pricing');
    }
    setSaving(false);
  };

  const handleSavePackages = async () => {
    setSaving(true);
    const success = await updateSetting('capsule_packages', packages);
    if (!success) {
      toast.error('Failed to save packages');
    }
    setSaving(false);
  };

  const handleAddPackage = () => {
    if (!newPackage.label || !newPackage.id) {
      toast.error('Please fill all fields');
      return;
    }
    const updated = [...packages, newPackage];
    setPackages(updated);
    setNewPackage({ id: '', capsules: 100, price: 500, label: '', featured: false });
    setIsDialogOpen(false);
    toast.success('Package added - click Save to persist');
  };

  const handleUpdatePackage = () => {
    if (!editingPackage) return;
    const updated = packages.map(p => p.id === editingPackage.id ? editingPackage : p);
    setPackages(updated);
    setEditingPackage(null);
    toast.success('Package updated - click Save to persist');
  };

  const handleDeletePackage = (id: string) => {
    const updated = packages.filter(p => p.id !== id);
    setPackages(updated);
    toast.success('Package removed - click Save to persist');
  };

  const toggleFeatured = (id: string) => {
    const updated = packages.map(p => ({
      ...p,
      featured: p.id === id ? !p.featured : false,
    }));
    setPackages(updated);
  };

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
            <DollarSign className="w-6 h-6 text-capsule" />
            Pricing Manager
          </h1>
          <p className="text-muted-foreground">Manage subscription pricing and capsule packages</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Subscription Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Premium Subscription Pricing (NGN)
          </CardTitle>
          <CardDescription>Configure subscription pricing and discounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Monthly Price (₦)</Label>
              <Input
                type="number"
                value={pricing.monthly}
                onChange={(e) => setPricing({ ...pricing, monthly: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Quarterly Discount (%)</Label>
              <Input
                type="number"
                value={Math.round(pricing.quarterly_discount * 100)}
                onChange={(e) => setPricing({ ...pricing, quarterly_discount: (parseInt(e.target.value) || 0) / 100 })}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Biannual Discount (%)</Label>
              <Input
                type="number"
                value={Math.round(pricing.biannual_discount * 100)}
                onChange={(e) => setPricing({ ...pricing, biannual_discount: (parseInt(e.target.value) || 0) / 100 })}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Annual Discount (%)</Label>
              <Input
                type="number"
                value={Math.round(pricing.annual_discount * 100)}
                onChange={(e) => setPricing({ ...pricing, annual_discount: (parseInt(e.target.value) || 0) / 100 })}
                max={100}
              />
            </div>
          </div>

          <Separator />

          {/* Preview */}
          <div>
            <Label className="mb-3 block">Price Preview</Label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Monthly</p>
                <p className="text-xl font-bold">{formatCurrency(pricing.monthly, 'NGN')}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Quarterly (3mo)</p>
                <p className="text-xl font-bold">{formatCurrency(getPrice(3, pricing.quarterly_discount), 'NGN')}</p>
                <p className="text-xs text-success">Save {formatCurrency(pricing.monthly * 3 - getPrice(3, pricing.quarterly_discount), 'NGN')}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Biannual (6mo)</p>
                <p className="text-xl font-bold">{formatCurrency(getPrice(6, pricing.biannual_discount), 'NGN')}</p>
                <p className="text-xs text-success">Save {formatCurrency(pricing.monthly * 6 - getPrice(6, pricing.biannual_discount), 'NGN')}</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-sm text-primary">Annual (12mo)</p>
                <p className="text-xl font-bold">{formatCurrency(getPrice(12, pricing.annual_discount), 'NGN')}</p>
                <p className="text-xs text-success">Save {formatCurrency(pricing.monthly * 12 - getPrice(12, pricing.annual_discount), 'NGN')}</p>
              </div>
            </div>
          </div>

          <Button onClick={handleSavePricing} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Subscription Pricing
          </Button>
        </CardContent>
      </Card>

      {/* Capsule Packages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Capsule Top-Up Packages
              </CardTitle>
              <CardDescription>Manage one-time capsule purchase options</CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Package
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Capsules</TableHead>
                <TableHead>Price (₦)</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No packages configured
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-mono text-sm">{pkg.id}</TableCell>
                    <TableCell className="font-medium">{pkg.label}</TableCell>
                    <TableCell>
                      <CapsuleBadge amount={pkg.capsules} size="sm" />
                    </TableCell>
                    <TableCell>{formatCurrency(pkg.price, 'NGN')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={pkg.featured}
                          onCheckedChange={() => toggleFeatured(pkg.id)}
                        />
                        {pkg.featured && <Star className="w-4 h-4 text-capsule fill-capsule" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditingPackage(pkg)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeletePackage(pkg.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="mt-4">
            <Button onClick={handleSavePackages} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Packages
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Package Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Capsule Package</DialogTitle>
            <DialogDescription>Create a new top-up package</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Package ID</Label>
              <Input
                placeholder="e.g., mega_pack"
                value={newPackage.id}
                onChange={(e) => setNewPackage({ ...newPackage, id: e.target.value.toLowerCase().replace(/\s/g, '_') })}
              />
            </div>
            <div className="space-y-2">
              <Label>Display Label</Label>
              <Input
                placeholder="e.g., Mega Pack"
                value={newPackage.label}
                onChange={(e) => setNewPackage({ ...newPackage, label: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capsules</Label>
                <Input
                  type="number"
                  value={newPackage.capsules}
                  onChange={(e) => setNewPackage({ ...newPackage, capsules: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Price (₦)</Label>
                <Input
                  type="number"
                  value={newPackage.price}
                  onChange={(e) => setNewPackage({ ...newPackage, price: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newPackage.featured}
                onCheckedChange={(checked) => setNewPackage({ ...newPackage, featured: checked })}
              />
              <Label>Featured (Best Value)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPackage}>Add Package</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={!!editingPackage} onOpenChange={() => setEditingPackage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Package</DialogTitle>
            <DialogDescription>Update package details</DialogDescription>
          </DialogHeader>
          {editingPackage && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Display Label</Label>
                <Input
                  value={editingPackage.label}
                  onChange={(e) => setEditingPackage({ ...editingPackage, label: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capsules</Label>
                  <Input
                    type="number"
                    value={editingPackage.capsules}
                    onChange={(e) => setEditingPackage({ ...editingPackage, capsules: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (₦)</Label>
                  <Input
                    type="number"
                    value={editingPackage.price}
                    onChange={(e) => setEditingPackage({ ...editingPackage, price: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPackage(null)}>Cancel</Button>
            <Button onClick={handleUpdatePackage}>Update Package</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
