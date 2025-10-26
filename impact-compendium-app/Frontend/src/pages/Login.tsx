import React, { useState } from 'react';
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
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
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
      <div className="w-full lg:w-[873.5px] bg-white flex flex-col px-4 lg:px-0 py-8 lg:py-0">
        {/* Logo Section */}
        <div className="flex items-center gap-3 mx-auto lg:absolute lg:left-[212.75px] lg:top-[122.7px] mb-8 lg:mb-0">
          {/* Logo Icon */}
          <img 
            src="/logo.svg" 
            alt="Impact Compendium Logo" 
            className="h-12"
          />
          
          {/* Logo Text */}
          <div className="flex flex-col">
            <div className="font-inter font-normal text-[20px] leading-6 tracking-[-0.449219px] text-[#333333]">
              CGIAR
            </div>
            <div className="font-inter font-normal text-[11px] leading-4 tracking-[0.564453px] text-[#777777]">
              Impact Compendium
            </div>
          </div>
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-2 mx-auto lg:absolute w-full max-w-[448px] lg:left-[212.75px] lg:top-[218.7px] mb-8 lg:mb-0">
          <h1 className="font-inter font-normal text-[24px] lg:text-[28px] leading-[36px] lg:leading-[42px] tracking-[0.382812px] text-[#333333]">
            Log in to Impact Compendium
          </h1>
          <p className="font-inter font-normal text-[14px] leading-[22px] tracking-[-0.150391px] text-[#777777]">
            Use your organization email to easily connect
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="mx-auto lg:absolute w-full max-w-[448px] lg:left-[212.75px] lg:top-[323.1px]">
          {/* Email Field */}
          <div className="flex flex-col gap-2 mb-[20px]">
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
          <div className="flex flex-col gap-2 mb-[20px]">
            <label className="font-inter font-medium text-[14px] leading-[14px] tracking-[-0.150391px] text-[#333333]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full h-[44px] px-3 py-1 bg-[#F3F3F5] border border-[#E5E5E5] rounded-[10px] font-inter font-normal text-[14px] leading-[17px] tracking-[-0.150391px] text-[#717182] placeholder:text-[#717182]"
              required
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-[20px]">
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
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[48px] bg-gradient-to-br from-[#FFC84F] to-[#F07E28] rounded-[10px] font-inter font-medium text-[14px] leading-5 tracking-[-0.150391px] text-black hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Footer Section */}
        <div className="mx-auto lg:absolute w-full max-w-[448px] lg:left-[212.75px] lg:top-[766.1px] flex flex-col gap-3 mt-8 lg:mt-0">
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
