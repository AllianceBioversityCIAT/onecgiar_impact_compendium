import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global.css';

// Components
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Studies } from './pages/Studies';
import { CreateStudyStep1 } from './pages/CreateStudy/Step1';
import { CreateStudyStep2 } from './pages/CreateStudy/Step2';
import { CreateStudyStep3 } from './pages/CreateStudy/Step3';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/studies" element={
          <ProtectedRoute>
            <Studies />
          </ProtectedRoute>
        } />
        <Route path="/studies/new/step-1" element={
          <ProtectedRoute>
            <CreateStudyStep1 />
          </ProtectedRoute>
        } />
        <Route path="/studies/new/step-2" element={
          <ProtectedRoute>
            <CreateStudyStep2 />
          </ProtectedRoute>
        } />
        <Route path="/studies/new/step-3" element={
          <ProtectedRoute>
            <CreateStudyStep3 />
          </ProtectedRoute>
        } />
        <Route path="/studies/edit/:id/step-1" element={
          <ProtectedRoute>
            <CreateStudyStep1 />
          </ProtectedRoute>
        } />
        <Route path="/studies/edit/:id/step-2" element={
          <ProtectedRoute>
            <CreateStudyStep2 />
          </ProtectedRoute>
        } />
        <Route path="/studies/edit/:id/step-3" element={
          <ProtectedRoute>
            <CreateStudyStep3 />
          </ProtectedRoute>
        } />
        <Route path="/studies/edit/:id" element={
          <ProtectedRoute>
            <CreateStudyStep1 />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
