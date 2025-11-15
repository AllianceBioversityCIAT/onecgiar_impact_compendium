import React, { useState, useEffect } from 'react';
import { UserTable } from './UserTable';
import { CreateUserModal } from './CreateUserModal';
import { EditUserModal } from './EditUserModal';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { SuccessNotification } from '../ui/SuccessNotification';
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
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    confirmText: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    action: () => {}
  });
  const [successNotification, setSuccessNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userData = await userService.listUsers();
      setUsers(userData);
      setFilteredUsers(userData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (userData: { email: string; temporaryPassword: string; sendEmail: boolean }) => {
    try {
      await userService.createUser(userData);
      setShowCreateModal(false);
      await loadUsers(); // Refresh the list
      setSuccessNotification({
        isOpen: true,
        title: 'User Created',
        message: `${userData.email} has been successfully created and added to the system.`
      });
    } catch (err) {
      console.error('❌ UserManagement: Error creating user:', err);
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
    const user = users.find(u => u.username === username);
    setConfirmAction({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete ${user?.email || username}? This action cannot be undone and will permanently remove the user from the system.`,
      type: 'danger',
      confirmText: 'Delete User',
      action: async () => {
        try {
          await userService.deleteUser(username);
          await loadUsers();
          setSuccessNotification({
            isOpen: true,
            title: 'User Deleted',
            message: `${user?.email || username} has been successfully deleted.`
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to delete user');
        }
        setConfirmAction(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleResetPassword = async (username: string) => {
    const user = users.find(u => u.username === username);
    setConfirmAction({
      isOpen: true,
      title: 'Reset Password',
      message: `Reset password for ${user?.email || username}? The user will receive instructions via email to set a new password.`,
      type: 'info',
      confirmText: 'Reset Password',
      action: async () => {
        try {
          await userService.resetPassword(username);
          setSuccessNotification({
            isOpen: true,
            title: 'Password Reset',
            message: `Password reset instructions have been sent to ${user?.email || username}.`
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to reset password');
        }
        setConfirmAction(prev => ({ ...prev, isOpen: false }));
      }
    });
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

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search users by email or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#FDC82F] focus:border-transparent"
          />
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-500 mt-2">
            Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} matching "{searchTerm}"
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <UserTable
        users={filteredUsers}
        loading={loading}
        onToggleStatus={handleToggleUserStatus}
        onDeleteUser={handleDeleteUser}
        onResetPassword={handleResetPassword}
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

      <ConfirmationModal
        isOpen={confirmAction.isOpen}
        title={confirmAction.title}
        message={confirmAction.message}
        type={confirmAction.type}
        confirmText={confirmAction.confirmText}
        onConfirm={confirmAction.action}
        onCancel={() => setConfirmAction(prev => ({ ...prev, isOpen: false }))}
      />

      <SuccessNotification
        isOpen={successNotification.isOpen}
        title={successNotification.title}
        message={successNotification.message}
        onClose={() => setSuccessNotification(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
