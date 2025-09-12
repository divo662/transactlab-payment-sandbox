import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthTokens } from '@/types';
import apiService from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, securityAnswer: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  initiateSecurityQuestionReset: (email: string) => Promise<void>;
  resetSecurityQuestion: (token: string, newQuestion: string, newAnswer: string) => Promise<void>;
  resetSecurityQuestionWithPassword: (email: string, password: string, newQuestion: string, newAnswer: string) => Promise<void>;
  checkTokenExpiry: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is authenticated on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (accessToken && refreshToken) {
          // Try to get user profile
          const profile = await apiService.getProfile();
          if (profile.success) {
            setUser(profile.data.user);
            setTokens({
              accessToken,
              refreshToken,
              expiresIn: 3600, // Default expiry
            });
          } else {
            // Clear invalid tokens
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            if (typeof window !== 'undefined') {
              const path = window.location.pathname;
              const isProtected = path.startsWith('/sandbox') || path.startsWith('/customers') || path.startsWith('/products');
              if (isProtected) {
                window.location.href = '/auth/login';
              }
            }
          }
        } else {
          if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            const isProtected = path.startsWith('/sandbox') || path.startsWith('/customers') || path.startsWith('/products');
            if (isProtected) {
              window.location.href = '/auth/login';
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          const isProtected = path.startsWith('/sandbox') || path.startsWith('/customers') || path.startsWith('/products');
          if (isProtected) {
            window.location.href = '/auth/login';
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Check token expiry every minute
  useEffect(() => {
    const checkTokenExpiry = () => {
      if (tokens?.accessToken) {
        try {
          const token = tokens.accessToken;
          const decoded = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          
          if (decoded.exp < currentTime) {
            // Token expired, logout user
            toast({
              title: "Session Expired",
              description: "Your session has expired. Please log in again.",
              variant: "destructive"
            });
            logout();
          }
        } catch (error) {
          console.error('Error checking token expiry:', error);
        }
      }
    };

    // Check immediately
    checkTokenExpiry();
    
    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60000);
    
    return () => clearInterval(interval);
  }, [tokens]);

  const login = async (email: string, password: string, securityAnswer: string, rememberMe = false) => {
    try {
      setIsLoading(true);
      const response = await apiService.login({ email, password, securityAnswer, rememberMe });
      
      if (response.success && response.data) {
        const { user: userData, tokens: authTokens, requireKyc } = response.data;
        
        setUser(userData);
        setTokens(authTokens);
        
        // Store tokens
        localStorage.setItem('accessToken', authTokens.accessToken);
        localStorage.setItem('refreshToken', authTokens.refreshToken);
        
        // Store user data if remember me is checked
        if (rememberMe) {
          localStorage.setItem('userData', JSON.stringify(userData));
        }

        // If KYC is required, redirect immediately
        try {
          if (requireKyc && typeof window !== 'undefined') {
            const kycRes = await apiService.startKyc(`${window.location.origin}/auth/kyc/callback`);
            const hostedUrl = kycRes?.data?.hostedUrl;
            if (hostedUrl) {
              window.location.href = hostedUrl;
              return; // stop normal flow
            }
          }
        } catch (e) {
          console.warn('KYC start failed (continuing to app):', e);
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await apiService.register(userData);
      
      if (response.success && response.data) {
        // Do NOT auto-login after registration.
        // Ensure any possible tokens are cleared and send user to login with verification notice.
        setUser(null);
        setTokens(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        try {
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login?verification=required';
          }
        } catch (_) {
          // no-op
        }
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (tokens?.accessToken) {
        await apiService.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      setUser(null);
      setTokens(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      // Always redirect to login on logout to avoid stale state
      try {
        if (typeof window !== 'undefined') {
          // Use hard navigation to fully reset app state
          window.location.href = '/auth/login';
        }
      } catch (_) {
        // no-op
      }
    }
  };

  const refreshAuth = async () => {
    try {
      const response = await apiService.refreshToken();
      
      if (response.success && response.data) {
        const { user: userData, tokens: authTokens } = response.data;
        
        setUser(userData);
        setTokens(authTokens);
        
        // Update stored tokens
        localStorage.setItem('accessToken', authTokens.accessToken);
        localStorage.setItem('refreshToken', authTokens.refreshToken);
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // Force logout on refresh failure
      await logout();
      throw error;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated: !!user && !!tokens,
    login,
    register,
    logout,
    refreshAuth,
    updateUser,
    initiateSecurityQuestionReset: async (email: string) => {
      try {
        await apiService.initiateSecurityQuestionReset({ email });
      } catch (error) {
        console.error('Failed to initiate security question reset:', error);
        throw error;
      }
    },
    resetSecurityQuestion: async (token: string, newQuestion: string, newAnswer: string) => {
      try {
        await apiService.resetSecurityQuestion({ token, newSecurityQuestion: newQuestion, newSecurityAnswer: newAnswer });
      } catch (error) {
        console.error('Failed to reset security question:', error);
        throw error;
      }
    },
    resetSecurityQuestionWithPassword: async (email: string, password: string, newQuestion: string, newAnswer: string) => {
      try {
        await apiService.resetSecurityQuestionWithPassword({ email, password, newQuestion, newAnswer });
      } catch (error) {
        console.error('Failed to reset security question with password:', error);
        throw error;
      }
      },
    checkTokenExpiry: () => {
      if (!tokens?.accessToken) return true;
      
      try {
        const token = tokens.accessToken;
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp < currentTime;
      } catch (error) {
        return true;
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 