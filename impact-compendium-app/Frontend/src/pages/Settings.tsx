import React, { useState } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { UserManagement } from '../components/settings/UserManagement';

type SettingsTab = 'users' | 'general' | 'security';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('users');

  const tabs = [
    { id: 'users' as SettingsTab, label: 'User Management', icon: '👥' },
    { id: 'general' as SettingsTab, label: 'General', icon: '⚙️' },
    { id: 'security' as SettingsTab, label: 'Security', icon: '🔒' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'general':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
            <p className="text-gray-600">General settings will be available soon.</p>
          </div>
        );
      case 'security':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
            <p className="text-gray-600">Security settings will be available soon.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout title="Settings" showAddButton={false}>
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[var(--ic-color-primary)] text-[var(--ic-color-amber)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-[var(--ic-border-light)]">
          {renderTabContent()}
        </div>
      </div>
    </AppLayout>
  );
};
