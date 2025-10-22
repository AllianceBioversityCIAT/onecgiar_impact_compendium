import React from 'react';
import { HeaderBar } from '../components/ui/HeaderBar';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  onAddStudy?: () => void;
  showAddButton?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  title = "Dashboard",
  onAddStudy,
  showAddButton = true
}) => {
  return (
    <div className="min-h-screen bg-[var(--ic-surface-muted)]">
      <HeaderBar 
        title={title} 
        onAddStudy={onAddStudy}
        showAddButton={showAddButton}
      />
      
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-[var(--ic-border-light)] p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
