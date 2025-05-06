
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// Define types for user and auth context
type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => void;
};

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('skillswamp_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Mock API call - would be replaced with actual auth service
      const users = JSON.parse(localStorage.getItem('skillswamp_users') || '[]');
      const user = users.find((u: any) => u.email === email);
      
      if (!user || user.password !== password) {
        toast({
          title: "Authentication failed",
          description: "Invalid email or password",
          variant: "destructive"
        });
        setIsLoading(false);
        return false;
      }
      
      // Create session user (without password)
      const sessionUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      };
      
      localStorage.setItem('skillswamp_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      
      toast({
        title: "Welcome back!",
        description: `You've successfully signed in to SkillSwamp.`,
      });
      
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
      // Mock API call - would be replaced with actual auth service
      const users = JSON.parse(localStorage.getItem('skillswamp_users') || '[]');
      
      // Check if email already exists
      if (users.some((user: any) => user.email === email)) {
        toast({
          title: "Registration failed",
          description: "This email is already registered",
          variant: "destructive"
        });
        setIsLoading(false);
        return false;
      }
      
      // Create new user
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        password, // In a real app, this would be hashed!
        name,
        createdAt: new Date().toISOString()
      };
      
      // Store user in "database"
      users.push(newUser);
      localStorage.setItem('skillswamp_users', JSON.stringify(users));
      
      // Create session user (without password)
      const sessionUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.createdAt
      };
      
      localStorage.setItem('skillswamp_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      
      toast({
        title: "Account created!",
        description: "Welcome to SkillSwamp! Your account has been created successfully.",
      });
      
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
  const signOut = () => {
    localStorage.removeItem('skillswamp_user');
    setUser(null);
    
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    
    navigate('/');
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
