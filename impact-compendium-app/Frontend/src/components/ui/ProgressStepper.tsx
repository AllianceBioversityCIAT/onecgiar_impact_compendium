import React from 'react';

interface Step {
  id: number;
  label: string;
  completed?: boolean;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-center space-x-8 py-6">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.completed || step.id < currentStep;
        
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isActive 
                    ? 'bg-[var(--ic-color-primary)] text-black' 
                    : 'bg-gray-200 text-gray-500'
                }
              `}>
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span className={`mt-2 text-sm font-medium ${isActive ? 'text-[var(--ic-color-text)]' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};
