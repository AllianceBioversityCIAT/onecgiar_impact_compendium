import React from 'react';
import { Button } from './Button';

interface FormFooterProps {
  onBack?: () => void;
  onNext?: () => void;
  onSaveDraft?: () => void;
  showBack?: boolean;
  showNext?: boolean;
  nextLabel?: string;
  isLoading?: boolean;
}

export const FormFooter: React.FC<FormFooterProps> = ({
  onBack,
  onNext,
  onSaveDraft,
  showBack = true,
  showNext = true,
  nextLabel = "Next",
  isLoading = false
}) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--ic-border-light)] shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between">
          <div>
            {onSaveDraft && (
              <Button
                variant="ghost"
                onClick={onSaveDraft}
                disabled={isLoading}
              >
                Save Draft
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {showBack && onBack && (
              <Button 
                variant="secondary" 
                className="flex items-center space-x-2" 
                onClick={onBack}
                disabled={isLoading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Go Back</span>
              </Button>
            )}
            {showNext && onNext && (
              <Button 
                onClick={onNext} 
                className="flex items-center space-x-2"
                disabled={isLoading}
              >
                <span>{nextLabel}</span>
                {nextLabel === "Save" ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
