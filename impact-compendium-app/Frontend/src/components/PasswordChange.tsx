import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

interface PasswordChangeProps {
  onBack: () => void;
}

export const PasswordChange: React.FC<PasswordChangeProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setIsLoading(true);
    try {
      await authService.confirmNewPassword(newPassword);
      setSuccess('Password changed successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Panel - Password Change Form */}
      <div className="w-full lg:w-[873.5px] bg-white flex flex-col px-4 lg:px-0 py-8 lg:py-0">
        {/* Logo Section */}
        <div className="flex items-center justify-center mx-auto lg:absolute lg:left-[212.75px] lg:top-[122.7px] mb-8 lg:mb-0">
          <img 
            src="/logo.svg" 
            alt="Impact Compendium Logo" 
            className="h-8"
          />
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-2 mx-auto lg:absolute w-full max-w-[448px] lg:left-[212.75px] lg:top-[218.7px] mb-8 lg:mb-0">
          <h1 className="font-inter font-bold text-[24px] lg:text-[28px] leading-[36px] lg:leading-[42px] tracking-[0.382812px] text-[#333333]">
            Change Password
          </h1>
          <p className="font-inter font-normal text-[14px] leading-[22px] tracking-[-0.150391px] text-[#777777]">
            Enter your new password to complete the setup
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handlePasswordChange} className="mx-auto lg:absolute w-full max-w-[448px] lg:left-[212.75px] lg:top-[323.1px]">
          {/* New Password Field */}
          <div className="flex flex-col gap-2 mb-[20px]">
            <label className="font-inter font-medium text-[14px] leading-[14px] tracking-[-0.150391px] text-[#333333]">
              New password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                className="w-full h-[44px] px-3 py-1 pr-10 bg-[#F3F3F5] border border-[#E5E5E5] rounded-[10px] font-inter font-normal text-[14px] leading-[17px] tracking-[-0.150391px] text-[#717182] placeholder:text-[#717182]"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#717182] hover:text-[#333333]"
              >
                {showNewPassword ? (
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

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-2 mb-[20px]">
            <label className="font-inter font-medium text-[14px] leading-[14px] tracking-[-0.150391px] text-[#333333]">
              Confirm password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="w-full h-[44px] px-3 py-1 pr-10 bg-[#F3F3F5] border border-[#E5E5E5] rounded-[10px] font-inter font-normal text-[14px] leading-[17px] tracking-[-0.150391px] text-[#717182] placeholder:text-[#717182]"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#717182] hover:text-[#333333]"
              >
                {showConfirmPassword ? (
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

          {/* Password Requirements */}
          <div className="mb-[20px] p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-600 mb-1">Password requirements:</p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• At least 8 characters long</li>
              <li>• One uppercase letter (A-Z)</li>
              <li>• One lowercase letter (a-z)</li>
              <li>• One number (0-9)</li>
            </ul>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[48px] bg-gradient-to-br from-[#FFC84F] to-[#F07E28] rounded-[10px] font-inter font-medium text-[14px] leading-5 tracking-[-0.150391px] text-black hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? 'Changing Password...' : 'Change Password'}
            </button>
            
            <button
              type="button"
              onClick={onBack}
              className="w-full h-[48px] bg-white border border-[#E5E5E5] rounded-[10px] font-inter font-medium text-[14px] leading-5 tracking-[-0.150391px] text-[#333333] hover:bg-gray-50 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </form>

        {/* Footer Section */}
        <div className="mx-auto lg:absolute w-full max-w-[448px] lg:left-[212.75px] lg:top-[766.1px] flex flex-col gap-3 mt-8 lg:mt-0">
          <p className="font-inter font-normal text-[12px] leading-[19px] text-[#999999]">
            Need help? Contact PRMS technical support at{' '}
            <a href="mailto:prms-tech-support@cgiar.org" className="text-[#F07E28] hover:underline">
              prms-tech-support@cgiar.org
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
