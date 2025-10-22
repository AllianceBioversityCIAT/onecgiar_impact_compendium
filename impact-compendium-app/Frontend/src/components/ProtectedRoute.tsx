import React from 'react';
import { authService } from '../services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  if (!authService.isAuthenticated()) {
    window.location.href = '/login';
    return null;
  }

  return <>{children}</>;
};
