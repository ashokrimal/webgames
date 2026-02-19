import { useState, useEffect, useCallback } from 'react';
import { db, type User } from './database';
import { supabase } from './database';
import { AuthContext } from './authContext';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleAuthSignIn = useCallback(async (authUser: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      name?: string;
      avatar_url?: string;
    };
  }) => {
    try {
      // Check if user exists in our database
      let dbUser = await db.getUser(authUser.id);

      if (!dbUser) {
        // Create new user in database
        const newUser = {
          id: authUser.id,
          email: authUser.email || '',
          username: authUser.user_metadata?.full_name ||
                   authUser.user_metadata?.name ||
                   authUser.email?.split('@')[0] ||
                   'Player',
          avatar: authUser.user_metadata?.avatar_url,
          created_at: new Date().toISOString(),
          games_played: 0,
          games_won: 0,
          total_score: 0,
          level: 1,
          experience: 0
        };

        dbUser = await db.createUser(newUser);
      }

      setUser(dbUser);
    } catch (error) {
      console.error('Error handling auth sign in:', error);
    }
  }, []);

  const checkAuthState = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleAuthSignIn(session.user);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthSignIn]);

  useEffect(() => {
    checkAuthState();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await handleAuthSignIn(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAuthState, handleAuthSignIn]);

  const signIn = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, username: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            username: username
          }
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithProvider = async (provider: 'google' | 'discord') => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('OAuth sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserStats = async (stats: Partial<User>) => {
    if (!user) return;

    try {
      const updatedUser = await db.updateUserStats(user.id, stats);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update stats error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
      signInWithProvider,
      updateUserStats
    }}>
      {children}
    </AuthContext.Provider>
  );
};
