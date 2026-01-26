import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { TrustScoreDetailCard } from '@/components/TrustScoreDetailCard';
import { useApp } from '@/contexts/AppContext';
import { getTrustTier } from '@/lib/trust';
import { User, Building2, Mail, LogOut, AlertTriangle, Ban } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const trustScore = user?.trustScore || 50;
  const trustTier = getTrustTier(trustScore);
  const isSuspended = trustTier.tier === 'suspended';
  const isRestricted = trustTier.tier === 'restricted';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Profile & Settings</h2>
        <p className="text-muted-foreground">Manage your account</p>
      </div>

      {/* Suspended/Restricted Alerts */}
      {isSuspended && (
        <Alert variant="destructive">
          <Ban className="h-4 w-4" />
          <AlertDescription>
            Your account is suspended. You cannot earn Capsules. Please contact support to appeal.
          </AlertDescription>
        </Alert>
      )}

      {isRestricted && (
        <Alert className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning">
            Your account has restrictions. Complete tasks honestly to improve your trust score.
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{user?.name || 'User'}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={user?.plan === 'premium' ? 'default' : 'secondary'}>
                  {user?.plan === 'premium' ? 'Premium' : 'Free'}
                </Badge>
                <TrustScoreBadge score={trustScore} showLabel />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={user?.name || ''} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user?.email || ''} className="bg-background" disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Account Type</Label>
            <Select defaultValue={user?.accountType || 'individual'}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="individual">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Individual
                  </div>
                </SelectItem>
                <SelectItem value="organization">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Organization
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="gradient" className="w-full">Save Changes</Button>
        </CardContent>
      </Card>

      {/* Trust Score Detail Card */}
      <TrustScoreDetailCard trustScore={trustScore} showRules />

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive updates about your tasks</p>
            </div>
            <Badge variant="outline">Enabled</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Digest</p>
              <p className="text-sm text-muted-foreground">Summary of your weekly activity</p>
            </div>
            <Badge variant="outline">Enabled</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button 
        variant="outline" 
        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4" />
        Log Out
      </Button>
    </div>
  );
};

export default ProfilePage;
