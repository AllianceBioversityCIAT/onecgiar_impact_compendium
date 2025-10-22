import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Studies from '@/pages/Studies';
import StudyDetail from '@/pages/StudyDetail';
import CreateStudy from '@/pages/CreateStudy';
import Reports from '@/pages/Reports';
import Admin from '@/pages/Admin';
import Login from '@/pages/Login';
import ProtectedRoute from '@/components/ProtectedRoute';
import '@/styles/globals.css';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <SidebarProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/studies" element={
                  <ProtectedRoute>
                    <Layout>
                      <Studies />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/studies/:id" element={
                  <ProtectedRoute>
                    <Layout>
                      <StudyDetail />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/studies/create" element={
                  <ProtectedRoute requiredRole="Researcher">
                    <Layout>
                      <CreateStudy />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <Layout>
                      <Reports />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="Admin">
                    <Layout>
                      <Admin />
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
              
              <Toaster />
            </div>
          </Router>
        </SidebarProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
