import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'researcher' | 'viewer';
  organization?: string;
  center?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
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
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('access_token');
    if (token) {
      // TODO: Validate token and get user info
      // For now, set a mock user
      setUser({
        id: '1',
        email: 'researcher@cgiar.org',
        name: 'Dr. Sarah Johnson',
        role: 'researcher',
        organization: 'CGIAR',
        center: 'Alliance Bioversity & CIAT',
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual login with Cognito
      // Mock login for now
      const mockUser: User = {
        id: '1',
        email,
        name: 'Dr. Sarah Johnson',
        role: 'researcher',
        organization: 'CGIAR',
        center: 'Alliance Bioversity & CIAT',
      };
      
      localStorage.setItem('access_token', 'mock_token');
      setUser(mockUser);
    } catch (error) {
      throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const refreshToken = async () => {
    // TODO: Implement token refresh
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
