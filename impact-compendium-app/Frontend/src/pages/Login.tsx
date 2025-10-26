import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ForgotPassword } from '../components/ForgotPassword';
import { PasswordChange } from '../components/PasswordChange';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Load saved email on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      
      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  if (showPasswordChange) {
    return <PasswordChange onBack={() => setShowPasswordChange(false)} />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-[873.5px] bg-white flex flex-col justify-center items-center px-4 lg:px-0 py-8 lg:py-0">
        <div className="w-full max-w-[448px] space-y-8">
          {/* Logo Section */}
          <div className="flex items-center justify-center">
            <img 
              src="/logo.svg" 
              alt="Impact Compendium Logo" 
              className="h-8"
            />
          </div>

          {/* Header Section */}
          <div className="flex flex-col gap-2 text-center">
            <h1 className="font-inter font-bold text-[24px] lg:text-[28px] leading-[36px] lg:leading-[42px] tracking-[0.382812px] text-[#333333]">
              Log in
            </h1>
            <p className="font-inter font-normal text-[14px] leading-[22px] tracking-[-0.150391px] text-[#777777]">
              Enter your email and password to access your account
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="font-inter font-medium text-[14px] leading-[14px] tracking-[-0.150391px] text-[#333333]">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organization.org"
                className="w-full h-[44px] px-3 py-1 bg-[#F3F3F5] border border-[#E5E5E5] rounded-[10px] font-inter font-normal text-[14px] leading-[17px] tracking-[-0.150391px] text-[#717182] placeholder:text-[#717182]"
                required
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="font-inter font-medium text-[14px] leading-[14px] tracking-[-0.150391px] text-[#333333]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-[44px] px-3 py-1 pr-10 bg-[#F3F3F5] border border-[#E5E5E5] rounded-[10px] font-inter font-normal text-[14px] leading-[17px] tracking-[-0.150391px] text-[#717182] placeholder:text-[#717182]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#717182] hover:text-[#333333]"
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
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="remember" className="font-inter font-normal text-[13px] leading-5 tracking-[-0.0761719px] text-[#777777]">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="font-inter font-normal text-[13px] leading-5 tracking-[-0.0761719px] text-[#F07E28] hover:underline text-left sm:text-right"
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-gradient-to-br from-[#FFC84F] to-[#F07E28] rounded-[10px] font-inter font-medium text-[14px] leading-5 tracking-[-0.150391px] text-black hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Footer Section */}
          <div className="flex flex-col gap-3 text-center">
            <p className="font-inter font-normal text-[12px] leading-[19px] text-[#999999]">
              Need help? Contact PRMS technical support at{' '}
              <a href="mailto:prms-tech-support@cgiar.org" className="text-[#F07E28] hover:underline">
                prms-tech-support@cgiar.org
              </a>
            </p>
            <p className="font-inter font-normal text-[12px] leading-[18px] text-[#999999]">
              By continuing, you acknowledge that you understand{' '}
              <a href="#" className="text-[#F07E28] hover:underline">
                Terms & Conditions
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Background Image */}
      <div className="hidden lg:block w-[809.5px] h-screen relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/specs/images/logo.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(185,106,40,0.15)] to-[rgba(240,126,40,0.1)]" />
      </div>
    </div>
  );
};
