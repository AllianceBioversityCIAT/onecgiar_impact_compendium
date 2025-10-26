import React from 'react';
import { AppLayout } from './AppLayout';
import { FormFooter } from '../components/ui';

interface FormLayoutProps {
  children: React.ReactNode;
  title: string;
  onBack?: () => void;
  onNext?: () => void;
  onSaveDraft?: () => void;
  showBack?: boolean;
  nextLabel?: string;
  isLoading?: boolean;
  steps?: Array<{ id: number; label: string; completed?: boolean }>;
  currentStep?: number;
  onClose?: () => void;
}

export const FormLayout: React.FC<FormLayoutProps> = ({
  children,
  title,
  onBack,
  onNext,
  onSaveDraft,
  showBack = true,
  nextLabel = "Next",
  isLoading = false,
  steps,
  currentStep,
  onClose
}) => {
  return (
    <AppLayout 
      title={title} 
      showAddButton={false} 
      hasFormFooter={true}
      steps={steps}
      currentStep={currentStep}
      onClose={onClose}
    >
      {children}
      
      <FormFooter
        onBack={onBack}
        onNext={onNext}
        onSaveDraft={onSaveDraft}
        showBack={showBack}
        nextLabel={nextLabel}
        isLoading={isLoading}
      />
    </AppLayout>
  );
};
