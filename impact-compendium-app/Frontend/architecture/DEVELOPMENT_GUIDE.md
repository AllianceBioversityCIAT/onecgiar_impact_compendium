# Frontend Development Guide

## Getting Started

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: For version control
- **VS Code**: Recommended IDE with extensions

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd impact-compendium-app/Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Daily Development Process

1. **Pull latest changes**
   ```bash
   git pull origin main
   npm install  # In case dependencies changed
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Make changes and test**
   - Write code following established patterns
   - Test in browser at `http://localhost:3000`
   - Run linting: `npm run lint`

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   git push origin feature/your-feature-name
   ```

### Code Quality Checks

Before committing, ensure:
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Components are properly typed
- [ ] New components have basic tests
- [ ] Code follows established patterns

## Project Structure Deep Dive

### Component Organization

```
src/components/
├── ui/                     # Reusable UI components
│   ├── Button.tsx         # ✅ Atomic component
│   ├── Input.tsx          # ✅ Atomic component
│   ├── Table.tsx          # ✅ Organism component
│   ├── __tests__/         # Component tests
│   └── index.ts           # Barrel exports
├── ProtectedRoute.tsx     # Route wrapper
└── [Feature]Component.tsx # Feature-specific components
```

### Page Organization

```
src/pages/
├── Login.tsx              # Authentication page
├── Dashboard.tsx          # Main dashboard
├── CreateStudy/           # Multi-step form
│   ├── Step1.tsx         # Form step components
│   ├── Step2.tsx
│   └── Step3.tsx
└── __tests__/            # Page integration tests
```

### Service Layer

```
src/services/
├── api.ts                # HTTP client and API methods
├── auth.ts               # Authentication service
└── [feature].ts          # Feature-specific services
```

## Coding Standards

### TypeScript Guidelines

#### 1. Interface Definitions
```typescript
// ✅ Good: Descriptive interface names
interface StudyFormData {
  title: string;
  description: string;
  category: string;
  startDate: Date;
}

// ❌ Bad: Generic or unclear names
interface Data {
  title: any;
  desc: string;
}
```

#### 2. Component Props
```typescript
// ✅ Good: Explicit prop types
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  onClick
}) => {
  // Implementation
};
```

#### 3. Custom Hooks
```typescript
// ✅ Good: Typed custom hook
interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useApi = <T>(url: string): UseApiResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Implementation
  
  return { data, loading, error, refetch };
};
```

### React Best Practices

#### 1. Component Structure
```typescript
// ✅ Good: Consistent component structure
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { useApi } from '../../hooks/useApi';
import type { Study } from '../../types/study';

interface StudyListProps {
  filters?: Record<string, any>;
  onStudySelect: (study: Study) => void;
}

export const StudyList: React.FC<StudyListProps> = ({
  filters,
  onStudySelect
}) => {
  // Hooks at the top
  const { data: studies, loading, error } = useApi<Study[]>('/studies');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Effects after hooks
  useEffect(() => {
    // Side effects
  }, [filters]);

  // Event handlers
  const handleStudyClick = (study: Study) => {
    setSelectedId(study.id);
    onStudySelect(study);
  };

  // Early returns for loading/error states
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Main render
  return (
    <div className="study-list">
      {studies?.map(study => (
        <div 
          key={study.id}
          onClick={() => handleStudyClick(study)}
          className={`study-item ${selectedId === study.id ? 'selected' : ''}`}
        >
          {study.title}
        </div>
      ))}
    </div>
  );
};
```

#### 2. State Management
```typescript
// ✅ Good: Proper state management
const [formData, setFormData] = useState<StudyFormData>({
  title: '',
  description: '',
  category: '',
  startDate: new Date()
});

// Update specific field
const updateField = (field: keyof StudyFormData, value: any) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
};

// ❌ Bad: Direct mutation
formData.title = 'New Title'; // Don't do this
```

#### 3. Event Handling
```typescript
// ✅ Good: Proper event handling
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  if (validateForm(formData)) {
    onSubmit(formData);
  }
};

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  updateField(name as keyof StudyFormData, value);
};
```

### CSS and Styling Guidelines

#### 1. Tailwind CSS Usage
```typescript
// ✅ Good: Semantic class combinations
<button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
  Submit
</button>

// ✅ Good: Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// ✅ Good: Custom CSS variables for consistency
<div className="bg-primary-600 text-primary-50">
  {/* Uses design tokens */}
</div>
```

#### 2. Component Styling Patterns
```typescript
// ✅ Good: Conditional classes with clsx
import clsx from 'clsx';

