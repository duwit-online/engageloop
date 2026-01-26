import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminData } from '@/hooks/useAdminData';
import { availableFonts, Branding, SocialLinks } from '@/hooks/useBranding';
import { Settings, Save, RefreshCw, Loader2, Coins, Shield, Clock, Sparkles, Palette, Type, Image, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { settings, isLoading, refetch, updateSetting, getSetting } = useAdminData();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('rewards');
  const [dataLoaded, setDataLoaded] = useState(false);

  // Task rewards
  const [taskRewards, setTaskRewards] = useState({
    like: 5,
    comment: 10,
    follow: 15,
    stream: 15,
  });

  // Trust thresholds
  const [trustThresholds, setTrustThresholds] = useState({
    suspended: 20,
    restricted: 50,
    normal: 80,
    trusted: 100,
  });

  // Cooldown settings
  const [cooldownSettings, setCooldownSettings] = useState({
    default_hours: 24,
    max_hours: 168,
  });

  // Economy settings
  const [economySettings, setEconomySettings] = useState({
    daily_limit_free: 100,
    monthly_allowance_free: 1500,
    monthly_allowance_premium: 6000,
    premium_multiplier: 1.5,
  });

  // Branding settings with extended options
  const [branding, setBranding] = useState<Branding>({
    app_name: 'EngageLoop',
    logo_url: '',
    favicon_url: '',
    primary_color: '#7c3aed',
    secondary_color: '#06b6d4',
    hero_headline: 'Grow Your Online Presence Through Real Human Engagement',
    hero_subheadline: 'Connect with a community of real users. Share your content, engage with others, and earn Capsules to boost your reach—no bots, no automation.',
    footer_disclaimer: 'EngageLoop does not automate actions or access social media accounts. All engagements are performed manually by real users.',
    font_heading: 'Space Grotesk',
    font_body: 'Inter',
    background_image: '',
    background_overlay: true,
    social_links: {},
  });

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});

  // Load settings from database
  useEffect(() => {
    if (settings.length > 0 && !dataLoaded) {
      const rewards = getSetting('task_rewards');
      const thresholds = getSetting('trust_thresholds');
      const cooldown = getSetting('cooldown_settings');
      const economy = getSetting('economy_settings');
      const brandingData = getSetting('branding');

      if (rewards) setTaskRewards(rewards as typeof taskRewards);
      if (thresholds) setTrustThresholds(thresholds as typeof trustThresholds);
      if (cooldown) setCooldownSettings(cooldown as typeof cooldownSettings);
      if (economy) setEconomySettings(economy as typeof economySettings);
      if (brandingData) {
        const b = brandingData as unknown as Branding;
        setBranding(b);
        setSocialLinks(b.social_links || {});
      }
      setDataLoaded(true);
    }
  }, [settings, getSetting, dataLoaded]);

  const handleRefresh = async () => {
    setDataLoaded(false);
    await refetch();
    toast.success('Settings refreshed');
  };

  const handleSaveRewards = async () => {
    setSaving(true);
    const success = await updateSetting('task_rewards', taskRewards);
    if (!success) {
      toast.error('Failed to save rewards');
    }
    setSaving(false);
  };

  const handleSaveTrust = async () => {
    setSaving(true);
    const success = await updateSetting('trust_thresholds', trustThresholds);
    if (!success) {
      toast.error('Failed to save trust settings');
    }
    setSaving(false);
  };

  const handleSaveCooldown = async () => {
    setSaving(true);
    const success = await updateSetting('cooldown_settings', cooldownSettings);
    if (!success) {
      toast.error('Failed to save cooldown settings');
    }
    setSaving(false);
  };

  const handleSaveEconomy = async () => {
    setSaving(true);
    const success = await updateSetting('economy_settings', economySettings);
    if (!success) {
      toast.error('Failed to save economy settings');
    }
    setSaving(false);
  };

  const handleSaveBranding = async () => {
    setSaving(true);
    const brandingWithSocial = { ...branding, social_links: socialLinks };
    const success = await updateSetting('branding', brandingWithSocial);
    if (!success) {
      toast.error('Failed to save branding');
    }
    setSaving(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const brandingWithSocial = { ...branding, social_links: socialLinks };
      await Promise.all([
        updateSetting('task_rewards', taskRewards),
        updateSetting('trust_thresholds', trustThresholds),
        updateSetting('cooldown_settings', cooldownSettings),
        updateSetting('economy_settings', economySettings),
        updateSetting('branding', brandingWithSocial),
      ]);
      toast.success('All settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
    setSaving(false);
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
            <Settings className="w-6 h-6" />
            System Settings
          </h1>
          <p className="text-muted-foreground">Configure app settings, branding, and economy</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleSaveAll} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save All
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="trust">Trust</TabsTrigger>
          <TabsTrigger value="cooldown">Cooldown</TabsTrigger>
          <TabsTrigger value="economy">Economy</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        {/* Task Rewards Tab */}
        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-capsule" />
                Task Rewards
              </CardTitle>
              <CardDescription>Capsule rewards per task type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(taskRewards).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="capitalize">{key.replace('_', ' ')}</Label>
                    <span className="text-sm font-medium">{value} capsules</span>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={([v]) => setTaskRewards(prev => ({ ...prev, [key]: v }))}
                    min={1}
                    max={50}
                    step={1}
                  />
                </div>
              ))}
              <Button onClick={handleSaveRewards} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Rewards
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trust Thresholds Tab */}
        <TabsContent value="trust">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Trust Score Thresholds
              </CardTitle>
              <CardDescription>Define tier boundaries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-destructive">Suspended (0 - {trustThresholds.suspended - 1})</Label>
                  <span className="text-sm font-medium">{trustThresholds.suspended}</span>
                </div>
                <Slider
                  value={[trustThresholds.suspended]}
                  onValueChange={([v]) => setTrustThresholds({ ...trustThresholds, suspended: v })}
                  min={10}
                  max={30}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-warning">Restricted ({trustThresholds.suspended} - {trustThresholds.restricted - 1})</Label>
                  <span className="text-sm font-medium">{trustThresholds.restricted}</span>
                </div>
                <Slider
                  value={[trustThresholds.restricted]}
                  onValueChange={([v]) => setTrustThresholds({ ...trustThresholds, restricted: v })}
                  min={40}
                  max={60}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-primary">Normal ({trustThresholds.restricted} - {trustThresholds.normal - 1})</Label>
                  <span className="text-sm font-medium">{trustThresholds.normal}</span>
                </div>
                <Slider
                  value={[trustThresholds.normal]}
                  onValueChange={([v]) => setTrustThresholds({ ...trustThresholds, normal: v })}
                  min={70}
                  max={90}
                  step={1}
                />
              </div>
              <div className="p-3 rounded-lg bg-success/10 text-success text-sm">
                Trusted: {trustThresholds.normal}+ score
              </div>
              <Button onClick={handleSaveTrust} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Trust Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cooldown Tab */}
        <TabsContent value="cooldown">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                Cooldown Settings
              </CardTitle>
              <CardDescription>Configure cooldown periods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Default Cooldown (hours)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={cooldownSettings.default_hours}
                    onChange={(e) => setCooldownSettings({ ...cooldownSettings, default_hours: parseInt(e.target.value) || 24 })}
                    min={1}
                    max={168}
                  />
                  <span className="text-muted-foreground text-sm">hours</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Maximum Cooldown (hours)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={cooldownSettings.max_hours}
                    onChange={(e) => setCooldownSettings({ ...cooldownSettings, max_hours: parseInt(e.target.value) || 168 })}
                    min={24}
                    max={720}
                  />
                  <span className="text-muted-foreground text-sm">hours ({Math.round(cooldownSettings.max_hours / 24)} days)</span>
                </div>
              </div>
              <Button onClick={handleSaveCooldown} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Cooldown Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Economy Tab */}
        <TabsContent value="economy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-capsule" />
                Economy Settings
              </CardTitle>
              <CardDescription>Plan limits and multipliers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Free Daily Limit</Label>
                <Input
                  type="number"
                  value={economySettings.daily_limit_free}
                  onChange={(e) => setEconomySettings({ ...economySettings, daily_limit_free: parseInt(e.target.value) || 100 })}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Free Monthly Allowance</Label>
                <Input
                  type="number"
                  value={economySettings.monthly_allowance_free}
                  onChange={(e) => setEconomySettings({ ...economySettings, monthly_allowance_free: parseInt(e.target.value) || 1500 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Premium Monthly Allowance</Label>
                <Input
                  type="number"
                  value={economySettings.monthly_allowance_premium}
                  onChange={(e) => setEconomySettings({ ...economySettings, monthly_allowance_premium: parseInt(e.target.value) || 6000 })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Premium Multiplier</Label>
                  <span className="text-sm font-medium">{economySettings.premium_multiplier}x</span>
                </div>
                <Slider
                  value={[economySettings.premium_multiplier * 10]}
                  onValueChange={([v]) => setEconomySettings({ ...economySettings, premium_multiplier: v / 10 })}
                  min={10}
                  max={30}
                  step={1}
                />
              </div>
              <Button onClick={handleSaveEconomy} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Economy Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* App Identity Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  App Identity
                </CardTitle>
                <CardDescription>Customize app name, logo, and colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>App Name</Label>
                  <Input
                    value={branding.app_name}
                    onChange={(e) => setBranding({ ...branding, app_name: e.target.value })}
                    placeholder="EngageLoop"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input
                    value={branding.logo_url || ''}
                    onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Favicon URL</Label>
                  <Input
                    value={branding.favicon_url || ''}
                    onChange={(e) => setBranding({ ...branding, favicon_url: e.target.value })}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={branding.primary_color}
                        onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.primary_color}
                        onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={branding.secondary_color}
                        onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.secondary_color}
                        onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Typography Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Typography & Background
                </CardTitle>
                <CardDescription>Customize fonts and background</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Heading Font</Label>
                    <Select
                      value={branding.font_heading}
                      onValueChange={(v) => setBranding({ ...branding, font_heading: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFonts.map((font) => (
                          <SelectItem key={font} value={font}>{font}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Body Font</Label>
                    <Select
                      value={branding.font_body}
                      onValueChange={(v) => setBranding({ ...branding, font_body: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFonts.map((font) => (
                          <SelectItem key={font} value={font}>{font}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Background Image URL</Label>
                  <Input
                    value={branding.background_image || ''}
                    onChange={(e) => setBranding({ ...branding, background_image: e.target.value })}
                    placeholder="https://example.com/bg.jpg"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Dark Overlay on Background</Label>
                  <Switch
                    checked={branding.background_overlay}
                    onCheckedChange={(c) => setBranding({ ...branding, background_overlay: c })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Frontend Text Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Frontend Text
                </CardTitle>
                <CardDescription>Customize hero and footer text</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Hero Headline</Label>
                  <Textarea
                    value={branding.hero_headline}
                    onChange={(e) => setBranding({ ...branding, hero_headline: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Subheadline</Label>
                  <Textarea
                    value={branding.hero_subheadline}
                    onChange={(e) => setBranding({ ...branding, hero_subheadline: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Footer Disclaimer</Label>
                  <Textarea
                    value={branding.footer_disclaimer}
                    onChange={(e) => setBranding({ ...branding, footer_disclaimer: e.target.value })}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Social Links Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Social Media Links
                </CardTitle>
                <CardDescription>Add your social media profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Twitter/X</Label>
                    <Input
                      value={socialLinks.twitter || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Facebook</Label>
                    <Input
                      value={socialLinks.facebook || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Instagram</Label>
                    <Input
                      value={socialLinks.instagram || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">YouTube</Label>
                    <Input
                      value={socialLinks.youtube || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Discord</Label>
                    <Input
                      value={socialLinks.discord || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, discord: e.target.value })}
                      placeholder="https://discord.gg/..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">TikTok</Label>
                    <Input
                      value={socialLinks.tiktok || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                      placeholder="https://tiktok.com/..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="p-6 rounded-lg border relative overflow-hidden"
                  style={{
                    backgroundImage: branding.background_image ? `url(${branding.background_image})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {branding.background_image && branding.background_overlay && (
                    <div className="absolute inset-0 bg-background/80" />
                  )}
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: branding.primary_color }}
                      >
                        {branding.app_name.charAt(0)}
                      </div>
                      <span className="font-bold text-lg" style={{ fontFamily: branding.font_heading }}>
                        {branding.app_name}
                      </span>
                    </div>
                    <h2 
                      className="text-2xl font-bold mb-2" 
                      style={{ fontFamily: branding.font_heading }}
                    >
                      {branding.hero_headline}
                    </h2>
                    <p 
                      className="text-muted-foreground mb-4"
                      style={{ fontFamily: branding.font_body }}
                    >
                      {branding.hero_subheadline}
                    </p>
                    <div className="flex gap-2 mb-4">
                      <div 
                        className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: branding.primary_color }}
                      >
                        Primary Button
                      </div>
                      <div 
                        className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: branding.secondary_color }}
                      >
                        Secondary
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground border-t pt-4">
                      {branding.footer_disclaimer}
                    </div>
                  </div>
                </div>
                <Button onClick={handleSaveBranding} disabled={saving} className="mt-4">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Branding
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Landing Page Images
              </CardTitle>
              <CardDescription>
                Upload or provide URLs for landing page images. Changes affect the live site in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Hero Background Image</Label>
                  <Input
                    value={branding.background_image || ''}
                    onChange={(e) => setBranding({ ...branding, background_image: e.target.value })}
                    placeholder="https://example.com/hero-bg.jpg"
                  />
                  <p className="text-xs text-muted-foreground">Recommended: 1920x1080px</p>
                </div>
                <div className="space-y-2">
                  <Label>Social Proof Screenshot</Label>
                  <Input
                    value={branding.social_proof_image || ''}
                    onChange={(e) => setBranding({ ...branding, social_proof_image: e.target.value })}
                    placeholder="https://example.com/social-proof.png"
                  />
                  <p className="text-xs text-muted-foreground">Shown in hero section sidebar</p>
                </div>
                <div className="space-y-2">
                  <Label>How It Works Image</Label>
                  <Input
                    value={branding.how_it_works_image || ''}
                    onChange={(e) => setBranding({ ...branding, how_it_works_image: e.target.value })}
                    placeholder="https://example.com/how-it-works.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Platforms Section Image</Label>
                  <Input
                    value={branding.platforms_image || ''}
                    onChange={(e) => setBranding({ ...branding, platforms_image: e.target.value })}
                    placeholder="https://example.com/platforms.png"
                  />
                </div>
              </div>
              <Button onClick={handleSaveBranding} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Images
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
