# Frontend Architecture Overview

## System Architecture

The Impact Compendium frontend follows a **Clean Architecture** pattern with clear separation of concerns, ensuring maintainability, testability, and scalability.

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │     Pages       │  │    Layouts      │  │  Components  │ │
│  │   (Routes)      │  │  (Structure)    │  │    (UI)      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │    Contexts     │  │     Hooks       │  │    Types     │ │
│  │  (State Mgmt)   │  │   (Logic)       │  │ (Contracts)  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │    Services     │  │      Mocks      │  │    Config    │ │
│  │  (API/Auth)     │  │   (Dev Data)    │  │   (Setup)    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Core Technologies
- **React 18**: Modern React with Concurrent Features
- **TypeScript**: Full type safety and developer experience
- **Vite**: Fast build tool and development server
- **React Router v6**: Client-side routing with data loading

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Design Tokens**: Consistent design system
- **Responsive Design**: Mobile-first approach

### State Management
- **React Context**: Global state (authentication)
- **React Hooks**: Local component state
- **Custom Hooks**: Reusable stateful logic

### Authentication & Security
- **AWS Amplify**: Authentication framework
- **AWS Cognito**: User pool and identity management
- **JWT Tokens**: Secure API communication

## Project Structure

```
src/
├── components/              # Reusable UI Components
│   ├── ui/                 # Base UI components (Button, Input, etc.)
│   ├── ProtectedRoute.tsx  # Route protection wrapper
│   ├── ForgotPassword.tsx  # Password recovery
│   └── PasswordChange.tsx  # Password change form
│
├── pages/                  # Route-level Components
│   ├── Login.tsx          # Authentication page
│   ├── Home.tsx           # Landing page
│   ├── Dashboard.tsx      # Main data dashboard
│   ├── Studies.tsx        # Studies listing
│   ├── StudyDetailsPanel.tsx # Study details view
│   ├── CreateStudy/       # Multi-step study creation
│   │   ├── Step1.tsx      # Basic information
│   │   ├── Step2.tsx      # Detailed information
│   │   └── Step3.tsx      # Indicators and outcomes
│   └── __tests__/         # Page-level tests
│
├── services/              # External Service Integration
│   ├── api.ts            # HTTP client and API methods
│   └── auth.ts           # Authentication service
│
├── contexts/              # React Context Providers
│   └── AuthContext.tsx   # Global authentication state
│
├── hooks/                 # Custom React Hooks
│   └── useDebouncedValue.ts # Debounced input handling
│
├── types/                 # TypeScript Type Definitions
│   └── study.ts          # Study-related types
│
├── layouts/               # Page Layout Components
│   ├── AppLayout.tsx     # Main application layout
│   └── FormLayout.tsx    # Form-specific layout
│
├── styles/                # Global Styles and Design Tokens
│   ├── global.css        # Base styles and Tailwind imports
│   └── design-tokens.css # Custom CSS variables
│
├── mocks/                 # Development Mock Data
│   └── studies.ts        # Sample study data
│
├── main.tsx              # Application entry point
└── aws-config.ts         # AWS Amplify configuration
```

## Component Architecture

### Component Hierarchy

```
App (Router + AuthProvider)
├── Login (Public Route)
└── ProtectedRoute
    ├── AppLayout
    │   ├── HeaderBar
    │   ├── FooterBar
    │   └── Page Content
    │       ├── Home
    │       ├── Dashboard
    │       │   ├── Table
    │       │   ├── Pagination
    │       │   └── StudyDetailsPanel
    │       └── Studies
    └── FormLayout
        └── CreateStudy Steps
            ├── Step1 (Basic Info)
            ├── Step2 (Details)
            └── Step3 (Indicators)
```

### Component Categories

#### 1. **UI Components** (`components/ui/`)
Reusable, stateless components following atomic design principles:
- **Atoms**: Button, Input, Badge, Chip
- **Molecules**: SearchableSelect, MultiSelect, DatePicker
- **Organisms**: Table, Pagination, HeaderBar

#### 2. **Page Components** (`pages/`)
Route-level components that compose UI components:
- Handle page-specific state and logic
- Integrate with services and contexts
- Manage data fetching and mutations

#### 3. **Layout Components** (`layouts/`)
Structural components for consistent page layouts:
- **AppLayout**: Main application shell
- **FormLayout**: Multi-step form container

## State Management Strategy

### Authentication State (Global)
```typescript
// AuthContext provides global authentication state
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

### Component State (Local)
- **useState**: Simple component state
- **useReducer**: Complex state with multiple actions
- **Custom Hooks**: Reusable stateful logic

### Data Fetching Pattern
```typescript
// Custom hook pattern for data fetching
const useStudies = () => {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStudies();
  }, []);

  return { studies, loading, error, refetch: fetchStudies };
};
```

## Routing Architecture

### Route Structure
```typescript
// Protected route pattern
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### Route Categories
1. **Public Routes**: `/login`
2. **Protected Routes**: All others require authentication
3. **Nested Routes**: Multi-step forms with sub-routes

## API Integration

### HTTP Client Pattern
```typescript
// Centralized API client with authentication
export const apiGet = async (endpoint: string) => {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API.baseURL}${endpoint}`, {
    headers: { ...authHeaders }
  });
  return handleResponse(response);
};
```

### Error Handling
- **401 Unauthorized**: Automatic redirect to login
- **Network Errors**: User-friendly error messages
- **Validation Errors**: Field-level error display

## Performance Optimization

### Code Splitting
- Route-level code splitting with React.lazy()
- Component-level splitting for large components

### Rendering Optimization
- React.memo for expensive components
- useMemo and useCallback for expensive calculations
- Virtualization for large lists

### Bundle Optimization
- Tree shaking with ES modules
- Asset optimization with Vite
- Lazy loading of non-critical resources

## Security Considerations

### Authentication Security
- JWT tokens stored securely
- Automatic token refresh
- Session timeout handling

### Data Security
- Input validation and sanitization
- XSS prevention with React's built-in protection
- CSRF protection via SameSite cookies

### API Security
- All API calls authenticated
- Sensitive data encrypted in transit
- Error messages don't leak sensitive information

## Development Workflow

### Local Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Quality
- **TypeScript**: Compile-time type checking
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting (configured in ESLint)

### Testing Strategy
- **Unit Tests**: Component testing with React Testing Library
- **Integration Tests**: Page-level functionality
- **E2E Tests**: Critical user flows

## Deployment Architecture

### Build Process
1. TypeScript compilation
2. Vite bundling and optimization
3. Asset optimization and compression
4. Environment variable injection

### Hosting Strategy
- **Development**: Local Vite dev server
- **Staging**: AWS S3 + CloudFront
- **Production**: AWS S3 + CloudFront with custom domain

---

**Version**: 1.0.0  
**Last Updated**: October 26, 2024  
**Next Review**: November 26, 2024
