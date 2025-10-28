import React, { useState, useEffect } from 'react';
import { UserTable } from './UserTable';
import { CreateUserModal } from './CreateUserModal';
import { EditUserModal } from './EditUserModal';
import { userService } from '../../services/userService';

interface User {
  username: string;
  email: string;
  status: string;
  enabled: boolean;
  created_date: string;
  last_modified_date: string;
  mfa_enabled: boolean;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userData = await userService.listUsers();
      setUsers(userData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (userData: { email: string; temporaryPassword: string; sendEmail: boolean }) => {
    try {
      await userService.createUser(userData);
      setShowCreateModal(false);
      await loadUsers(); // Refresh the list
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  const handleToggleUserStatus = async (username: string, enabled: boolean) => {
    try {
      await userService.updateUserStatus(username, enabled);
      await loadUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await userService.deleteUser(username);
      await loadUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleResetPassword = async (username: string) => {
    if (!confirm('Are you sure you want to reset this user\'s password?')) {
      return;
    }

    try {
      await userService.resetPassword(username);
      alert('Password reset successfully. The user will receive instructions via email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleUpdateUser = async (username: string, enabled: boolean) => {
    try {
      await userService.updateUserStatus(username, enabled);
      await loadUsers(); // Refresh the list
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">User Management</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage users in your AWS Cognito User Pool
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[var(--ic-color-primary)] text-black px-4 py-2 rounded-md hover:bg-[var(--ic-color-accent)] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <UserTable
        users={users}
        loading={loading}
        onToggleStatus={handleToggleUserStatus}
        onDeleteUser={handleDeleteUser}
        onResetPassword={handleResetPassword}
        onEditUser={handleEditUser}
      />

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleUpdateUser}
        />
      )}
    </div>
  );
};
