import React from 'react';
import { Sun, Sunset, Moon, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import type { TimeSlotItem } from '../types/booking';

interface TimeSlotGridProps {
  morningSlots: TimeSlotItem[];
  afternoonSlots: TimeSlotItem[];
  eveningSlots: TimeSlotItem[];
  selectedTime: string;
  onSelectTime: (time24: string) => void;
  isLoading?: boolean;
  onTryAnotherDate?: () => void;
  queueHint?: string;
}

export function TimeSlotGrid({
  morningSlots,
  afternoonSlots,
  eveningSlots,
  selectedTime,
  onSelectTime,
  isLoading = false,
  onTryAnotherDate,
  queueHint,
}: TimeSlotGridProps) {
  const totalSlots = morningSlots.length + afternoonSlots.length + eveningSlots.length;

  if (isLoading) {
    return (
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink uppercase tracking-wider">
            Available Times
          </span>
          <span className="text-xs text-muted">Checking slots...</span>
        </div>
        <div className="space-y-3">
          <div className="skeleton h-4 w-20 rounded" />
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-10 rounded-lg" />
            ))}
          </div>
          <div className="skeleton h-4 w-20 rounded mt-3" />
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-10 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (totalSlots === 0) {
    return (
      <div className="p-6 text-center border border-dashed border-hairline rounded-xl bg-surface-soft/40 space-y-3 my-3">
        <AlertCircle size={24} className="mx-auto text-muted" />
        <div>
          <h4 className="text-sm font-bold text-ink">No appointments available</h4>
          <p className="text-xs text-muted mt-0.5">
            There are no available times on this date. The facility may be closed or fully booked.
          </p>
        </div>
        {onTryAnotherDate && (
          <button
            type="button"
            onClick={onTryAnotherDate}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-hairline bg-white hover:bg-surface-soft text-xs font-semibold text-ink transition-colors cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Try another date</span>
          </button>
        )}
      </div>
    );
  }

  const renderSlotGroup = (
    title: string,
    icon: React.ReactNode,
    slots: TimeSlotItem[]
  ) => {
    if (slots.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          {icon}
          <span>{title}</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map((slot) => {
            const isSelected = selectedTime === slot.time;
            return (
              <button
                key={slot.time}
                type="button"
                disabled={!slot.available}
                onClick={() => slot.available && onSelectTime(slot.time)}
                className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all select-none cursor-pointer ${
                  isSelected
                    ? 'border-ink bg-ink text-white font-bold ring-2 ring-ink/20 shadow-xs'
                    : slot.available
                    ? 'border-hairline bg-canvas text-ink hover:border-ink/30 hover:bg-surface-soft'
                    : 'border-hairline-soft bg-surface-soft text-muted/50 cursor-not-allowed line-through'
                }`}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
          Available Times
        </label>
        <div className="flex items-center gap-2">
          {queueHint && (
            <span className="text-[11px] text-muted flex items-center gap-1">
              <Clock size={11} /> {queueHint}
            </span>
          )}
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {totalSlots <= 3 ? 'Few slots left' : `${totalSlots} slots available`}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {renderSlotGroup('Morning', <Sun size={13} className="text-amber-500" />, morningSlots)}
        {renderSlotGroup('Afternoon', <Sunset size={13} className="text-orange-500" />, afternoonSlots)}
        {renderSlotGroup('Evening', <Moon size={13} className="text-indigo-400" />, eveningSlots)}
      </div>
    </div>
  );
}
