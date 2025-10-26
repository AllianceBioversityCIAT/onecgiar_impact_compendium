# Impact Compendium Frontend

A modern React application for managing and visualizing agricultural research impact studies, built with TypeScript, Tailwind CSS, and AWS Cognito authentication.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm 8.0.0 or higher

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd impact-compendium-app/Frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

Visit `http://localhost:3000` to view the application.

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Architecture](#-architecture)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

## ✨ Features

### Core Functionality
- **🔐 Authentication**: Secure login with AWS Cognito
- **📊 Dashboard**: Interactive data visualization and management
- **📝 Study Management**: Multi-step study creation and editing
- **🔍 Search & Filter**: Advanced filtering and search capabilities
- **📱 Responsive Design**: Mobile-first responsive interface
- **🎨 Modern UI**: Clean, accessible design with Tailwind CSS

### User Experience
- **⚡ Fast Loading**: Optimized with Vite and code splitting
- **🔄 Real-time Updates**: Live data synchronization
- **♿ Accessibility**: WCAG 2.1 AA compliant
- **🌐 Internationalization**: Multi-language support ready
- **📴 Offline Support**: Progressive Web App capabilities

## 🛠 Technology Stack

### Core Technologies
- **[React 18](https://reactjs.org/)** - UI library with concurrent features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **[React Router v6](https://reactrouter.com/)** - Client-side routing

### Styling & UI
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **Custom Design System** - Consistent design tokens and components
- **Responsive Design** - Mobile-first approach

### State Management
- **React Context** - Global authentication state
- **React Hooks** - Local component state
- **Custom Hooks** - Reusable stateful logic

### Authentication & Security
- **[AWS Amplify](https://aws.amazon.com/amplify/)** - Authentication framework
- **AWS Cognito** - User pool and identity management
- **JWT Tokens** - Secure API communication

### Development Tools
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **Vitest** - Unit testing framework
- **React Testing Library** - Component testing

## 📁 Project Structure

```
src/
├── components/              # Reusable UI Components
│   ├── ui/                 # Base UI components (Button, Input, etc.)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Table.tsx
│   │   └── index.ts
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

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCKS=false

# AWS Cognito Configuration
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=your_user_pool_id
VITE_COGNITO_CLIENT_ID=your_client_id

# Application Configuration
VITE_APP_NAME=Impact Compendium
VITE_NODE_ENV=development

# Feature Flags
VITE_ENABLE_DEBUG_LOGS=false
VITE_ENABLE_PERFORMANCE_MONITORING=false
```

### Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Code Quality Checks**
   ```bash
   npm run lint        # Check for issues
   npm run type-check  # Verify TypeScript
   ```

3. **Testing**
   ```bash
   npm run test        # Run all tests
   npm run test:watch  # Watch mode for development
   ```

### Code Style Guidelines

- **TypeScript**: Full type coverage required
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS utility classes
- **Testing**: React Testing Library for component tests
- **Naming**: PascalCase for components, camelCase for functions

## 🏗 Architecture

### Component Architecture

The application follows **Atomic Design** principles:

- **Atoms**: Basic UI elements (Button, Input, Badge)
- **Molecules**: Combinations of atoms (SearchableSelect, DatePicker)
- **Organisms**: Complex components (Table, HeaderBar, Pagination)
- **Templates**: Page layouts (AppLayout, FormLayout)
- **Pages**: Route-level components (Dashboard, CreateStudy)

### State Management

```typescript
// Global Authentication State
const AuthContext = createContext<{
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}>();

// Local Component State
const [studies, setStudies] = useState<Study[]>([]);
const [loading, setLoading] = useState(true);

// Custom Hooks for Reusable Logic
const { data, loading, error } = useApi<Study[]>('/studies');
```

### API Integration

```typescript
// Centralized API client with authentication
export const apiGet = async (endpoint: string) => {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API.baseURL}${endpoint}`, {
    headers: { ...authHeaders }
  });
  return handleResponse(response);
};

// Typed API methods
export const studyAPI = {
  getAll: () => apiGet('/studies'),
  getById: (id: string) => apiGet(`/studies/${id}`),
  create: (data: StudyData) => apiPost('/studies', data),
  update: (id: string, data: StudyData) => apiPut(`/studies/${id}`, data),
  delete: (id: string) => apiDelete(`/studies/${id}`)
};
```

For detailed architecture documentation, see [architecture/README.md](./architecture/README.md).

## 🧪 Testing

### Testing Strategy

- **Unit Tests**: Individual component testing
- **Integration Tests**: Page-level functionality
- **E2E Tests**: Critical user flows (planned)

### Running Tests

```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm run test Dashboard.test.tsx
```

### Test Examples

```typescript
// Component Unit Test
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

test('renders button with correct text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});

// Integration Test
import { renderWithProviders } from '../test-utils';
import { Dashboard } from './Dashboard';

test('loads and displays studies', async () => {
  renderWithProviders(<Dashboard />);
  await waitFor(() => {
    expect(screen.getByText('Studies Dashboard')).toBeInTheDocument();
  });
});
```

## 🚀 Deployment

### Build Process

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

### Deployment Targets

- **Development**: Local development server
- **Staging**: AWS S3 + CloudFront
- **Production**: AWS S3 + CloudFront with custom domain

### Environment-Specific Configuration

```typescript
// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// API URL configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (isProduction ? 'https://api.impact-compendium.org' : 'http://localhost:8000');
```

## 🤝 Contributing

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone <your-fork-url>
   cd impact-compendium-app/Frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Changes**
   - Follow coding standards
   - Add tests for new features
   - Update documentation as needed

5. **Submit Pull Request**
   - Ensure all tests pass
   - Include clear description of changes
   - Reference any related issues

### Code Review Process

- All changes require code review
- Automated checks must pass (linting, tests, type checking)
- Documentation must be updated for significant changes
- Performance impact should be considered

### Commit Message Format

```
type: brief description

Longer description if needed

Closes #issue-number
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 📚 Additional Resources

### Documentation
- [Architecture Overview](./architecture/FRONTEND_ARCHITECTURE.md)
- [Component Architecture](./architecture/COMPONENT_ARCHITECTURE.md)
- [Development Guide](./architecture/DEVELOPMENT_GUIDE.md)
- [API Integration](./architecture/API_INTEGRATION.md)

### External Resources
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide)
- [AWS Amplify Documentation](https://docs.amplify.aws)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

For questions and support:

- **Documentation**: Check the [architecture docs](./architecture/)
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions for questions

---

**Version**: 1.0.0  
**Last Updated**: October 26, 2024  
**Maintainer**: Impact Compendium Team
