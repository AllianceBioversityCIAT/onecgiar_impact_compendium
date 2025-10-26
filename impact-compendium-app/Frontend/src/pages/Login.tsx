import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { PasswordChange } from '../components/PasswordChange';
import { ForgotPassword } from '../components/ForgotPassword';
import { useAuth } from '../contexts/AuthContext';
import { signIn } from 'aws-amplify/auth';
import { signOut } from 'aws-amplify/auth';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Clear any existing session first
      try {
        await signOut();
      } catch (e) {
        // Ignore signOut errors
      }

      // Try direct Amplify signIn to detect password change requirement
      let username = formData.email;
      if (formData.email === 'testuser@example.com') {
        username = 'testuser';
      }
      
      const signInResult = await signIn({
        username: username,
        password: formData.password,
      });

      if (signInResult.isSignedIn) {
        await login(formData.email, formData.password);
        navigate('/dashboard', { replace: true });
      } else if (signInResult.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        setNeedsPasswordChange(true);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChanged = async () => {
    try {
      // User is already authenticated after password change, just refresh the auth context
      await refreshUser();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to complete login after password change.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Card Container */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 mb-4 flex items-center justify-center">
              <svg className="h-12 w-12" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 51 42">
                <path d="M25.3019 0.809967L50.3018 15.8198V25.7963L25.3019 40.81L0.301758 25.7963V15.8199L25.3019 0.809967Z" fill="#FDC82F"></path>
                <path fillRule="evenodd" clipRule="evenodd" d="M0.301758 15.8198L25.3018 0.809967L50.3018 15.8198V25.7963L25.3018 40.81L0.301758 25.7963V15.8198ZM25.3018 34.441L44.9985 22.6122V19.0051L44.9975 19.0045L25.3018 30.8297L5.60602 19.0045L5.60506 19.0051V22.6122L25.3018 34.441ZM25.3018 25.3146L40.4036 16.2476L36.7247 14.0398L25.3018 20.8981L13.8789 14.0398L10.2 16.2476L25.3018 25.3146ZM25.3018 15.383L32.1308 11.2829L25.3018 7.18464L18.4728 11.2829L25.3018 15.383Z" fill="#000000"></path>
                <path d="M25.3019 0.809967L0.301758 15.8199V25.7963L25.3018 40.81L25.3019 0.809967Z" fill="#FDC82F" fillOpacity="0.3"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Impact Compendium
            </h2>
            <p className="text-gray-600 text-sm">
              Sign in to your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Login Form, Password Change, or Forgot Password */}
          {showForgotPassword ? (
            <ForgotPassword onBack={() => setShowForgotPassword(false)} />
          ) : needsPasswordChange ? (
            <PasswordChange 
              onPasswordChanged={handlePasswordChanged}
              onError={setError}
            />
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Input
                label="Email address"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
          )}

          {/* Forgot Password */}
          <div className="mt-6 text-center">
            <button 
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-gray-600 hover:text-yellow-600 transition-colors duration-200"
            >
              Forgot your password?
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2025 CGIAR Alliance. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
