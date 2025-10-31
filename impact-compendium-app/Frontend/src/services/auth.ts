import { signIn, signOut, getCurrentUser, fetchAuthSession, confirmSignIn } from 'aws-amplify/auth';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  user: {
    email: string;
    sub: string;
  };
}

class AuthService {
  private tokenKey = 'ic_access_token';
  private userKey = 'ic_user';
  private pendingSignInKey = 'ic_pending_signin';
  private baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Clear any existing session first
      try {
        await signOut();
      } catch (e) {
        // Ignore signOut errors
      }

      // Handle different users
      let username = credentials.email;
      if (credentials.email === 'testuser@example.com') {
        username = 'testuser';
      }
      
      const signInResult = await signIn({
        username: username,
        password: credentials.password,
      });

      if (signInResult.isSignedIn) {
        const session = await fetchAuthSession();
        const user = await getCurrentUser();
        
        const tokens = session.tokens;
        if (!tokens) {
          throw new Error('No tokens received from Cognito');
        }

        const authData = {
          access_token: tokens.accessToken.toString(),
          id_token: tokens.idToken?.toString() || '',
          refresh_token: (tokens as any).refreshToken?.toString() || '',
          user: {
            email: user.signInDetails?.loginId || credentials.email,
            sub: user.userId,
          },
        };

        localStorage.setItem(this.tokenKey, authData.access_token);
        localStorage.setItem(this.userKey, JSON.stringify(authData.user));
        
        return authData;
      } else if (signInResult.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        // Store pending sign-in info for password change
        localStorage.setItem(this.pendingSignInKey, JSON.stringify({
          email: credentials.email,
          username: username
        }));
        
        // User needs to set a new password - throw specific error to trigger password change UI
        throw new Error('NEW_PASSWORD_REQUIRED');
      } else {
        throw new Error('Sign in was not completed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  async logout() {
    try {
      await signOut();
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local storage even if signOut fails
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
      window.location.href = '/login';
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser() {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr || userStr === 'undefined') {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  async getCurrentUser() {
    try {
      const user = await getCurrentUser();
      return {
        email: user.signInDetails?.loginId || '',
        sub: user.userId,
      };
    } catch (error) {
      // Fallback to localStorage
      return this.getUser();
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 5000)
      );
      
      const authPromise = getCurrentUser();
      
      await Promise.race([authPromise, timeoutPromise]);
      return true;
    } catch (error) {
      return !!this.getToken();
    }
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (error) {
      const token = this.getToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    }
  }

  async confirmNewPassword(newPassword: string): Promise<AuthResponse> {
    try {
      const confirmResult = await confirmSignIn({
        challengeResponse: newPassword,
      });
      
      if (confirmResult.isSignedIn) {
        const session = await fetchAuthSession();
        const user = await getCurrentUser();
        
        const tokens = session.tokens;
        if (!tokens) {
          throw new Error('No tokens received from Cognito');
        }

        const pendingSignIn = localStorage.getItem(this.pendingSignInKey);
        const email = pendingSignIn ? JSON.parse(pendingSignIn).email : user.signInDetails?.loginId;

        const authData = {
          access_token: tokens.accessToken.toString(),
          id_token: tokens.idToken?.toString() || '',
          refresh_token: (tokens as any).refreshToken?.toString() || '',
          user: {
            email: email || '',
            sub: user.userId,
          },
        };

        localStorage.setItem(this.tokenKey, authData.access_token);
        localStorage.setItem(this.userKey, JSON.stringify(authData.user));
        localStorage.removeItem(this.pendingSignInKey);
        
        return authData;
      } else {
        throw new Error('Password change was not completed');
      }
    } catch (error: any) {
      console.error('Password confirmation error:', error);
      throw new Error(error.message || 'Failed to confirm new password');
    }
  }

  getPendingSignIn() {
    const pendingStr = localStorage.getItem(this.pendingSignInKey);
    if (!pendingStr) return null;
    try {
      return JSON.parse(pendingStr);
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
