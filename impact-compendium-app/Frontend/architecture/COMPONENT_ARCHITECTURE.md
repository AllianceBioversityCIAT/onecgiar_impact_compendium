# Component Architecture

## Design Philosophy

The Impact Compendium frontend follows **Atomic Design** principles combined with **Clean Architecture** patterns to create a maintainable, scalable, and reusable component system.

## Component Hierarchy

### Atomic Design Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        Templates                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   AppLayout     │  │  FormLayout     │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                        Organisms                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │     Table       │  │   HeaderBar     │  │  Pagination  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                        Molecules                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ SearchableSelect│  │   MultiSelect   │  │  DatePicker  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                         Atoms                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │     Button      │  │      Input      │  │    Badge     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Categories

### 1. Atoms (`components/ui/`)

Basic building blocks that cannot be broken down further.

#### Button Component
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick
}) => {
  // Implementation with Tailwind classes
};
```

#### Input Component
```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}
```

#### Other Atoms
- **Badge**: Status indicators and labels
- **Chip**: Removable tags and filters
- **Card**: Content containers
- **EmptyState**: No data placeholders

### 2. Molecules (`components/ui/`)

Combinations of atoms that form functional units.

#### SearchableSelect Component
```typescript
interface SearchableSelectProps {
  options: Array<{ value: string; label: string }>;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
}
```

#### MultiSelect Component
```typescript
interface MultiSelectProps {
  options: Array<{ value: string; label: string }>;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
}
```

#### DatePicker Component
```typescript
interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
}
```

### 3. Organisms (`components/ui/`)

Complex components that combine molecules and atoms.

#### Table Component
```typescript
interface TableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    header: string;
    sortable?: boolean;
    render?: (value: any, row: T) => React.ReactNode;
  }>;
  sortBy?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  expandable?: boolean;
  renderExpanded?: (row: T) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}
```

#### HeaderBar Component
```typescript
interface HeaderBarProps {
  user?: User;
  onLogout: () => void;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}
```

#### Pagination Component
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}
```

### 4. Templates (`layouts/`)

Page-level layout components that define structure.

#### AppLayout
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  breadcrumbs,
  actions
}) => (
  <div className="min-h-screen bg-gray-50">
    <HeaderBar breadcrumbs={breadcrumbs} />
    <main className="container mx-auto px-4 py-8">
      {title && (
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          {actions}
        </div>
      )}
      {children}
    </main>
    <FooterBar />
  </div>
);
```

#### FormLayout
```typescript
interface FormLayoutProps {
  children: React.ReactNode;
  title: string;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
}
```

## Component Patterns

### 1. Compound Components

For complex components with multiple related parts:

```typescript
// Table with compound pattern
export const Table = ({ children, ...props }) => {
  return <table {...props}>{children}</table>;
};

Table.Header = ({ children }) => <thead>{children}</thead>;
Table.Body = ({ children }) => <tbody>{children}</tbody>;
Table.Row = ({ children }) => <tr>{children}</tr>;
Table.Cell = ({ children }) => <td>{children}</td>;

// Usage
<Table>
  <Table.Header>
    <Table.Row>
      <Table.Cell>Name</Table.Cell>
      <Table.Cell>Status</Table.Cell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {data.map(item => (
      <Table.Row key={item.id}>
        <Table.Cell>{item.name}</Table.Cell>
        <Table.Cell>{item.status}</Table.Cell>
      </Table.Row>
    ))}
  </Table.Body>
</Table>
```

### 2. Render Props Pattern

For flexible component composition:

```typescript
interface DataFetcherProps<T> {
  url: string;
  children: (data: {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
  }) => React.ReactNode;
}

export const DataFetcher = <T,>({ url, children }: DataFetcherProps<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch logic...

  return children({ data, loading, error, refetch });
};

// Usage
<DataFetcher url="/api/studies">
  {({ data, loading, error }) => (
    loading ? <Spinner /> : 
    error ? <ErrorMessage error={error} /> :
    <StudyList studies={data} />
  )}
</DataFetcher>
```

### 3. Custom Hooks Pattern

For reusable stateful logic:

```typescript
// Custom hook for form handling
export const useForm = <T>(initialValues: T, validationSchema?: any) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const validateField = (field: keyof T, value: any) => {
    // Validation logic
  };

  const handleSubmit = (onSubmit: (values: T) => void) => (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(values);
    }
  };

  return {
    values,
    errors,
    touched,
    setValue,
    handleSubmit,
    isValid: Object.keys(errors).length === 0
  };
};
```

## Component Communication

### 1. Props Down, Events Up

```typescript
// Parent component
const Dashboard = () => {
  const [studies, setStudies] = useState([]);
  const [selectedStudy, setSelectedStudy] = useState(null);

  return (
    <div>
      <StudyTable 
        studies={studies}
        onStudySelect={setSelectedStudy}
      />
      {selectedStudy && (
        <StudyDetailsPanel 
          study={selectedStudy}
          onClose={() => setSelectedStudy(null)}
        />
      )}
    </div>
  );
};
```

### 2. Context for Deep Props

```typescript
// Theme context for design system
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {}
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### 3. Event Emitters for Loose Coupling

```typescript
// Global event system for notifications
class EventEmitter {
  private events: Record<string, Function[]> = {};

  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event: string, data?: any) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

export const eventBus = new EventEmitter();

// Usage in components
const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    eventBus.on('notification', (notification) => {
      setNotifications(prev => [...prev, notification]);
    });
  }, []);

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <Notification key={notification.id} {...notification} />
      ))}
    </div>
  );
};
```

## Testing Strategy

### Component Testing Approach

```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### Integration Testing

```typescript
// Page-level integration test
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { Dashboard } from './Dashboard';

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
    
    await waitFor(() => {
      expect(screen.getByText('Studies Dashboard')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Memoization Strategies

```typescript
// Expensive component memoization
const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      computed: expensiveCalculation(item)
    }));
  }, [data]);

  const handleUpdate = useCallback((id, changes) => {
    onUpdate(id, changes);
  }, [onUpdate]);

  return (
    <div>
      {processedData.map(item => (
        <Item 
          key={item.id} 
          data={item} 
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  );
});
```

### Code Splitting

```typescript
// Lazy loading for large components
const Dashboard = React.lazy(() => import('./Dashboard'));
const CreateStudy = React.lazy(() => import('./CreateStudy'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/create-study" element={<CreateStudy />} />
  </Routes>
</Suspense>
```

---

**Version**: 1.0.0  
**Last Updated**: October 26, 2024  
**Next Review**: November 26, 2024
