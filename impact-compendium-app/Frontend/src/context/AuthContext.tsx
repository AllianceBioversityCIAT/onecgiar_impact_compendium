import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
interface User {
  sub: string;
  email: string;
  name?: string;
  organization?: string;
  groups: string[];
}

interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedTokens = localStorage.getItem('auth_tokens');
        const storedUser = localStorage.getItem('auth_user');

        if (storedTokens && storedUser) {
          const parsedTokens = JSON.parse(storedTokens);
          const parsedUser = JSON.parse(storedUser);

          // Check if tokens are expired
          const tokenExpiry = localStorage.getItem('token_expiry');
          if (tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
            setTokens(parsedTokens);
            setUser(parsedUser);
          } else {
            // Try to refresh tokens
            try {
              await refreshTokens();
            } catch (error) {
              // Refresh failed, clear stored data
              clearAuthData();
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Clear authentication data
  const clearAuthData = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('token_expiry');
  };

  // Store authentication data
  const storeAuthData = (authTokens: AuthTokens, userData: User) => {
    setTokens(authTokens);
    setUser(userData);
    
    localStorage.setItem('auth_tokens', JSON.stringify(authTokens));
    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('token_expiry', (Date.now() + authTokens.expiresIn * 1000).toString());
  };

  // Decode JWT token to get user info
  const decodeToken = (token: string): any => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const authData = await response.json();
      
      // Decode ID token to get user information
      const decodedToken = decodeToken(authData.id_token);
      if (!decodedToken) {
        throw new Error('Invalid token received');
      }

      const userData: User = {
        sub: decodedToken.sub,
        email: decodedToken.email,
        name: decodedToken.name,
        organization: decodedToken['custom:organization'],
        groups: decodedToken['cognito:groups'] || []
      };

      const authTokens: AuthTokens = {
        accessToken: authData.access_token,
        idToken: authData.id_token,
        refreshToken: authData.refresh_token,
        expiresIn: authData.expires_in
      };

      storeAuthData(authTokens, userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (tokens?.accessToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
      setIsLoading(false);
    }
  };

  // Refresh tokens function
  const refreshTokens = async (): Promise<void> => {
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: tokens.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const refreshData = await response.json();
      
      const newTokens: AuthTokens = {
        ...tokens,
        accessToken: refreshData.access_token,
        idToken: refreshData.id_token,
        expiresIn: refreshData.expires_in
      };

      // Decode new ID token for updated user info
      const decodedToken = decodeToken(refreshData.id_token);
      if (decodedToken && user) {
        const updatedUser: User = {
          ...user,
          groups: decodedToken['cognito:groups'] || []
        };
        storeAuthData(newTokens, updatedUser);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuthData();
      throw error;
    }
  };

  // Check if user has specific role
  const hasRole = (role: string): boolean => {
    return user?.groups?.includes(role) || false;
  };

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated: !!user && !!tokens,
    login,
    logout,
    refreshTokens,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
