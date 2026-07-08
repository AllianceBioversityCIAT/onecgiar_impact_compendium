# UI Integration Documentation

## Overview

This document describes the frontend-backend integration architecture for the Impact Compendium application, detailing API connectivity, data synchronization, and dynamic UI features.

## Architecture Components

### 1. API Service Layer (`src/services/api.js`)

**Core Features**:
- Centralized HTTP client with authentication
- Automatic token attachment and refresh
- Error handling and response parsing
- RESTful endpoint abstractions

**Configuration**:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

**Authentication Integration**:
```javascript
getHeaders(includeAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = this.getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
```

### 2. Custom Hooks (`src/hooks/useApi.ts`)

**Generic API Hook**:
```typescript
function useApi<T>(apiCall: () => Promise<T>, options?: UseApiOptions)
```

**Specialized Hooks**:
- `useStudies(params)` - Fetch studies with filtering
- `useStudy(id)` - Fetch single study details
- `useProfile()` - Get current user profile

**State Management**:
```typescript
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
```

### 3. Component Architecture

#### Dashboard Component (`src/pages/Dashboard/Dashboard.tsx`)
- **Real-time Stats**: Dynamic calculation from API data
- **Recent Studies**: Live data with search/filter
- **Role-based UI**: Conditional rendering based on user permissions
- **Expandable Cards**: Interactive study details

#### Studies Component (`src/pages/Studies/Studies.tsx`)
- **CRUD Operations**: Create, read, update, delete studies
- **Bulk Actions**: Multi-select with batch operations
- **Advanced Search**: Real-time filtering and search
- **Expandable Rows**: Detailed study information

#### StudyForm Component (`src/components/StudyForm.tsx`)
- **Dynamic Form**: Create/edit mode with validation
- **Real-time Validation**: Client-side form validation
- **Auto-save**: Draft functionality (future enhancement)
- **Error Handling**: User-friendly error messages

## Data Flow Architecture

### 1. Authentication Flow
```
Login → AuthContext → Token Storage → API Headers → Backend Validation
```

### 2. Data Fetching Flow
```
Component Mount → useApi Hook → API Service → Backend → State Update → UI Render
```

### 3. CRUD Operations Flow
```
User Action → Form Validation → API Call → Backend Processing → Response → UI Update
```

## API Integration

### 1. Studies API Integration

**List Studies**:
```javascript
// API Call
const studies = await ApiService.getStudies({ limit: 50 });

// Component Usage
const { data: studies, loading, error } = useStudies({ limit: 50 });
```

**Create Study**:
```javascript
// API Call
const newStudy = await ApiService.createStudy({
  title: "New Study",
  description: "Study description",
  is_published: false
});

// Form Integration
const handleSubmit = async (formData) => {
  const result = await ApiService.createStudy(formData);
  onSave(result);
};
```

**Update Study**:
```javascript
// API Call
const updatedStudy = await ApiService.updateStudy(id, updateData);

// Component Integration
const handleUpdate = async (id, data) => {
  try {
    const result = await ApiService.updateStudy(id, data);
    setStudies(prev => prev.map(s => s.id === id ? result : s));
  } catch (error) {
    setError(error.message);
  }
};
```

**Delete Study**:
```javascript
// API Call with confirmation
const handleDelete = async (id) => {
  if (confirm('Delete this study?')) {
    await ApiService.deleteStudy(id);
    setStudies(prev => prev.filter(s => s.id !== id));
  }
};
```

### 2. Authentication API Integration

**Login Flow**:
```javascript
// AuthContext integration
const login = async (email, password) => {
  const tokens = await ApiService.login(email, password);
  storeAuthData(tokens);
  navigate('/dashboard');
};
```

**Profile Management**:
```javascript
// Profile data fetching
const { data: profile } = useProfile();

// Profile updates
const updateProfile = async (data) => {
  await ApiService.updateProfile(data);
  refetchProfile();
};
```

## Dynamic UI Features

### 1. Search and Filtering

**Real-time Search**:
```typescript
const [searchTerm, setSearchTerm] = useState('');

const filteredStudies = studies.filter(study =>
  study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  study.description?.toLowerCase().includes(searchTerm.toLowerCase())
);
```

