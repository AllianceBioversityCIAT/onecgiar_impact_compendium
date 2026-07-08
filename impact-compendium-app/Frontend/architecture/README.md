# Impact Compendium Frontend Architecture

This directory contains comprehensive documentation for the Impact Compendium frontend architecture, following clean architecture principles and React best practices.

## Documentation Structure

### Core Architecture
- **[Frontend Architecture Overview](./FRONTEND_ARCHITECTURE.md)** - Complete system architecture
- **[Component Architecture](./COMPONENT_ARCHITECTURE.md)** - Component design patterns and structure
- **[State Management](./STATE_MANAGEMENT.md)** - Authentication and application state
- **[Routing Architecture](./ROUTING_ARCHITECTURE.md)** - Navigation and route protection

### Development Guides
- **[Development Guide](./DEVELOPMENT_GUIDE.md)** - Setup and development workflow
- **[Testing Strategy](./TESTING_STRATEGY.md)** - Frontend testing approach
- **[Performance Guide](./PERFORMANCE_GUIDE.md)** - Optimization strategies

### Integration
- **[API Integration](./API_INTEGRATION.md)** - Backend communication patterns
- **[AWS Integration](./AWS_INTEGRATION.md)** - Cognito authentication setup

## Quick Reference

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Authentication**: AWS Amplify + Cognito
- **State Management**: React Context + Hooks
- **Testing**: Vitest + React Testing Library

### Key Principles
1. **Clean Architecture**: Separation of concerns with clear layers
2. **Type Safety**: Full TypeScript coverage
3. **Component Reusability**: Modular UI components
4. **Performance**: Optimized rendering and lazy loading
5. **Accessibility**: WCAG 2.1 AA compliance
6. **Security**: Secure authentication and data handling

### Project Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Route-level components
├── services/           # API and external service integrations
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── styles/             # Global styles and design tokens
├── layouts/            # Page layout components
└── mocks/              # Development mock data
```

## Getting Started

1. Read the [Frontend Architecture Overview](./FRONTEND_ARCHITECTURE.md)
2. Review the [Development Guide](./DEVELOPMENT_GUIDE.md)
3. Understand the [Component Architecture](./COMPONENT_ARCHITECTURE.md)
4. Follow the [API Integration](./API_INTEGRATION.md) patterns

## Maintenance

This documentation is maintained alongside the codebase. When making architectural changes:

1. Update relevant documentation files
2. Ensure examples remain current
3. Update version numbers and dates
4. Review cross-references between documents

---

**Last Updated**: October 26, 2024  
**Version**: 1.0.0  
**Maintainer**: Impact Compendium Team
