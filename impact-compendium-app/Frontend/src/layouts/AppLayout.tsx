import React from 'react';
import { HeaderBar } from '../components/ui/HeaderBar';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  onAddStudy?: () => void;
  showAddButton?: boolean;
  hasFormFooter?: boolean;
  steps?: Array<{ id: number; label: string; completed?: boolean }>;
  currentStep?: number;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  title = "Dashboard",
  onAddStudy,
  showAddButton = true,
  hasFormFooter = false,
  steps,
  currentStep
}) => {
  return (
    <div className="min-h-screen bg-[var(--ic-surface-muted)]">
      <HeaderBar 
        title={title} 
        onAddStudy={onAddStudy}
        showAddButton={showAddButton}
        steps={steps}
        currentStep={currentStep}
      />
      
      <main className={`max-w-[95vw] mx-auto px-4 py-4 pt-28 ${hasFormFooter ? 'pb-32' : 'pb-28'}`}>
        {hasFormFooter ? (
          <div>
            {children}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-[var(--ic-border-light)] p-6">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};
