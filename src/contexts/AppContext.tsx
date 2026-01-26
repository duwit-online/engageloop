import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'freemium' | 'premium';
  trustScore: number;
  accountType: 'individual' | 'organization';
}

interface AppState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  capsuleBalance: number;
  currency: string;
  darkMode: boolean;
}

interface AppContextType extends AppState {
  setUser: (user: User | null) => void;
  setCapsuleBalance: (balance: number) => void;
  addCapsules: (amount: number) => void;
  spendCapsules: (amount: number) => boolean;
  setCurrency: (currency: string) => void;
  toggleDarkMode: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  checkAdminRole: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [capsuleBalance, setCapsuleBalance] = useState(0);
  const [currency, setCurrency] = useState('NGN');
  const [darkMode, setDarkMode] = useState(true);

  // Prevent double-fetching on mount
  const fetchedUserIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const checkAdminRole = useCallback(async (): Promise<boolean> => {
    if (!supabaseUser) return false;

    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: supabaseUser.id,
        _role: 'admin',
      });

      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }

      const hasAdminRole = !!data;
      if (isMountedRef.current) setIsAdmin(hasAdminRole);
      return hasAdminRole;
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  }, [supabaseUser]);

  const fetchUserData = useCallback(async (userId: string, email: string) => {
    // Prevent re-fetching the same user
    if (fetchedUserIdRef.current === userId) return;
    fetchedUserIdRef.current = userId;

    try {
      const [profileRes, trustRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_trust_scores').select('*').eq('user_id', userId).maybeSingle(),
      ]);

      if (!isMountedRef.current) return;

      const profile = profileRes.data;
      const trustData = trustRes.data;

      const nextUser: User = {
        id: userId,
        email: email,
        name: profile?.display_name || email.split('@')[0],
        avatar: profile?.avatar_url,
        plan: (profile?.plan as User['plan'] | null) ?? 'freemium',
        trustScore: trustData?.trust_score ?? 0,
        accountType: 'individual',
      };

      const nextBalance = trustData?.total_capsules_earned ?? 0;

      setUser(nextUser);
      setCapsuleBalance(nextBalance);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [darkMode]);

  useEffect(() => {
    let cancelled = false;

    // Get session once on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;

      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setIsAdmin(false);
        setCapsuleBalance(0);
        setIsLoading(false);
      }
    });

    // Listen for auth changes (login/logout/token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        // Only fetch if it's a new user
        if (fetchedUserIdRef.current !== session.user.id) {
          fetchUserData(session.user.id, session.user.email || '');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        setCapsuleBalance(0);
        fetchedUserIdRef.current = null;
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  // Check admin role when supabaseUser changes
  useEffect(() => {
    if (supabaseUser) {
      checkAdminRole();
    }
  }, [supabaseUser, checkAdminRole]);

  const addCapsules = (amount: number) => {
    setCapsuleBalance((prev) => prev + amount);
  };

  const spendCapsules = (amount: number): boolean => {
    if (capsuleBalance >= amount) {
      setCapsuleBalance(capsuleBalance - amount);
      return true;
    }
    return false;
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
    setIsAdmin(false);
    setCapsuleBalance(0);
    fetchedUserIdRef.current = null;
  };

  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { display_name: name },
        },
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        isLoading,
        isAdmin,
        capsuleBalance,
        currency,
        darkMode,
        setUser,
        setCapsuleBalance,
        addCapsules,
        spendCapsules,
        setCurrency,
        toggleDarkMode,
        login,
        logout,
        signup,
        checkAdminRole,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
