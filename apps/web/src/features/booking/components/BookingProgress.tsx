import React from 'react';
import { Check } from 'lucide-react';
import type { BookingStep } from '../types/booking';

interface BookingProgressProps {
  currentStep: BookingStep;
  onStepClick?: (step: BookingStep) => void;
  className?: string;
}

const STEPS: { step: BookingStep; label: string; subtitle: string }[] = [
  { step: 1, label: 'Service', subtitle: 'Choose service' },
  { step: 2, label: 'Date & Time', subtitle: 'Pick slot' },
  { step: 3, label: 'Confirm', subtitle: 'Review details' },
];

export function BookingProgress({ currentStep, onStepClick, className = '' }: BookingProgressProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Stepper */}
      <div className="hidden sm:flex items-center justify-between relative max-w-xl mx-auto">
        {/* Connecting Background Line */}
        <div className="absolute top-4 left-10 right-10 h-0.5 bg-hairline z-0" />
        {/* Active Line Fill */}
        <div
          className="absolute top-4 left-10 h-0.5 bg-emerald-500 transition-all duration-300 z-0"
          style={{
            width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
            maxWidth: 'calc(100% - 80px)',
          }}
        />

        {STEPS.map((s) => {
          const isCompleted = currentStep > s.step;
          const isCurrent = currentStep === s.step;
          const isClickable = onStepClick && currentStep > s.step;

          return (
            <div
              key={s.step}
              onClick={() => isClickable && onStepClick(s.step)}
              className={`flex flex-col items-center relative z-10 ${
                isClickable ? 'cursor-pointer group' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isCurrent
                    ? 'border-2 border-primary text-ink bg-white ring-4 ring-primary/10 shadow-xs'
                    : 'border-2 border-hairline text-muted bg-white'
                }`}
              >
                {isCompleted ? <Check size={14} strokeWidth={3} /> : s.step}
              </div>

              <div className="mt-2 text-center">
                <p
                  className={`text-xs font-semibold tracking-tight transition-colors ${
                    isCurrent ? 'text-ink' : isCompleted ? 'text-ink/80' : 'text-muted'
                  }`}
                >
                  {s.label}
                </p>
                <p className="text-[11px] text-muted hidden md:block">
                  {s.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Stepper (Target 390-430px) */}
      <div className="sm:hidden flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
            {currentStep}
          </span>
          <div>
            <p className="text-xs font-bold text-ink">
              Step {currentStep} of 3: {STEPS[currentStep - 1].label}
            </p>
            <p className="text-[10px] text-muted">
              Next: {currentStep < 3 ? STEPS[currentStep].label : 'Complete booking'}
            </p>
          </div>
        </div>

        {/* Progress bar dots */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentStep === s.step
                  ? 'w-6 bg-primary'
                  : currentStep > s.step
                  ? 'w-3 bg-emerald-500'
                  : 'w-2 bg-hairline'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
