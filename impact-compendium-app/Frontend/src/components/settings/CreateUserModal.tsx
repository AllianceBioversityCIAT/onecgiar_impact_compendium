import React, { useState } from 'react';
import { EmailValidator } from '../../utils/emailValidation';

interface CreateUserModalProps {
  onClose: () => void;
  onSubmit: (userData: { email: string; temporaryPassword: string; sendEmail: boolean }) => Promise<void>;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    email: '',
    temporaryPassword: '',
    sendEmail: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const warning = EmailValidator.getCaseWarning(email);
    setEmailWarning(warning);
  };

  const normalizeEmail = (email: string) => {
    return EmailValidator.normalize(email);
  };

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    // Ensure at least one character from each required category
    let password = '';
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Fill remaining 8 characters randomly
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password to randomize character positions
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setFormData(prev => ({ ...prev, temporaryPassword: password }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.temporaryPassword) {
      setError('Email and temporary password are required');
      return;
    }

    // Validate email
    const validation = EmailValidator.validate(formData.email);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        ...formData,
        email: validation.normalizedEmail
      });
    } catch (err) {
      console.error('❌ Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                const email = e.target.value;
                setFormData(prev => ({ ...prev, email }));
                validateEmail(email);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ic-color-primary)] focus:border-transparent"
              placeholder="user@example.com"
              required
            />
            {emailWarning && (
              <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-amber-800 text-xs flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {emailWarning}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temporary Password
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.temporaryPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, temporaryPassword: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ic-color-primary)] focus:border-transparent"
                placeholder="Enter temporary password"
                required
              />
              <button
                type="button"
                onClick={generatePassword}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                Generate
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              User will be required to change this password on first login
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="sendEmail"
              checked={formData.sendEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, sendEmail: e.target.checked }))}
              className="h-4 w-4 text-[var(--ic-color-primary)] focus:ring-[var(--ic-color-primary)] border-gray-300 rounded"
            />
            <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-700">
              Send welcome email to user
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[var(--ic-color-primary)] text-white rounded-md hover:bg-[var(--ic-color-accent)] disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
