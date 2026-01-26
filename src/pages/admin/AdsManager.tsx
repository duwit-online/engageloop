import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAdminData } from '@/hooks/useAdminData';
import { Megaphone, Plus, Eye, MousePointer, DollarSign, RefreshCw, Loader2, Trash2, Edit } from 'lucide-react';

export default function AdsManager() {
  const { adZones, isLoading, refetch, createAd, updateAd, deleteAd, toggleAd } = useAdminData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    placement: 'sidebar' as 'header' | 'sidebar' | 'footer' | 'inline' | 'interstitial',
    type: 'script' as 'script' | 'link' | 'banner',
    content: '',
    provider: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      placement: 'sidebar',
      type: 'script',
      content: '',
      provider: '',
    });
    setEditingAd(null);
  };

  const handleSubmit = async () => {
    setSaving(true);
    if (editingAd) {
      await updateAd(editingAd.id, formData);
    } else {
      await createAd({ ...formData, enabled: true });
    }
    setSaving(false);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (ad: any) => {
    setFormData({
      name: ad.name,
      placement: ad.placement,
      type: ad.type,
      content: ad.content,
      provider: ad.provider || '',
    });
    setEditingAd(ad);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteAd(deleteId);
      setDeleteId(null);
    }
  };

  const totalRevenue = adZones.reduce((sum, ad) => sum + Number(ad.revenue || 0), 0);
  const totalImpressions = adZones.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
  const totalClicks = adZones.reduce((sum, ad) => sum + (ad.clicks || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Ads Manager</h2>
          <p className="text-muted-foreground">Manage ad zones and providers (Free users only)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Add Ad Zone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAd ? 'Edit Ad Zone' : 'Create Ad Zone'}</DialogTitle>
                <DialogDescription>
                  {editingAd ? 'Update the ad zone configuration' : 'Add a new ad placement'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="Ad zone name" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Placement</Label>
                    <Select 
                      value={formData.placement} 
                      onValueChange={(v) => setFormData({ ...formData, placement: v as any })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="header">Header</SelectItem>
                        <SelectItem value="sidebar">Sidebar</SelectItem>
                        <SelectItem value="footer">Footer</SelectItem>
                        <SelectItem value="inline">Inline</SelectItem>
                        <SelectItem value="interstitial">Interstitial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(v) => setFormData({ ...formData, type: v as any })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="script">Script</SelectItem>
                        <SelectItem value="link">Link</SelectItem>
                        <SelectItem value="banner">Banner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Input 
                    value={formData.provider} 
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })} 
                    placeholder="e.g., AdSense, Adsterra" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content (Script/Link/HTML)</Label>
                  <Textarea 
                    value={formData.content} 
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                    placeholder="Paste ad code or URL" 
                    rows={4} 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!formData.name || !formData.content || saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingAd ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{adZones.length}</p>
              <p className="text-xs text-muted-foreground">Ad Zones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Impressions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Clicks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-capsule/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-capsule" />
            </div>
            <div>
              <p className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ad Zones */}
      {adZones.length === 0 ? (
        <Card className="py-12">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Megaphone className="w-12 h-12" />
            <p>No ad zones yet</p>
            <p className="text-sm">Create your first ad zone to start monetizing</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {adZones.map((ad) => (
            <Card key={ad.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{ad.name}</CardTitle>
                  </div>
                  <Switch 
                    checked={ad.enabled} 
                    onCheckedChange={(checked) => toggleAd(ad.id, checked)} 
                  />
                </div>
                <CardDescription>
                  {ad.provider || 'Custom'} • {ad.placement} • {ad.type}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span>{(ad.impressions || 0).toLocaleString()} impressions</span>
                  <span>{(ad.clicks || 0).toLocaleString()} clicks</span>
                  <span className="text-success font-medium">₦{Number(ad.revenue || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={ad.enabled ? 'default' : 'secondary'}>
                    {ad.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(ad)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(ad.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ad Zone?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the ad zone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
