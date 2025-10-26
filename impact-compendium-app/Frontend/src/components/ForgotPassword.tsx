import React, { useState } from 'react';
import { Input } from './ui/Input';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';

interface ForgotPasswordProps {
  onBack: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await resetPassword({ username: email });
      setStep('code');
      setSuccess('Reset code sent to your email');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword: newPassword,
      });
      setSuccess('Password reset successfully! You can now login.');
      setTimeout(() => onBack(), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {step === 'email' ? 'Reset Password' : 'Enter Reset Code'}
        </h3>
        <p className="text-sm text-gray-600">
          {step === 'email' 
            ? 'Enter your email to receive a reset code'
            : 'Enter the code sent to your email and your new password'
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      {step === 'email' ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            label="Reset Code"
            type="text"
            placeholder="Enter the code from your email"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      <button
        onClick={onBack}
        className="w-full text-sm text-gray-600 hover:text-yellow-600 transition-colors"
      >
        Back to Login
      </button>
    </div>
  );
};
