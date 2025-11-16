/**
 * =============================================================================
 * Impact Compendium Frontend - Application Entry Point
 * =============================================================================
 *
 * This is the main entry point for the Impact Compendium React application.
 * It sets up the routing, authentication context, and global configuration.
 *
 * Architecture Overview:
 * - React 18 with TypeScript for type safety
 * - React Router v6 for client-side routing
 * - AWS Amplify for authentication via Cognito
 * - Vite for fast development and building
 * - Tailwind CSS for styling
 *
 * Key Features:
 * - Protected routes requiring authentication
 * - Centralized authentication state management
 * - Multi-step study creation workflow
 * - Responsive dashboard with data visualization
 *
 * @author Impact Compendium Team
 * @version 1.0.0
 * @since 2024-10-26
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Global styles - Tailwind CSS base styles and custom design tokens
import './styles/global.css';

// AWS Amplify configuration - Sets up Cognito authentication
import './aws-config';

// Authentication Context - Provides auth state throughout the app
import { AuthProvider } from './contexts/AuthContext';

// Environment Banner - Shows testing environment indicator
import { EnvironmentBanner } from './components/ui/EnvironmentBanner';

// Route Protection Component
import { ProtectedRoute } from './components/ProtectedRoute';

// Page Components
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Studies } from './pages/Studies';
import { Settings } from './pages/Settings';
import { CreateStudyStep1 } from './pages/CreateStudy/Step1';
import { CreateStudyStep2 } from './pages/CreateStudy/Step2';
import { CreateStudyStep3 } from './pages/CreateStudy/Step3';

/**
 * Main Application Component
 *
 * Defines the routing structure and authentication flow:
 * - Public routes: /login
 * - Protected routes: All others require authentication
 * - Multi-step study creation: /studies/new/step-1, step-2, step-3
 * - Study editing: /studies/edit/:id/step-1, step-2, step-3
 * - Dashboard with data management: /dashboard
 *
 * @returns {JSX.Element} The main application component
 */
function App(): JSX.Element {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <EnvironmentBanner />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <Routes>
        {/* Public Routes - No authentication required */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes - Authentication required */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/studies"
          element={
            <ProtectedRoute>
              <Studies />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Multi-step Study Creation Workflow - New Studies */}
        <Route
          path="/studies/new/step-1"
          element={
            <ProtectedRoute>
              <CreateStudyStep1 />
            </ProtectedRoute>
          }
        />

        <Route
          path="/studies/new/step-2"
          element={
            <ProtectedRoute>
              <CreateStudyStep2 />
            </ProtectedRoute>
          }
        />

        <Route
          path="/studies/new/step-3"
          element={
            <ProtectedRoute>
              <CreateStudyStep3 />
            </ProtectedRoute>
          }
        />

        {/* Multi-step Study Editing Workflow - Existing Studies */}
        <Route
          path="/studies/edit/:id/step-1"
          element={
            <ProtectedRoute>
              <CreateStudyStep1 />
            </ProtectedRoute>
          }
        />

        <Route
          path="/studies/edit/:id/step-2"
          element={
            <ProtectedRoute>
              <CreateStudyStep2 />
            </ProtectedRoute>
          }
        />

        <Route
          path="/studies/edit/:id/step-3"
          element={
            <ProtectedRoute>
              <CreateStudyStep3 />
            </ProtectedRoute>
          }
        />

        {/* Study Edit Entry Point - Redirects to Step 1 */}
        <Route
          path="/studies/edit/:id"
          element={
            <ProtectedRoute>
              <CreateStudyStep1 />
            </ProtectedRoute>
          }
        />

        {/* Fallback Route - Redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

/**
 * Application Bootstrap
 *
 * Initializes the React application with:
 * - Authentication provider for global auth state
 * - Router for navigation
 * - Error boundaries (implicit via React 18)
 * - Strict mode for development warnings
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error(
    'Root element not found. Make sure index.html has a div with id="root"'
  );
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
