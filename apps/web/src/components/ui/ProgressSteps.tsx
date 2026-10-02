import React from 'react';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

export interface StepItem {
  number: number;
  title: string;
  description: string;
}

export interface ProgressStepsProps {
  steps: StepItem[];
  currentStep: number;
  className?: string;
}

export function ProgressSteps({
  steps,
  currentStep,
  className,
}: ProgressStepsProps) {
  return (
    <div className={clsx('w-full', className)}>
      {/* ── DESKTOP STEPPER (Matches Image 2) ────────────────────────── */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between relative">
          {steps.map((step, idx) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            const isLast = idx === steps.length - 1;

            return (
              <React.Fragment key={step.number}>
                {/* Step Item */}
                <div className="flex flex-col items-center text-center relative z-10 flex-1 max-w-[200px]">
                  {/* Circle Indicator */}
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200',
                      isCompleted && 'bg-[#12B76A] text-white shadow-xs',
                      isCurrent && 'border-2 border-[#12B76A] text-[#12B76A] bg-white ring-4 ring-[#12B76A]/10 shadow-xs',
                      !isCompleted && !isCurrent && 'border-2 border-gray-200 text-gray-400 bg-white'
                    )}
                  >
                    {isCompleted ? (
                      <Check size={16} strokeWidth={3} className="text-white" />
                    ) : (
                      <span>{step.number}</span>
                    )}
                  </div>

                  {/* Step Title & Subtitle */}
                  <div className="mt-2.5 space-y-0.5">
                    <p
                      className={clsx(
                        'text-sm font-semibold tracking-tight transition-colors',
                        isCurrent || isCompleted ? 'text-ink' : 'text-gray-400'
                      )}
                    >
                      {step.title}
                    </p>
                    <p
                      className={clsx(
                        'text-xs transition-colors',
                        isCurrent || isCompleted ? 'text-muted' : 'text-gray-300'
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connecting Dotted Line between steps */}
                {!isLast && (
                  <div className="flex-1 -mt-9 px-2 relative z-0">
                    <div
                      className={clsx(
                        'w-full border-t-2 border-dotted transition-colors duration-200',
                        isCompleted ? 'border-[#12B76A]' : 'border-gray-200'
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── MOBILE STEPPER (Matches Image 3 layout with Image 2 color scheme) ── */}
      <div className="md:hidden flex items-center justify-between py-2 px-1">
        <span className="text-sm font-semibold text-ink">
          Step {currentStep} of {steps.length}
        </span>

        <div className="flex items-center gap-2">
          {steps.map((step) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;

            if (isCompleted) {
              return (
                <div
                  key={step.number}
                  className="w-6 h-6 rounded-full bg-[#12B76A] text-white flex items-center justify-center shadow-xs"
                >
                  <Check size={13} strokeWidth={3} className="text-white" />
                </div>
              );
            }

            if (isCurrent) {
              return (
                <div
                  key={step.number}
                  className="w-6 h-6 rounded-full border-2 border-[#12B76A] ring-2 ring-[#12B76A]/20 flex items-center justify-center bg-white"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#12B76A]" />
                </div>
              );
            }

            return (
              <div
                key={step.number}
                className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center bg-white"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
