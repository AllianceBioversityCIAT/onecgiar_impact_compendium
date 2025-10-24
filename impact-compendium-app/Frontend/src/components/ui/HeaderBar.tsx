import React from 'react';
import { Button } from './Button';
import { authService } from '../../services/auth';

interface HeaderBarProps {
  title: string;
  onAddStudy?: () => void;
  showAddButton?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ 
  title, 
  onAddStudy, 
  showAddButton = true 
}) => {
  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[var(--ic-border-light)] px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6" viewBox="0 0 531 43" fill="none">
            <path d="M25.3019 0.809967L50.3018 15.8198V25.7963L25.3019 40.81L0.301758 25.7963V15.8199L25.3019 0.809967Z" fill="#FDC82F"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M0.301758 15.8198L25.3018 0.809967L50.3018 15.8198V25.7963L25.3018 40.81L0.301758 25.7963V15.8198ZM25.3018 34.441L44.9985 22.6122V19.0051L44.9975 19.0045L25.3018 30.8297L5.60602 19.0045L5.60506 19.0051V22.6122L25.3018 34.441ZM25.3018 25.3146L40.4036 16.2476L36.7247 14.0398L25.3018 20.8981L13.8789 14.0398L10.2 16.2476L25.3018 25.3146ZM25.3018 15.383L32.1308 11.2829L25.3018 7.18464L18.4728 11.2829L25.3018 15.383Z" fill="#000000"/>
          </svg>
          <h1 className="text-lg font-semibold text-[var(--ic-color-text)]">
            Impact Compendium Database
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {showAddButton && (
          <Button onClick={onAddStudy} className="flex items-center space-x-2">
            <span>Add study</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        )}
        
        <Button variant="secondary" onClick={handleLogout} className="text-sm">
          Log out
        </Button>
      </div>
    </header>
  );
};
