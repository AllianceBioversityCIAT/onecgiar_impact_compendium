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
    <div className="flex items-center space-x-3">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.completed || step.id < currentStep;
        
        return (
          <div key={step.id} className="flex items-center">
            <div className={`
              w-3 h-3 rounded-full
              ${isCompleted 
                ? 'bg-green-500' 
                : isActive 
                  ? 'bg-[var(--ic-color-primary)]' 
                  : 'bg-gray-300'
              }
            `} />
            
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};