**Advanced Filters**:
```typescript
interface FilterState {
  status: 'all' | 'published' | 'draft';
  category: string;
  dateRange: { start: Date; end: Date };
}

const applyFilters = (studies: Study[], filters: FilterState) => {
  return studies.filter(study => {
    if (filters.status !== 'all' && study.is_published !== (filters.status === 'published')) {
      return false;
    }
    // Additional filter logic...
    return true;
  });
};
```

### 2. Expandable Tables

**State Management**:
```typescript
const [expandedStudies, setExpandedStudies] = useState<Set<number>>(new Set());

const toggleExpansion = (studyId: number) => {
  const newExpanded = new Set(expandedStudies);
  if (newExpanded.has(studyId)) {
    newExpanded.delete(studyId);
  } else {
    newExpanded.add(studyId);
  }
  setExpandedStudies(newExpanded);
};
```

**Conditional Rendering**:
```tsx
{expandedStudies.has(study.id) && (
  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
    <StudyDetails study={study} />
  </div>
)}
```

### 3. Bulk Operations

**Multi-select State**:
```typescript
const [selectedStudies, setSelectedStudies] = useState<Set<number>>(new Set());

const toggleSelection = (studyId: number) => {
  const newSelected = new Set(selectedStudies);
  if (newSelected.has(studyId)) {
    newSelected.delete(studyId);
  } else {
    newSelected.add(studyId);
  }
  setSelectedStudies(newSelected);
};
```

**Bulk Actions**:
```typescript
const handleBulkDelete = async () => {
  const studyIds = Array.from(selectedStudies);
  await Promise.all(studyIds.map(id => ApiService.deleteStudy(id)));
  setStudies(prev => prev.filter(s => !selectedStudies.has(s.id)));
  setSelectedStudies(new Set());
};
```

## Role-Based UI

### 1. Permission Checks

**Component Level**:
```tsx
const { hasRole } = useAuth();

return (
  <div>
    {hasRole('Researcher') && (
      <Button onClick={handleCreateStudy}>Create Study</Button>
    )}
    
    {hasRole('Admin') && (
      <AdminPanel />
    )}
  </div>
);
```

**Action Level**:
```tsx
const canEditStudy = (study: Study) => {
  return hasRole('Admin') || (hasRole('Researcher') && study.created_by === user?.sub);
};

{canEditStudy(study) && (
  <Button onClick={() => handleEdit(study.id)}>Edit</Button>
)}
```

### 2. Conditional Features

**Dashboard Stats**:
```tsx
// Show different stats based on role
const getStatsForRole = (role: string, studies: Study[]) => {
  switch (role) {
    case 'Admin':
      return {
        totalStudies: studies.length,
        publishedStudies: studies.filter(s => s.is_published).length,
        allUsers: userCount,
        systemHealth: 'Good'
      };
    case 'Researcher':
      return {
        myStudies: studies.filter(s => s.created_by === user.sub).length,
        publishedStudies: studies.filter(s => s.is_published).length,
        drafts: studies.filter(s => !s.is_published && s.created_by === user.sub).length
      };
    default:
      return {
        publishedStudies: studies.filter(s => s.is_published).length,
        totalCategories: categoryCount
      };
  }
};
```

## Error Handling

### 1. API Error Handling

**Service Level**:
```javascript
async request(endpoint, options = {}) {
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
```

**Component Level**:
```tsx
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  try {
    setError(null);
    await ApiService.someAction();
  } catch (err: any) {
    setError(err.message || 'An error occurred');
  }
};

{error && (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

### 2. Loading States

**Global Loading**:
```tsx
const { loading } = useApi(() => ApiService.getStudies());

if (loading) {
  return <LoadingSpinner />;
}
```

**Action Loading**:
```tsx
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async () => {
  setSubmitting(true);
  try {
    await ApiService.createStudy(data);
  } finally {
    setSubmitting(false);
  }
};

<Button disabled={submitting}>
  {submitting ? 'Saving...' : 'Save'}
