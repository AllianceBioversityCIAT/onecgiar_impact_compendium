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
    localStorage.setItem(this.userKey, JSON.stringify(authData.user));
    
    return authData;
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser() {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
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
