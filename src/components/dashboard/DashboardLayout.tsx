import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Coins, 
  Link2, 
  ListTodo, 
  BarChart3, 
  Wallet, 
  CreditCard, 
  User, 
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NotificationBell } from '@/components/NotificationBell';
import { useApp } from '@/contexts/AppContext';
import { useState } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Coins, label: 'Earn Capsules', path: '/dashboard/earn' },
  { icon: Link2, label: 'Promote Link', path: '/dashboard/promote' },
  { icon: ListTodo, label: 'My Tasks', path: '/dashboard/tasks' },
  { icon: BarChart3, label: 'Stats', path: '/dashboard/stats' },
  { icon: Wallet, label: 'Wallet', path: '/dashboard/wallet' },
  { icon: CreditCard, label: 'Subscription', path: '/dashboard/subscription' },
  { icon: User, label: 'Profile', path: '/dashboard/profile' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function SidebarContent({ 
  collapsed = false, 
  onNavClick 
}: { 
  collapsed?: boolean;
  onNavClick?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, darkMode, toggleDarkMode } = useApp();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    onNavClick?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2" onClick={onNavClick}>
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">E</span>
          </div>
          {!collapsed && <span className="font-display font-bold">EngageLoop</span>}
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDarkMode}
          className={cn('w-full justify-start gap-3', collapsed && 'justify-center px-2')}
        >
          {darkMode ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={cn('w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10', collapsed && 'justify-center px-2')}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </Button>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { user, capsuleBalance, isAdmin } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 h-14 bg-background/95 backdrop-blur-lg border-b border-border flex items-center justify-between px-3 gap-2">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar">
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
          <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-xs">E</span>
          </div>
          <span className="font-display font-semibold text-sm truncate">
            {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <CapsuleBadge amount={capsuleBalance} size="sm" />
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-56 xl:w-64 h-[calc(100vh-0px)] sticky top-0 bg-sidebar border-r border-sidebar-border shrink-0">
          <div className="w-full">
            <SidebarContent />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Desktop Top Bar */}
          <header className="hidden lg:flex sticky top-0 z-30 h-14 bg-background/95 backdrop-blur-lg border-b border-border items-center justify-between px-4 xl:px-6">
            <h1 className="text-lg font-semibold truncate">
              {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h1>

            <div className="flex items-center gap-3">
              <NotificationBell />
              
              <CapsuleBadge amount={capsuleBalance} />
              
              <Badge variant="outline" className="gap-1.5">
                {user?.plan === 'premium' ? (
                  <span className="text-gradient-primary font-semibold">Premium</span>
                ) : (
                  <span>Free</span>
                )}
              </Badge>

              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="icon" className="text-primary">
                    <Shield className="w-5 h-5" />
                  </Button>
                </Link>
              )}

              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-medium text-primary">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-3 sm:p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
