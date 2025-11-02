import { authService } from './auth';

interface User {
  username: string;
  email: string;
  status: string;
  enabled: boolean;
  created_date: string;
  last_modified_date: string;
  mfa_enabled: boolean;
}

interface CreateUserRequest {
  email: string;
  temporaryPassword: string;
  sendEmail: boolean;
}

class UserService {
  private baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  async listUsers(): Promise<User[]> {
    const headers = await authService.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/api/users/`, { headers });
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  }

  async getUser(username: string): Promise<User> {
    const response = await fetch(`${this.baseURL}/api/users/${username}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  }

  async createUser(userData: CreateUserRequest): Promise<{ username: string; status: string }> {
    const authHeaders = await authService.getAuthHeaders();
    
    const requestBody = {
      email: userData.email,
      temporary_password: userData.temporaryPassword,
      send_email: userData.sendEmail
    };
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders
    };
    
    const response = await fetch(`${this.baseURL}/api/users/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch (parseError) {
        error = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new Error(error.error || error.detail || 'Failed to create user');
    }

    const result = await response.json();
    return result;
  }

  async updateUserStatus(username: string, enabled: boolean): Promise<void> {
    const authHeaders = await authService.getAuthHeaders();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders
    };
    
    const response = await fetch(`${this.baseURL}/api/users/${username}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ enabled })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update user status');
    }
  }

  async deleteUser(username: string): Promise<void> {
    const authHeaders = await authService.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/api/users/${username}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete user');
    }
  }

  async resetPassword(username: string): Promise<void> {
    const authHeaders = await authService.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/api/users/${username}/reset-password`, {
      method: 'POST',
      headers: authHeaders
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to reset password');
    }
  }
}

export const userService = new UserService();
