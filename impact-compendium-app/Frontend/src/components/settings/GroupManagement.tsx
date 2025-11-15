/**
 * Group Management Component
 *
 * Provides comprehensive CRUD operations for AWS Cognito User Pool groups.
 * Features include creating, deleting groups, and managing user assignments
 * with enhanced UX including notifications and confirmation dialogs.
 *
 * Key Features:
 * - Create/Delete groups with validation
 * - Assign/Remove users from groups
 * - Real-time UI updates after operations
 * - Beautiful notifications and confirmations
 * - Automatic data refresh
 *
 * @author Impact Compendium Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Notification } from '../ui/Notification';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { authService } from '../../services/auth';

// Type definitions
interface Group {
  GroupName: string;
  Description: string;
  CreationDate: string;
  LastModifiedDate: string;
}

interface User {
  username: string;
  email: string;
  groups?: string[];
}

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface ConfirmState {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export const GroupManagement: React.FC = () => {
  // State management
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'info',
    title: '',
    message: '',
  });
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Notification helpers
  const showNotification = (
    type: 'success' | 'error' | 'info',
    title: string,
    message: string
  ) => {
    setNotification({ show: true, type, title, message });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  // Confirmation dialog helpers
  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setConfirmDialog({ show: true, title, message, onConfirm });
  };

  const hideConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, show: false }));
  };

  // Data fetching functions
  const fetchGroups = async () => {
    try {
      const headers = await authService.getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/users/groups`, { headers });
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      } else {
        showNotification('error', 'Error', 'Failed to load groups');
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      showNotification('error', 'Error', 'Failed to load groups');
    }
  };

  const fetchUsers = async () => {
    try {
      const headers = await authService.getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/users`, { headers });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchGroups(), fetchUsers()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Group operations
  const handleCreateGroup = async () => {
    if (!newGroup.name.trim() || !newGroup.description.trim()) {
      showNotification(
        'error',
        'Validation Error',
        'Group name and description are required'
      );
      return;
    }

    try {
      const headers = await authService.getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/users/groups`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroup.name,
          description: newGroup.description,
        }),
      });

      if (response.ok) {
        setNewGroup({ name: '', description: '' });
        setShowCreateModal(false);
        await fetchGroups();
        showNotification(
          'success',
          'Success',
          `Group "${newGroup.name}" created successfully`
        );
      } else {
        showNotification('error', 'Error', 'Failed to create group');
      }
    } catch (error) {
      showNotification('error', 'Error', 'Failed to create group');
    }
  };

  const handleDeleteGroup = (groupName: string) => {
    showConfirmDialog(
      'Delete Group',
      `Are you sure you want to delete the group "${groupName}"? This action cannot be undone and will remove all user associations with this group.`,
      async () => {
        try {
          const headers = await authService.getAuthHeaders();
          const response = await fetch(
            `${API_BASE}/api/users/groups/${groupName}`,
            {
              method: 'DELETE',
              headers,
            }
          );

          if (response.ok) {
            await fetchGroups();
            showNotification(
              'success',
              'Group Deleted',
              `Group "${groupName}" has been deleted successfully`
            );
          } else {
            showNotification(
              'error',
              'Delete Failed',
              'Failed to delete group. Please try again.'
            );
          }
        } catch (error) {
          showNotification(
            'error',
            'Delete Failed',
            'An error occurred while deleting the group.'
          );
        }
        hideConfirmDialog();
      }
    );
  };

  // User assignment operations
  const handleAssignUser = async (username: string, groupName: string) => {
    try {
      const headers = await authService.getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/users/groups/assign`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, group_name: groupName }),
      });

      if (response.ok) {
        setShowAssignModal(false);
        const user = users.find(u => u.username === username);
        const userDisplay = user?.email || username;
        showNotification(
          'success',
          'User Assigned',
          `${userDisplay} has been assigned to ${groupName}`
        );
        await Promise.all([fetchUsers(), fetchGroups()]);
      } else {
        showNotification(
          'error',
          'Assignment Failed',
          'Failed to assign user to group'
        );
      }
    } catch (error) {
      showNotification(
        'error',
        'Assignment Failed',
        'Failed to assign user to group'
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Notifications and Dialogs */}
      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        show={notification.show}
        onClose={hideNotification}
      />

      <ConfirmDialog
        show={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete Group"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDialog.onConfirm}
        onCancel={hideConfirmDialog}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Group Management</h3>
        <Button onClick={() => setShowCreateModal(true)}>Create Group</Button>
      </div>

      {/* Groups List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {groups.map(group => {
            const groupUsers = users.filter(
              user => user.groups && user.groups.includes(group.GroupName)
            );

            return (
              <li key={group.GroupName} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {group.GroupName}
                    </h4>
                    <p className="text-sm text-gray-500">{group.Description}</p>
                    <p className="text-xs text-gray-400">
                      Created:{' '}
                      {new Date(group.CreationDate).toLocaleDateString()}
                    </p>

                    {/* User badges */}
                    {groupUsers.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 font-medium">
                          Users in this group:
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {groupUsers.map(user => (
                            <span
                              key={user.username}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                            >
                              {user.email || user.username}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedGroup(group.GroupName);
                        setShowAssignModal(true);
                      }}
                    >
                      Assign Users
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.GroupName)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Create New Group</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={e =>
                    setNewGroup({ ...newGroup, name: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={e =>
                    setNewGroup({ ...newGroup, description: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Enter group description"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateGroup}>Create Group</Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Users Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">
              Assign Users to {selectedGroup}
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {users.map(user => (
                <div
                  key={user.username}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-gray-500">{user.username}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleAssignUser(user.username, selectedGroup)
                    }
                  >
                    Assign
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowAssignModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
