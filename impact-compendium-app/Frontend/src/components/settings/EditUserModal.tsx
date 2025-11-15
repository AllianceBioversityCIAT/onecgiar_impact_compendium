import React, { useState } from 'react';

interface User {
  username: string;
  email: string;
  status: string;
  enabled: boolean;
  created_date: string;
  last_modified_date: string;
  mfa_enabled: boolean;
}

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSubmit: (username: string, enabled: boolean) => Promise<void>;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  onClose,
  onSubmit,
}) => {
  const [enabled, setEnabled] = useState(user.enabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      await onSubmit(user.username, enabled);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
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
              value={user.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              className="h-4 w-4 text-[var(--ic-color-primary)] focus:ring-[var(--ic-color-primary)] border-gray-300 rounded"
            />
            <label
              htmlFor="enabled"
              className="ml-2 block text-sm text-gray-700"
            >
              User account is enabled
            </label>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              User Information
            </h4>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                <strong>Status:</strong> {user.status}
              </p>
              <p>
                <strong>Created:</strong>{' '}
                {new Date(user.created_date).toLocaleDateString()}
              </p>
              <p>
                <strong>Last Modified:</strong>{' '}
                {new Date(user.last_modified_date).toLocaleDateString()}
              </p>
              <p>
                <strong>MFA:</strong>{' '}
                {user.mfa_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
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
              className="px-4 py-2 bg-[var(--ic-color-primary)] text-black rounded-md hover:bg-[var(--ic-color-accent)] disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
