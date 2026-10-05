import React from 'react';
import { AlertCircle, Clock, RefreshCw } from 'lucide-react';
import type { BookingErrorState } from '../types/booking';

interface BookingErrorProps {
  error: BookingErrorState;
  onRetryTime: () => void;
  onReset?: () => void;
}

export function BookingError({ error, onRetryTime, onReset }: BookingErrorProps) {
  const isConflict = error.isConflict;

  return (
    <div className="py-6 text-center space-y-5 animate-in fade-in duration-150">
      <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto ring-6 ring-red-50">
        <AlertCircle size={28} />
      </div>

      <div className="space-y-1.5 max-w-sm mx-auto">
        <h3 className="text-base sm:text-lg font-bold text-ink">
          {isConflict ? 'Slot No Longer Available' : 'Booking Could Not Be Completed'}
        </h3>
        <p className="text-xs text-muted leading-relaxed">
          {error.message}
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-xs mx-auto">
        <button
          type="button"
          onClick={onRetryTime}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-active text-on-primary font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Clock size={13} />
          <span>Choose another time</span>
        </button>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-hairline bg-white hover:bg-surface-soft text-muted hover:text-ink font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Start Over</span>
          </button>
        )}
      </div>
    </div>
  );
}
