import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useAdminData } from '@/hooks/useAdminData';
import { getTrustTier } from '@/lib/trust';
import {
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  RefreshCw,
  Shield,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Users,
  Crown,
  AlertTriangle,
  UserPlus,
  UserMinus,
  Copy,
  Loader2,
  Link,
  Plus,
  Mail,
  Key,
  Coins,
  MinusCircle,
  PlusCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function UserManagement() {
  const {
    isLoading,
    refetch,
    getUsersWithDetails,
    suspendUser,
    banUser,
    restrictUser,
    activateUser,
    upgradeToPremiuim,
    downgradeToFree,
    assignRole,
    removeRole,
    createUser,
    generateAccessToken,
    creditCapsules,
    debitCapsules,
  } = useAdminData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAccessLinkDialogOpen, setIsAccessLinkDialogOpen] = useState(false);
  const [isCapsuleDialogOpen, setIsCapsuleDialogOpen] = useState(false);
  const [capsuleAction, setCapsuleAction] = useState<'credit' | 'debit'>('credit');
  const [capsuleAmount, setCapsuleAmount] = useState(100);
  const [capsuleDescription, setCapsuleDescription] = useState('');
  const [capsuleUserId, setCapsuleUserId] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [creating, setCreating] = useState(false);

  // New user form
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    display_name: '',
    role: 'user' as 'admin' | 'user',
    plan: 'freemium' as 'freemium' | 'premium',
  });

  const users = getUsersWithDetails();
  
  const filteredUsers = users.filter(user =>
    (user.display_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: users.length,
    premium: users.filter(u => u.plan === 'premium').length,
    admins: users.filter(u => u.isAdmin).length,
    suspended: users.filter(u => u.status === 'suspended' || u.status === 'banned').length,
  };

  const handleAction = async (action: () => Promise<boolean>, userId: string) => {
    setActionLoading(userId);
    await action();
    setActionLoading(null);
  };

  const copyInviteLink = (userId: string) => {
    const link = `${window.location.origin}/signup?ref=${userId}`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied!');
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast.error('Email and password are required');
      return;
    }

    setCreating(true);
    try {
      const result = await createUser(newUser);
      if (result.success && result.accessLink) {
        setGeneratedLink(result.accessLink);
        setIsCreateDialogOpen(false);
        setIsAccessLinkDialogOpen(true);
        setNewUser({
          email: '',
          password: '',
          display_name: '',
          role: 'user',
          plan: 'freemium',
        });
      }
    } catch (error) {
      console.error('Create user error:', error);
    }
    setCreating(false);
  };

  const handleGenerateAccessLink = async (userId: string) => {
    setActionLoading(userId);
    const link = await generateAccessToken(userId);
    if (link) {
      setGeneratedLink(link);
      setIsAccessLinkDialogOpen(true);
    }
    setActionLoading(null);
  };

  const copyAccessLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Access link copied!');
  };

  const openCapsuleDialog = (userId: string, action: 'credit' | 'debit') => {
    setCapsuleUserId(userId);
    setCapsuleAction(action);
    setCapsuleAmount(100);
    setCapsuleDescription('');
    setIsCapsuleDialogOpen(true);
  };

  const handleCapsuleAction = async () => {
    if (!capsuleUserId || capsuleAmount <= 0) {
      toast.error('Invalid amount');
      return;
    }

    setCreating(true);
    if (capsuleAction === 'credit') {
      await creditCapsules(capsuleUserId, capsuleAmount, capsuleDescription);
    } else {
      await debitCapsules(capsuleUserId, capsuleAmount, capsuleDescription);
    }
    setCreating(false);
    setIsCapsuleDialogOpen(false);
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
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage users, roles, and account statuses</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create User
          </Button>
          <Button variant="outline" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-capsule/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-capsule" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.premium}</p>
              <p className="text-xs text-muted-foreground">Premium</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.admins}</p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Ban className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.suspended}</p>
              <p className="text-xs text-muted-foreground">Suspended</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Trust</TableHead>
                  <TableHead>Capsules</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const trustTier = getTrustTier(user.trustScore);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.display_name || 'Anonymous'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <Badge variant="default" className="gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">User</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.plan === 'premium' ? 'default' : 'secondary'}>
                            {user.plan === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                            {user.plan || 'freemium'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TrustScoreBadge score={user.trustScore} />
                            <Badge variant="outline" className={trustTier.color}>
                              {trustTier.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <CapsuleBadge amount={user.totalCapsules} size="sm" />
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            user.status === 'active' ? 'default' :
                            user.status === 'restricted' ? 'outline' :
                            'destructive'
                          }>
                            {user.status || 'active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={actionLoading === user.id}>
                                {actionLoading === user.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="w-4 h-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleGenerateAccessLink(user.id)}>
                                <Key className="w-4 h-4 mr-2" />
                                Generate Access Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyInviteLink(user.id)}>
                                <Link className="w-4 h-4 mr-2" />
                                Copy Invite Link
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Capsule Management</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openCapsuleDialog(user.id, 'credit')}>
                                <PlusCircle className="w-4 h-4 mr-2 text-success" />
                                Add Capsules
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openCapsuleDialog(user.id, 'debit')}>
                                <MinusCircle className="w-4 h-4 mr-2 text-destructive" />
                                Remove Capsules
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {/* Role Management */}
                              {user.isAdmin ? (
                                <DropdownMenuItem 
                                  onClick={() => handleAction(() => removeRole(user.id, 'admin'), user.id)}
                                  className="text-warning"
                                >
                                  <UserMinus className="w-4 h-4 mr-2" />
                                  Remove Admin
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleAction(() => assignRole(user.id, 'admin'), user.id)}>
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Make Admin
                                </DropdownMenuItem>
                              )}
                              
                              {/* Plan Management */}
                              {user.plan === 'premium' ? (
                                <DropdownMenuItem onClick={() => handleAction(() => downgradeToFree(user.id), user.id)}>
                                  <TrendingDown className="w-4 h-4 mr-2" />
                                  Downgrade to Free
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleAction(() => upgradeToPremiuim(user.id), user.id)}>
                                  <Crown className="w-4 h-4 mr-2 text-capsule" />
                                  Upgrade to Premium
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator />
                              
                              {/* Status Management */}
                              {user.status !== 'active' && (
                                <DropdownMenuItem onClick={() => handleAction(() => activateUser(user.id), user.id)}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Activate Account
                                </DropdownMenuItem>
                              )}
                              {user.status === 'active' && (
                                <DropdownMenuItem onClick={() => handleAction(() => restrictUser(user.id), user.id)}>
                                  <Shield className="w-4 h-4 mr-2 text-warning" />
                                  Restrict Account
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleAction(() => suspendUser(user.id), user.id)}
                                className="text-warning"
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Suspend Account
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleAction(() => banUser(user.id), user.id)}
                                className="text-destructive"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Ban Account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account with specified role and plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Temporary password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">User will receive a password reset link</p>
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                placeholder="John Doe"
                value={newUser.display_name}
                onChange={(e) => setNewUser({ ...newUser, display_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: 'admin' | 'user') => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select
                  value={newUser.plan}
                  onValueChange={(value: 'freemium' | 'premium') => setNewUser({ ...newUser, plan: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freemium">Freemium</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Capsule Management Dialog */}
      <Dialog open={isCapsuleDialogOpen} onOpenChange={setIsCapsuleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-capsule" />
              {capsuleAction === 'credit' ? 'Add Capsules' : 'Remove Capsules'}
            </DialogTitle>
            <DialogDescription>
              {capsuleAction === 'credit' 
                ? 'Credit capsules to user account. No limit.'
                : 'Remove capsules from user account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min={1}
                value={capsuleAmount}
                onChange={(e) => setCapsuleAmount(parseInt(e.target.value) || 0)}
                placeholder="Enter amount"
              />
              <div className="flex gap-2 mt-2">
                {[100, 500, 1000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCapsuleAmount(amount)}
                    className={capsuleAmount === amount ? 'border-primary' : ''}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input
                value={capsuleDescription}
                onChange={(e) => setCapsuleDescription(e.target.value)}
                placeholder={capsuleAction === 'credit' ? 'e.g., Promotional bonus' : 'e.g., Refund adjustment'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCapsuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCapsuleAction} 
              disabled={creating || capsuleAmount <= 0}
              variant={capsuleAction === 'credit' ? 'default' : 'destructive'}
            >
              {creating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : capsuleAction === 'credit' ? (
                <PlusCircle className="w-4 h-4 mr-2" />
              ) : (
                <MinusCircle className="w-4 h-4 mr-2" />
              )}
              {capsuleAction === 'credit' ? 'Add' : 'Remove'} {capsuleAmount} Capsules
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Link Dialog */}
      <Dialog open={isAccessLinkDialogOpen} onOpenChange={setIsAccessLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Access Link Generated</DialogTitle>
            <DialogDescription>
              Share this password reset link with the user. They will be redirected to dashboard after setting their password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 break-all text-sm font-mono">
              {generatedLink}
            </div>
            <p className="text-sm text-muted-foreground">
              This is a one-time use link. The user will set their password and access their dashboard.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccessLinkDialogOpen(false)}>Close</Button>
            <Button onClick={copyAccessLink}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View complete user information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold">
                  {(selectedUser.display_name || 'A').charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedUser.display_name || 'Anonymous'}</p>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <Badge className="mt-1">{selectedUser.plan || 'freemium'}</Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge className="mt-1" variant={selectedUser.isAdmin ? 'default' : 'secondary'}>
                    {selectedUser.isAdmin ? 'Admin' : 'User'}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Trust Score</p>
                  <TrustScoreBadge score={selectedUser.trustScore} />
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedUser.status === 'active' ? 'default' : 'destructive'}>
                    {selectedUser.status || 'active'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Total Capsules</span>
                  <CapsuleBadge amount={selectedUser.totalCapsules} />
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Tasks Completed</span>
                  <span className="font-medium">{selectedUser.tasksCompleted}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Submissions</span>
                  <span className="font-medium">{selectedUser.submissions?.length || 0}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="text-sm">{format(new Date(selectedUser.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    openCapsuleDialog(selectedUser.id, 'credit');
                    setSelectedUser(null);
                  }}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Capsules
                </Button>
                <Button onClick={() => handleGenerateAccessLink(selectedUser.id)}>
                  <Key className="w-4 h-4 mr-2" />
                  Generate Access Link
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}