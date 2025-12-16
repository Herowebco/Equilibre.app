import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  profileComplete: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkProfileComplete: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  const checkProfileComplete = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('age, weight, height, goal')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      const isComplete = !!(
        data?.age &&
        data?.weight &&
        data?.height &&
        data?.goal
      );

      setProfileComplete(isComplete);
      return isComplete;
    } catch (error) {
      console.error('Error checking profile:', error);
      return false;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name,
        };
        setUser(userData);

        const { data: profile } = await supabase
          .from('profiles')
          .select('age, weight, height, goal')
          .eq('id', session.user.id)
          .maybeSingle();

        const isComplete = !!(
          profile?.age &&
          profile?.weight &&
          profile?.height &&
          profile?.goal
        );
        setProfileComplete(isComplete);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          if (session?.user) {
            const userData = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.full_name,
            };
            setUser(userData);

            const { data: profile } = await supabase
              .from('profiles')
              .select('age, weight, height, goal')
              .eq('id', session.user.id)
              .maybeSingle();

            const isComplete = !!(
              profile?.age &&
              profile?.weight &&
              profile?.height &&
              profile?.goal
            );
            setProfileComplete(isComplete);
          } else {
            setUser(null);
            setProfileComplete(false);
          }
          setLoading(false);
        })();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name,
      });
    }
  };

  const signup = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email!,
        name: fullName,
      });
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        profileComplete,
        login,
        signup,
        logout,
        checkProfileComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
