import { authService } from './auth';

const API = {
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
};

// Auth helper function
const getAuthHeaders = async () => {
  try {
    return await authService.getAuthHeaders();
  } catch (error) {
    console.error('Failed to get auth headers:', error);
    return {};
  }
};

const handleAuthError = () => {
  localStorage.removeItem('ic_access_token');
  localStorage.removeItem('ic_user');
  window.location.href = '/login';
};

// Generic API helpers with auth
export const apiGet = async (endpoint: string) => {
  const authHeaders = await getAuthHeaders();
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
    }
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
};

export const apiPost = async (endpoint: string, data: any) => {
  const authHeaders = await getAuthHeaders();
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
    }
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
};

// Reference Data API calls for controlled lists
export const getReferenceData = {
  // Step 1 - Controlled Lists
  categories: () => apiGet('/reference/categories'),
  interventionTypes: () => apiGet('/reference/intervention-types'),
  
  // Step 2 - Controlled Lists  
  cropTypes: () => apiGet('/reference/crop-types'),
  keywords: () => apiGet('/reference/keywords'),
  initiatives: () => apiGet('/reference/initiatives'),
  centers: () => apiGet('/reference/centers'),
  impactAreas: () => apiGet('/reference/impact-areas'),
  countries: () => apiGet('/reference/countries'),
  regions: () => apiGet('/reference/regions'),
  
  // Step 3 - Indicators (if any controlled lists)
  indicatorUnits: () => apiGet('/reference/indicator-units'),
};

// Study CRUD operations
export const studyAPI = {
  getAll: () => apiGet('/studies'),
  getById: (id: string) => apiGet(`/studies/${id}`),
  create: (data: any) => apiPost('/studies', data),
  update: (id: string, data: any) => apiPost(`/studies/${id}`, data),
  delete: (id: string) => apiGet(`/studies/${id}/delete`),
};

export { API };
