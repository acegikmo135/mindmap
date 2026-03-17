import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { UserProfile } from '../types';
import { getUserProfile, updateUserProfile } from '../services/db';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string, grade?: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async (userId?: string) => {
    const id = userId || user?.id;
    if (id) {
      const p = await getUserProfile(id);
      setProfile(p);
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    const handleAuthChange = async (session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          // Check if profile exists, if not create it from metadata (for OAuth)
          const existingProfile = await getUserProfile(session.user.id);
          if (!existingProfile) {
            const metadata = session.user.user_metadata;
            await updateUserProfile(session.user.id, {
              email: session.user.email,
              full_name: metadata.full_name || metadata.name || '',
              avatar_url: metadata.avatar_url || metadata.picture || ''
            });
          }
          await refreshProfile(session.user.id);
        } catch (err) {
          console.error('Auth sync error:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signInWithGoogle = async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  const signUp = async (email: string, password: string, fullName?: string, grade?: string) => {
    const res = await supabase.auth.signUp({ email, password });
    if (!res.error && res.data.user) {
      // Small delay to allow trigger to run, then upsert
      setTimeout(async () => {
        if (res.data.user) {
          await updateUserProfile(res.data.user.id, {
            email: email,
            full_name: fullName,
            grade: grade
          });
          await refreshProfile(res.data.user.id);
        }
      }, 1000);
    }
    return res;
  };

  const signOut = async () => {
    setProfile(null);
    return await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
