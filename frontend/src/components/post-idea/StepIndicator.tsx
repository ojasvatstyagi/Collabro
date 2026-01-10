import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps = 4,
}) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step) => (
        <React.Fragment key={step}>
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
              step <= currentStep
                ? 'bg-brand-orange text-white'
                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            )}
          >
            {step < currentStep ? <CheckCircle2 className="h-4 w-4" /> : step}
          </div>
          {step < totalSteps && (
            <div
              className={cn(
                'h-1 w-12 mx-2',
                step < currentStep
                  ? 'bg-brand-orange'
                  : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;
