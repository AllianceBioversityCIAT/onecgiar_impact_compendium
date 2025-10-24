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
  private baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const authData = await response.json();
    
    // Store tokens and user info
    localStorage.setItem(this.tokenKey, authData.access_token);
    
    // Create user object from credentials if not in response
    const userObj = authData.user || { email: credentials.email };
    localStorage.setItem(this.userKey, JSON.stringify(userObj));
    
    return authData;
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    // Redirect to login page
    window.location.href = '/login';
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

  getCurrentUser() {
    // Check for Cognito user data
    const cognitoUser = localStorage.getItem('CognitoIdentityServiceProvider.7c6ej8qjnqhqvvhqvhqvhq.testuser@example.com.userData') ||
                       localStorage.getItem('amplify-signin-with-hostedUI_OAUTH_Data') ||
                       localStorage.getItem('aws-amplify-user');
    
    if (cognitoUser) {
      try {
        const parsed = JSON.parse(cognitoUser);
        return { email: 'testuser@example.com' }; // Temporary hardcode for testing
      } catch (e) {
        // Error parsing Cognito data
      }
    }
    
    // Fallback to our custom user storage
    return this.getUser();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Add auth header to API requests
  getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export const authService = new AuthService();
