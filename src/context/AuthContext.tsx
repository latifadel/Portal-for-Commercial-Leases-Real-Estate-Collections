import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { supabase } from '../services/supabaseClient';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  isLoadingAuth: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  switchRole: (role: Role) => void;
  isAdmin: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // Map Supabase session user to application User
  const formatUser = (supaUser: any): User => {
    const rawRole = supaUser.user_metadata?.role;
    const role: Role = rawRole === 'VIEWER' ? 'VIEWER' : 'ADMIN';
    const name =
      supaUser.user_metadata?.name ||
      supaUser.user_metadata?.full_name ||
      supaUser.email?.split('@')[0] ||
      'Property Manager';

    return {
      id: supaUser.id,
      email: supaUser.email || 'user@property.sa',
      name,
      role,
    };
  };

  useEffect(() => {
    let isMounted = true;

    // Check active session on initial boot
    const initializeAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (isMounted) {
          if (existingSession?.user) {
            setSession(existingSession);
            setCurrentUser(formatUser(existingSession.user));
          } else {
            setSession(null);
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.error('[Auth] Error getting session:', err);
      } finally {
        if (isMounted) {
          setIsLoadingAuth(false);
        }
      }
    };

    initializeAuth();

    // Listen to real-time auth changes (sign in, token refresh, sign out)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (newSession?.user) {
        setSession(newSession);
        setCurrentUser(formatUser(newSession.user));
      } else {
        setSession(null);
        setCurrentUser(null);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session?.user) {
        setSession(data.session);
        setCurrentUser(formatUser(data.session.user));
        return { success: true };
      }

      return { success: false, error: 'Failed to retrieve user session' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login error' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name?: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name?.trim() || email.split('@')[0],
            role: 'ADMIN',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session?.user) {
        setSession(data.session);
        setCurrentUser(formatUser(data.session.user));
        return { success: true };
      }

      return {
        success: true,
        message: 'Account created! If confirmation email is required, please check your inbox.',
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Registration error' };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Password reset link sent to your email.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Reset password error' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    } finally {
      setSession(null);
      setCurrentUser(null);
    }
  };

  const switchRole = (role: Role) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, role });
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';
  const isViewer = currentUser?.role === 'VIEWER';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        isLoadingAuth,
        signIn,
        signUp,
        resetPassword,
        logout,
        switchRole,
        isAdmin,
        isViewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
