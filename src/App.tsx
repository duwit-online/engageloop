import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import EarnCapsulesPage from "./pages/dashboard/EarnCapsulesPage";
import PromoteLinkPage from "./pages/dashboard/PromoteLinkPage";
import MyTasksPage from "./pages/dashboard/MyTasksPage";
import StatsPage from "./pages/dashboard/StatsPage";
import WalletPage from "./pages/dashboard/WalletPage";
import SubscriptionPage from "./pages/dashboard/SubscriptionPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import UserManagement from "./pages/admin/UserManagement";
import TaskModeration from "./pages/admin/TaskModeration";
import AdsManager from "./pages/admin/AdsManager";
import SubmissionReview from "./pages/admin/SubmissionReview";
import TrustScoreManager from "./pages/admin/TrustScoreManager";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminSettings from "./pages/admin/AdminSettings";
import EconomyManager from "./pages/admin/EconomyManager";
import PricingManager from "./pages/admin/PricingManager";
import PaymentsManager from "./pages/admin/PaymentsManager";
import AdminDebug from "./pages/admin/AdminDebug";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useApp();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!session?.user) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, isAdmin, isLoading, checkAdminRole, supabaseUser } = useApp();
  const [roleReady, setRoleReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!session?.user) {
        if (!cancelled) setRoleReady(true);
        return;
      }

      // Avoid the login -> overview -> login flicker by waiting for a role check.
      if (!isAdmin) {
        try {
          await checkAdminRole();
        } finally {
          if (!cancelled) setRoleReady(true);
        }
      } else {
        if (!cancelled) setRoleReady(true);
      }
    }

    setRoleReady(false);
    // supabaseUser becomes available immediately on auth; "user" profile data may lag.
    void run();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, supabaseUser?.id, isAdmin, checkAdminRole]);

  if (isLoading || !roleReady) {
    return <LoadingScreen />;
  }

  if (!session?.user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

function AppRoutes() {
  const { session, isAdmin } = useApp();
  const isAuthed = !!session?.user;

  return (
    <Routes>
      <Route path="/" element={isAuthed ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={isAuthed ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthed ? <Navigate to="/dashboard" replace /> : <SignupPage />} />

      {/* Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/earn"
        element={
          <ProtectedRoute>
            <EarnCapsulesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/promote"
        element={
          <ProtectedRoute>
            <PromoteLinkPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/tasks"
        element={
          <ProtectedRoute>
            <MyTasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/stats"
        element={
          <ProtectedRoute>
            <StatsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/wallet"
        element={
          <ProtectedRoute>
            <WalletPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/subscription"
        element={
          <ProtectedRoute>
            <SubscriptionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/login"
        element={isAuthed && isAdmin ? <Navigate to="/admin/overview" replace /> : <AdminLoginPage />}
      />
      <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
      <Route
        path="/admin/overview"
        element={
          <AdminRoute>
            <AdminOverview />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/tasks"
        element={
          <AdminRoute>
            <TaskModeration />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/submissions"
        element={
          <AdminRoute>
            <SubmissionReview />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/trust"
        element={
          <AdminRoute>
            <TrustScoreManager />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/ads"
        element={
          <AdminRoute>
            <AdsManager />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminRoute>
            <AdminSettings />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/economy"
        element={
          <AdminRoute>
            <EconomyManager />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/pricing"
        element={
          <AdminRoute>
            <PricingManager />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <AdminRoute>
            <PaymentsManager />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/debug"
        element={
          <AdminRoute>
            <AdminDebug />
          </AdminRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;

