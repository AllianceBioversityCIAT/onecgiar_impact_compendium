/**
 * API Service for Impact Compendium
 * Handles all HTTP requests with authentication
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    const tokens = localStorage.getItem('auth_tokens');
    if (tokens) {
      const parsed = JSON.parse(tokens);
      return parsed.accessToken;
    }
    return null;
  }

  // Create request headers
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.auth !== false),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }

  // Studies API
  async getStudies(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/studies${query ? `?${query}` : ''}`, { auth: false });
  }

  async getStudy(id) {
    return this.get(`/studies/${id}`, { auth: false });
  }

  async createStudy(data) {
    return this.post('/studies', data);
  }

  async updateStudy(id, data) {
    return this.put(`/studies/${id}`, data);
  }

  async deleteStudy(id) {
    return this.delete(`/studies/${id}`);
  }

  // Authentication API
  async login(email, password) {
    return this.post('/auth/login', { email, password }, { auth: false });
  }

  async signup(userData) {
    return this.post('/auth/signup', userData, { auth: false });
  }

  async getProfile() {
    return this.get('/auth/me');
  }

  async refreshToken(refreshToken) {
    return this.post('/auth/refresh', { refresh_token: refreshToken }, { auth: false });
  }

  async logout() {
    return this.post('/auth/logout');
  }

  // Health check
  async healthCheck() {
    return this.get('/health', { auth: false });
  }
}

export default new ApiService();