const Button: React.FC<ButtonProps> = ({ variant, size, disabled, children }) => {
  return (
    <button
      className={clsx(
        'font-medium rounded-md transition-colors',
        {
          'bg-blue-600 hover:bg-blue-700 text-white': variant === 'primary',
          'bg-gray-200 hover:bg-gray-300 text-gray-900': variant === 'secondary',
          'py-1 px-2 text-sm': size === 'sm',
          'py-2 px-4 text-base': size === 'md',
          'py-3 px-6 text-lg': size === 'lg',
          'opacity-50 cursor-not-allowed': disabled
        }
      )}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

## Testing Guidelines

### Unit Testing Components

```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('applies correct variant classes', () => {
    render(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Integration Testing

```typescript
// Page integration test
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { Dashboard } from './Dashboard';

// Mock API calls
jest.mock('../services/api', () => ({
  studyAPI: {
    getAll: jest.fn(() => Promise.resolve([
      { id: '1', title: 'Test Study', status: 'active' }
    ]))
  }
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Integration', () => {
  it('loads and displays studies', async () => {
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Test Study')).toBeInTheDocument();
    });
  });
});
```

### Custom Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useForm } from './useForm';

describe('useForm Hook', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => 
      useForm({ name: '', email: '' })
    );

    expect(result.current.values).toEqual({ name: '', email: '' });
    expect(result.current.errors).toEqual({});
  });

  it('updates field values', () => {
    const { result } = renderHook(() => 
      useForm({ name: '', email: '' })
    );

    act(() => {
      result.current.setValue('name', 'John Doe');
    });

    expect(result.current.values.name).toBe('John Doe');
  });
});
```

## Performance Optimization

### Code Splitting Strategies

```typescript
// Route-level code splitting
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateStudy = lazy(() => import('./pages/CreateStudy'));

// Usage
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/create-study" element={<CreateStudy />} />
  </Routes>
</Suspense>
```

### Memoization Best Practices

```typescript
// Expensive calculations
const ExpensiveComponent = ({ data, filters }) => {
  const processedData = useMemo(() => {
    return data
      .filter(item => matchesFilters(item, filters))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(item => ({
        ...item,
        computed: expensiveCalculation(item)
      }));
  }, [data, filters]);

  return <DataVisualization data={processedData} />;
};

// Callback memoization
const ParentComponent = ({ onUpdate }) => {
  const handleChildUpdate = useCallback((id, changes) => {
    onUpdate(id, changes);
  }, [onUpdate]);

  return (
    <div>
      {items.map(item => (
        <ChildComponent 
          key={item.id}
          item={item}
          onUpdate={handleChildUpdate}
        />
      ))}
    </div>
  );
};
```

## Debugging and Development Tools

### Browser DevTools Setup

1. **React Developer Tools**
   - Install React DevTools browser extension
   - Use Components tab to inspect component tree
   - Use Profiler tab for performance analysis

2. **Redux DevTools** (if using Redux)
   - Install Redux DevTools extension
   - Monitor state changes and actions

### VS Code Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "request": "launch",
      "type": "chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/src",
      "breakOnLoad": true,
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    }
  ]
}
```

### Console Debugging

```typescript
// Development-only logging
const isDevelopment = import.meta.env.DEV;

export const debugLog = (message: string, data?: any) => {
  if (isDevelopment) {
    console.log(`[DEBUG] ${message}`, data);
  }
};

// Usage in components
const MyComponent = () => {
  useEffect(() => {
    debugLog('Component mounted', { props });
  }, []);

  const handleAction = (data: any) => {
    debugLog('Action triggered', data);
    // Handle action
  };
};
```

## Common Patterns and Solutions

### Form Handling Pattern

```typescript
// Reusable form hook
export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: any
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const setFieldTouched = (field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, values[field]);
  };

  const validateField = (field: keyof T, value: any) => {
    if (validationSchema?.[field]) {
      const error = validationSchema[field](value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const validateAll = () => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    
    Object.keys(values).forEach(key => {
      const field = key as keyof T;
      if (validationSchema?.[field]) {
        const error = validationSchema[field](values[field]);
        if (error) newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (onSubmit: (values: T) => void) => (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateAll()) {
      onSubmit(values);
    }
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    handleSubmit,
    isValid: Object.keys(errors).length === 0,
    reset: () => {
      setValues(initialValues);
      setErrors({});
      setTouched({});
    }
  };
};
```

### Data Fetching Pattern

```typescript
// Generic data fetching hook
export const useApi = <T>(
  url: string,
  options?: {
    immediate?: boolean;
    dependencies?: any[];
  }
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(options?.immediate !== false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiGet(url);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (options?.immediate !== false) {
      fetchData();
    }
  }, [fetchData, ...(options?.dependencies || [])]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData
  };
};
```

## Troubleshooting

### Common Issues and Solutions

#### 1. TypeScript Errors
```typescript
// Error: Property 'x' does not exist on type 'y'
// Solution: Proper type definitions
interface ApiResponse {
  data: Study[];
  total: number;
  page: number;
}

const { data } = response as ApiResponse;
```

#### 2. State Update Issues
```typescript
// Error: State not updating immediately
// Solution: Use functional updates
setItems(prevItems => [...prevItems, newItem]);

// For objects
setUser(prevUser => ({ ...prevUser, name: newName }));
```

#### 3. Infinite Re-renders
```typescript
// Error: Too many re-renders
// Solution: Proper dependency arrays
useEffect(() => {
  fetchData();
}, [id]); // Only re-run when id changes

// Memoize objects/functions passed as dependencies
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

#### 4. Memory Leaks
```typescript
// Solution: Cleanup in useEffect
useEffect(() => {
  const subscription = subscribe(callback);
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

**Version**: 1.0.0  
**Last Updated**: October 26, 2024  
**Next Review**: November 26, 2024
