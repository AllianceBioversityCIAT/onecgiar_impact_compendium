/**
 * =============================================================================
 * Impact Compendium Frontend - API Service Layer
 * =============================================================================
 *
 * This module provides a centralized API service layer for communicating with
 * the Impact Compendium backend. It handles authentication, error management,
 * and provides typed interfaces for all API operations.
 *
 * Architecture:
 * - Centralized HTTP client with authentication
 * - Automatic token refresh and error handling
 * - Typed API methods for type safety
 * - Consistent error handling across all endpoints
 *
 * Key Features:
 * - JWT token management via AWS Cognito
 * - Automatic 401 handling with redirect to login
 * - Reference data caching for dropdown lists
 * - CRUD operations for studies
 * - Environment-based API URL configuration
 *
 * @author Impact Compendium Team
 * @version 1.0.0
 * @since 2024-10-26
 */

import { authService } from './auth';

/**
 * API Configuration
 *
 * Base configuration for API calls including URL and common settings.
 * Uses environment variables for different deployment environments.
 */
const API = {
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api`,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
};

/**
 * Authentication Headers Helper
 *
 * Retrieves authentication headers from the auth service.
 * Handles cases where authentication might fail gracefully.
 *
 * @returns {Promise<Record<string, string>>} Authentication headers object
 */
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    return await authService.getAuthHeaders();
  } catch (error) {
    console.error('Failed to get auth headers:', error);
    return {};
  }
};

/**
 * Authentication Error Handler
 *
 * Handles 401 Unauthorized responses by clearing local storage
 * and redirecting to the login page.
 */
const handleAuthError = (): void => {
  localStorage.removeItem('ic_access_token');
  localStorage.removeItem('ic_user');
  window.location.href = '/login';
};

/**
 * API Error Interface
 *
 * Standardized error structure for API responses
 */
// interface _APIError {
//   status: number;
//   message: string;
//   details?: any;
// }

/**
 * Generic GET Request Handler
 *
 * Performs authenticated GET requests to the API with error handling.
 *
 * @param {string} endpoint - API endpoint path (without base URL)
 * @returns {Promise<any>} Parsed JSON response
 * @throws {APIError} When request fails or returns error status
 */
export const apiGet = async (endpoint: string): Promise<any> => {
  const authHeaders = await getAuthHeaders();

  try {
    const response = await fetch(`${API.baseURL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleAuthError();
        throw new Error('Authentication required');
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API Error ${response.status}: ${errorData.message || response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error(`API GET Error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Generic POST Request Handler
 *
 * Performs authenticated POST requests to the API with error handling.
 *
 * @param {string} endpoint - API endpoint path (without base URL)
 * @param {any} data - Request payload to be JSON stringified
 * @returns {Promise<any>} Parsed JSON response
 * @throws {APIError} When request fails or returns error status
 */
export const apiPost = async (endpoint: string, data: any): Promise<any> => {
  const authHeaders = await getAuthHeaders();

  try {
    const response = await fetch(`${API.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleAuthError();
        throw new Error('Authentication required');
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API Error ${response.status}: ${errorData.message || response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error(`API POST Error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Generic PUT Request Handler
 *
 * Performs authenticated PUT requests to the API with error handling.
 *
 * @param {string} endpoint - API endpoint path (without base URL)
 * @param {any} data - Request payload to be JSON stringified
 * @returns {Promise<any>} Parsed JSON response
 * @throws {APIError} When request fails or returns error status
 */
export const apiPut = async (endpoint: string, data: any): Promise<any> => {
  const authHeaders = await getAuthHeaders();

  try {
    const response = await fetch(`${API.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleAuthError();
        throw new Error('Authentication required');
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API Error ${response.status}: ${errorData.message || response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error(`API PUT Error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Generic DELETE Request Handler
 *
 * Performs authenticated DELETE requests to the API with error handling.
 *
 * @param {string} endpoint - API endpoint path (without base URL)
 * @returns {Promise<any>} Parsed JSON response
 * @throws {APIError} When request fails or returns error status
 */
export const apiDelete = async (endpoint: string): Promise<any> => {
  const authHeaders = await getAuthHeaders();

  try {
    const response = await fetch(`${API.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleAuthError();
        throw new Error('Authentication required');
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API Error ${response.status}: ${errorData.message || response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error(`API DELETE Error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Reference Data API
 *
 * Provides access to controlled lists and reference data used throughout
 * the application. These are typically cached on the frontend for performance.
 *
 * Categories:
 * - Step 1: Basic study categorization
 * - Step 2: Geographic and organizational data
 * - Step 3: Indicator measurement units
 */
export const getReferenceData = {
  // Step 1 - Study Classification
  categories: () => apiGet('/reference/categories'),
  interventionTypes: () => apiGet('/reference/intervention-types'),

  // Step 2 - Geographic and Organizational Data
  cropTypes: () => apiGet('/reference/crop-types'),
  keywords: () => apiGet('/reference/keywords'),
  initiatives: () => apiGet('/reference/initiatives'),
  centers: () => apiGet('/reference/centers'),
  impactAreas: () => apiGet('/reference/impact-areas'),
  countries: () => apiGet('/reference/countries'),
  regions: () => apiGet('/reference/regions'),

  // Step 3 - Measurement and Indicators
  indicatorUnits: () => apiGet('/reference/indicator-units'),
};

/**
 * Study CRUD Operations
 *
 * Complete set of operations for managing studies in the system.
 * Follows RESTful conventions with proper HTTP methods.
 *
 * Operations:
 * - getAll: Retrieve all studies with pagination
 * - getById: Retrieve specific study by ID
 * - create: Create new study
 * - update: Update existing study
 * - delete: Delete study (with cascade handling)
 */
export const studyAPI = {
  /**
   * Get All Studies
   *
   * Retrieves paginated list of all studies with optional filtering.
   *
   * @param {Object} params - Query parameters for filtering and pagination
   * @returns {Promise<any>} Studies list with pagination metadata
   */
  getAll: (params?: Record<string, any>) => {
    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    return apiGet(`/studies/${queryString}`);
  },

  /**
   * Get Study by ID
   *
   * Retrieves detailed information for a specific study.
   *
   * @param {string} id - Study ID
   * @returns {Promise<any>} Complete study object
   */
  getById: (id: string) => apiGet(`/studies/${id}`),

  /**
   * Create New Study
   *
   * Creates a new study with the provided data.
   *
   * @param {any} data - Study data object
   * @returns {Promise<any>} Created study with generated ID
   */
  create: (data: any) => apiPost('/studies', data),

  /**
   * Update Existing Study
   *
   * Updates an existing study with new data.
   *
   * @param {string} id - Study ID to update
   * @param {any} data - Updated study data
   * @returns {Promise<any>} Updated study object
   */
  update: (id: string, data: any) => apiPut(`/studies/${id}`, data),

  /**
   * Delete Study
   *
   * Deletes a study and all associated data (cascade delete).
   *
   * @param {string} id - Study ID to delete
   * @returns {Promise<any>} Deletion confirmation
   */
  delete: (id: string) => apiDelete(`/studies/${id}`),
};

/**
 * Export API configuration for use in other modules
 */
export { API };