</Button>
```

## Data Synchronization

### 1. Real-time Updates

**Optimistic Updates**:
```typescript
const handleUpdate = async (id: number, data: Partial<Study>) => {
  // Optimistic update
  setStudies(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  
  try {
    const updated = await ApiService.updateStudy(id, data);
    // Confirm with server response
    setStudies(prev => prev.map(s => s.id === id ? updated : s));
  } catch (error) {
    // Revert on error
    refetchStudies();
    setError(error.message);
  }
};
```

**Polling for Updates**:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    refetchStudies();
  }, 30000); // Refresh every 30 seconds

  return () => clearInterval(interval);
}, [refetchStudies]);
```

### 2. Cache Management

**Local State Caching**:
```typescript
const [studiesCache, setStudiesCache] = useState<Map<string, Study[]>>(new Map());

const getCachedStudies = (params: any) => {
  const key = JSON.stringify(params);
  return studiesCache.get(key);
};

const setCachedStudies = (params: any, studies: Study[]) => {
  const key = JSON.stringify(params);
  setStudiesCache(prev => new Map(prev).set(key, studies));
};
```

## Performance Optimization

### 1. Lazy Loading

**Component Lazy Loading**:
```typescript
const StudyForm = lazy(() => import('@/components/StudyForm'));

<Suspense fallback={<LoadingSpinner />}>
  <StudyForm />
</Suspense>
```

**Data Pagination**:
```typescript
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const loadMoreStudies = async () => {
  const newStudies = await ApiService.getStudies({ 
    skip: page * 10, 
    limit: 10 
  });
  
  if (newStudies.length < 10) {
    setHasMore(false);
  }
  
  setStudies(prev => [...prev, ...newStudies]);
  setPage(prev => prev + 1);
};
```

### 2. Debounced Search

```typescript
import { useMemo } from 'react';
import { debounce } from 'lodash';

const debouncedSearch = useMemo(
  () => debounce((term: string) => {
    // Perform search
    searchStudies(term);
  }, 300),
  []
);

useEffect(() => {
  debouncedSearch(searchTerm);
}, [searchTerm, debouncedSearch]);
```

## Testing Strategy

### 1. Component Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Studies } from '@/pages/Studies';

test('should load and display studies', async () => {
  render(<Studies />);
  
  await waitFor(() => {
    expect(screen.getByText('Test Study')).toBeInTheDocument();
  });
});

test('should handle study creation', async () => {
  render(<StudyForm onSave={mockOnSave} />);
  
  fireEvent.change(screen.getByLabelText('Title'), {
    target: { value: 'New Study' }
  });
  
  fireEvent.click(screen.getByText('Create Study'));
  
  await waitFor(() => {
    expect(mockOnSave).toHaveBeenCalled();
  });
});
```

### 2. API Integration Testing

```typescript
import { ApiService } from '@/services/api';

// Mock API responses
jest.mock('@/services/api');
const mockApiService = ApiService as jest.Mocked<typeof ApiService>;

test('should handle API errors gracefully', async () => {
  mockApiService.getStudies.mockRejectedValue(new Error('Network error'));
  
  render(<Studies />);
  
  await waitFor(() => {
    expect(screen.getByText('Failed to load studies')).toBeInTheDocument();
  });
});
```

## Deployment Configuration

### 1. Environment Variables

```bash
# Frontend (.env)
REACT_APP_API_URL=https://api.impact-compendium.cgiar.org
REACT_APP_COGNITO_REGION=us-east-1
REACT_APP_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
REACT_APP_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Build Configuration

```json
{
  "scripts": {
    "build": "react-scripts build",
    "build:staging": "REACT_APP_API_URL=https://staging-api.impact-compendium.cgiar.org react-scripts build",
    "build:production": "REACT_APP_API_URL=https://api.impact-compendium.cgiar.org react-scripts build"
  }
}
```

## Future Enhancements

### 1. Real-time Features
- WebSocket integration for live updates
- Real-time collaboration on studies
- Live notifications for study changes

### 2. Advanced UI Features
- Drag-and-drop study organization
- Advanced data visualization
- Export functionality (PDF, Excel)
- Bulk import capabilities

### 3. Performance Improvements
- Virtual scrolling for large datasets
- Service worker for offline functionality
- Progressive Web App features
- Image optimization and lazy loading

---

**Document Version**: 1.0  
**Last Updated**: October 21, 2025  
**Author**: Amazon Q - Sprint 6 Implementation
