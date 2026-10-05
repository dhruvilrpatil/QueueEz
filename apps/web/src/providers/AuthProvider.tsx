import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import type { Profile, UserRole } from '@/types';

export const DEMO_PROFILES: Record<string, Profile> = {
  'customer@demo.com': {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'customer@demo.com',
    full_name: 'Demo Customer',
    role: 'customer',
    phone: '+91-9876543210',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'staff@demo.com': {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'staff@demo.com',
    full_name: 'Dr. Jane Smith (Staff)',
    role: 'staff',
    facility_id: '00000000-0000-0000-0000-000000000010',
    phone: '+91-9876543211',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'admin@demo.com': {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'admin@demo.com',
    full_name: 'Administrator (Metro Hospital)',
    role: 'facility_admin',
    facility_id: '00000000-0000-0000-0000-000000000010',
    phone: '+91-9876543212',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (sessionData: Session) => {
    try {
      apiClient.setTokenProvider(async () => sessionData.access_token);
      const response = await apiClient.get<{ success: true; data: Profile }>('/auth/me');
      if (response.success && response.data) {
        let p = response.data;
        const savedAvatar = localStorage.getItem(`queueez_avatar_${p.id}`);
        const metaAvatar = sessionData.user?.user_metadata?.avatar_url || sessionData.user?.user_metadata?.picture;
        if (!p.avatar_url && (savedAvatar || metaAvatar)) {
          p = { ...p, avatar_url: savedAvatar || metaAvatar };
        }
        setProfile(p);
      }
    } catch {
      console.warn('Could not fetch profile from API, using local session');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session) {
      await fetchProfile(session);
    }
  }, [session, fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return;
    const updated: Profile = {
      ...profile,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    setProfile(updated);

    if (profile.email && DEMO_PROFILES[profile.email]) {
      DEMO_PROFILES[profile.email] = updated;
    }
    localStorage.setItem(`queueez_profile_${profile.id}`, JSON.stringify(updated));
    if (updates.avatar_url !== undefined) {
      if (updates.avatar_url) {
        localStorage.setItem(`queueez_avatar_${profile.id}`, updates.avatar_url);
      } else {
        localStorage.removeItem(`queueez_avatar_${profile.id}`);
      }
    }

    try {
      await apiClient.patch('/auth/profile', updates);
    } catch {
      // Local fallback
    }
  };

  // Initialize auth state
  useEffect(() => {
    // 1. Check if demo user is stored in localStorage
    const savedDemoEmail = localStorage.getItem('ezqueue_demo_user');
    if (savedDemoEmail && DEMO_PROFILES[savedDemoEmail]) {
      let demoProfile = DEMO_PROFILES[savedDemoEmail];
      const cached = localStorage.getItem(`queueez_profile_${demoProfile.id}`);
      if (cached) {
        try {
          demoProfile = { ...demoProfile, ...JSON.parse(cached) };
        } catch {
          // Ignore
        }
      }
      const savedAvatar = localStorage.getItem(`queueez_avatar_${demoProfile.id}`);
      if (savedAvatar) {
        demoProfile = { ...demoProfile, avatar_url: savedAvatar };
      }
      const mockUser = {
        id: demoProfile.id,
        email: demoProfile.email,
        app_metadata: { role: demoProfile.role },
        user_metadata: { full_name: demoProfile.full_name },
        aud: 'authenticated',
        created_at: demoProfile.created_at,
      } as unknown as User;

      const mockSession = {
        access_token: `demo-token-${demoProfile.role}`,
        token_type: 'bearer',
        expires_in: 86400,
        refresh_token: 'demo-refresh-token',
        user: mockUser,
      } as unknown as Session;

      setUser(mockUser);
      setProfile(demoProfile);
      setSession(mockSession);
      apiClient.setTokenProvider(async () => `demo-token-${demoProfile.role}`);
      setIsLoading(false);
      return;
    }

    // 2. Otherwise try Supabase session
    try {
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s) {
          fetchProfile(s).finally(() => setIsLoading(false));
        } else {
          setIsLoading(false);
        }
      }).catch(() => {
        setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, s) => {
          // If demo user is active, don't overwrite with null supabase session
          if (localStorage.getItem('ezqueue_demo_user')) return;

          setSession(s);
          setUser(s?.user ?? null);

          if (s) {
            apiClient.setTokenProvider(async () => s.access_token);
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              await fetchProfile(s);
            }
          } else {
            apiClient.setTokenProvider(async () => null);
            setProfile(null);
          }

          setIsLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    } catch {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if it's a demo account
    if (DEMO_PROFILES[normalizedEmail]) {
      let demoProfile = DEMO_PROFILES[normalizedEmail];
      const cached = localStorage.getItem(`queueez_profile_${demoProfile.id}`);
      if (cached) {
        try {
          demoProfile = { ...demoProfile, ...JSON.parse(cached) };
        } catch {
          // Ignore
        }
      }
      const savedAvatar = localStorage.getItem(`queueez_avatar_${demoProfile.id}`);
      if (savedAvatar) {
        demoProfile = { ...demoProfile, avatar_url: savedAvatar };
      }
      const mockUser = {
        id: demoProfile.id,
        email: demoProfile.email,
        app_metadata: { role: demoProfile.role },
        user_metadata: { full_name: demoProfile.full_name },
        aud: 'authenticated',
        created_at: demoProfile.created_at,
      } as unknown as User;

      const mockSession = {
        access_token: `demo-token-${demoProfile.role}`,
        token_type: 'bearer',
        expires_in: 86400,
        refresh_token: 'demo-refresh-token',
        user: mockUser,
      } as unknown as Session;

      localStorage.setItem('ezqueue_demo_user', normalizedEmail);
      setUser(mockUser);
      setProfile(demoProfile);
      setSession(mockSession);
      apiClient.setTokenProvider(async () => `demo-token-${demoProfile.role}`);
      return;
    }

    // Otherwise use live Supabase
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) throw new Error(error.message);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to authentication server';
      throw new Error(message);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw new Error(error.message);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register account';
      throw new Error(message);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('ezqueue_demo_user');
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore if supabase offline
    }
    setUser(null);
    setProfile(null);
    setSession(null);
    apiClient.setTokenProvider(async () => null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
