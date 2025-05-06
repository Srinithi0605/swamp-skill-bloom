
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

// Define types for user and auth context
type User = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error fetching session:', error);
        setIsLoading(false);
        return;
      }
      
      setSession(session);
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url
        });
      }
      
      setIsLoading(false);
      
      // Set up listener for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, currentSession) => {
          setSession(currentSession);
          if (currentSession?.user) {
            setUser({
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              name: currentSession.user.user_metadata?.name,
              avatar_url: currentSession.user.user_metadata?.avatar_url
            });
          } else {
            setUser(null);
          }
        }
      );
      
      return () => {
        subscription?.unsubscribe();
      };
    };
    
    checkAuth();
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Authentication failed",
          description: error.message,
          variant: "destructive"
        });
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: `You've successfully signed in to SkillSwamp.`,
        });
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Sign-in error:', error);
      toast({
        title: "Something went wrong",
        description: "Could not sign you in. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      return false;
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          }
        }
      });

      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive"
        });
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        toast({
          title: "Account created!",
          description: "Welcome to SkillSwamp! Your account has been created successfully.",
        });
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Sign-up error:', error);
      toast({
        title: "Something went wrong",
        description: "Could not create your account. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      return false;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Sign-out error:', error);
      toast({
        title: "Sign-out failed",
        description: "Could not sign you out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading,
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
