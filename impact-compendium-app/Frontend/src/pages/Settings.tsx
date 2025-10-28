import React from 'react';
import { HeaderBar } from '../components/ui/HeaderBar';

export const Settings: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBar title="Settings" showAddButton={false} />
      
      <main className="pt-20 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>
            
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-lg font-medium text-gray-900 mb-2">User Management</h2>
                <p className="text-gray-600">Manage users and their permissions.</p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">User management functionality will be available soon.</p>
                </div>
              </div>
              
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Group Management</h2>
                <p className="text-gray-600">Manage user groups and roles.</p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Group management functionality will be available soon.</p>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">System Settings</h2>
                <p className="text-gray-600">Configure system-wide settings.</p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">System settings will be available soon.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
