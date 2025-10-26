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
    <div className="min-h-screen bg-white flex">
      {/* Left Panel - Login Form */}
      <div className="w-[873.5px] bg-white flex flex-col">
        {/* Logo Section */}
        <div className="flex items-center gap-3 absolute left-[212.75px] top-[122.7px]">
          {/* Logo Icon */}
          <div className="w-12 h-12 relative">
            <div className="absolute left-[25%] right-[25%] top-[8.33%] bottom-[33.33%] bg-[#FFC84F]"></div>
            <div className="absolute left-[37.5%] right-[37.5%] top-[33.33%] bottom-[33.33%] bg-[#F07E28]"></div>
          </div>
          
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
        <div className="flex flex-col gap-2 absolute w-[448px] left-[212.75px] top-[218.7px]">
          <h1 className="font-inter font-normal text-[28px] leading-[42px] tracking-[0.382812px] text-[#333333]">
            Log in to Impact Compendium
          </h1>
          <p className="font-inter font-normal text-[14px] leading-[22px] tracking-[-0.150391px] text-[#777777]">
            Use your organization email to easily connect
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="absolute w-[448px] left-[212.75px] top-[323.1px]">
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
              className="w-[448px] h-[44px] px-3 py-1 bg-[#F3F3F5] border border-[#E5E5E5] rounded-[10px] font-inter font-normal text-[14px] leading-[17px] tracking-[-0.150391px] text-[#717182] placeholder:text-[#717182]"
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
              className="w-[448px] h-[44px] px-3 py-1 bg-[#F3F3F5] border border-[#E5E5E5] rounded-[10px] font-inter font-normal text-[14px] leading-[17px] tracking-[-0.150391px] text-[#717182] placeholder:text-[#717182]"
              required
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex justify-between items-center mb-[20px]">
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
              className="font-inter font-normal text-[13px] leading-5 tracking-[-0.0761719px] text-[#F07E28] hover:underline"
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
            className="w-[448px] h-[48px] bg-gradient-to-br from-[#FFC84F] to-[#F07E28] rounded-[10px] font-inter font-medium text-[14px] leading-5 tracking-[-0.150391px] text-black hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Footer Section */}
        <div className="absolute w-[448px] left-[212.75px] top-[766.1px] flex flex-col gap-3">
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
      <div className="w-[809.5px] h-screen relative">
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
