import React, { useState } from 'react';
import { Calendar, Clock, MapPin, ChevronDown, ChevronUp, Building2, CheckCircle2 } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import type { Facility, Service } from '@/types';

interface BookingSummaryProps {
  facility?: Facility;
  service?: Service;
  date?: string; // YYYY-MM-DD
  timeLabel?: string; // e.g. "10:30 AM"
  compact?: boolean;
}

export function BookingSummary({
  facility,
  service,
  date,
  timeLabel,
  compact = false,
}: BookingSummaryProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const formattedDate = date
    ? (() => {
        try {
          const parsed = parseISO(date);
          return isValid(parsed) ? format(parsed, 'EEE, d MMM yyyy') : date;
        } catch {
          return date;
        }
      })()
    : null;

  const duration = service?.duration_minutes || 30;

  // Render desktop / expanded sidebar summary
  const content = (
    <div className="space-y-3 text-xs">
      {/* Service */}
      <div className="flex items-start justify-between pb-2.5 border-b border-hairline">
        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
            Service
          </span>
          <span className="text-sm font-bold text-ink block">
            {service?.name || 'Not selected'}
          </span>
        </div>
        {service && (
          <span className="text-[11px] font-medium text-muted bg-surface-card px-2 py-0.5 rounded border border-hairline shrink-0">
            {duration} min
          </span>
        )}
      </div>

      {/* Date & Time */}
      <div className="flex items-start justify-between pb-2.5 border-b border-hairline">
        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
            Date & Time
          </span>
          <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <Calendar size={13} className="text-muted" />
            {formattedDate || 'Pick a date'}
          </span>
          {timeLabel && (
            <span className="text-xs font-bold text-ink flex items-center gap-1.5 mt-0.5">
              <Clock size={13} className="text-muted" />
              {timeLabel}
            </span>
          )}
        </div>
      </div>

      {/* Location */}
      {facility && (
        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
            Location
          </span>
          <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <Building2 size={13} className="text-muted shrink-0" />
            <span className="truncate">{facility.name}</span>
          </span>
          <p className="text-[11px] text-muted flex items-start gap-1.5 mt-0.5">
            <MapPin size={11} className="text-muted shrink-0 mt-0.5" />
            <span className="line-clamp-2">{facility.address}, {facility.city}</span>
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Mobile Expandable Strip */}
      <div className="sm:hidden mb-4 border border-hairline rounded-xl bg-surface-soft overflow-hidden">
        <button
          type="button"
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="w-full p-3 flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white border border-hairline flex items-center justify-center text-muted">
              <Calendar size={13} />
            </div>
            <div>
              <p className="text-xs font-bold text-ink truncate max-w-[200px]">
                {service ? service.name : 'Booking summary'}
              </p>
              <p className="text-[10px] text-muted">
                {formattedDate && timeLabel
                  ? `${formattedDate} • ${timeLabel}`
                  : 'Tap to view appointment summary'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted font-medium">
            <span>{mobileExpanded ? 'Hide' : 'Details'}</span>
            {mobileExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>

        {mobileExpanded && (
          <div className="p-3.5 pt-0 border-t border-hairline bg-white animate-in fade-in duration-150">
            {content}
          </div>
        )}
      </div>

      {/* Desktop Persistent Box */}
      <div className="hidden sm:block bg-surface-soft border border-hairline rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-hairline">
          <Calendar size={14} className="text-muted" />
          <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
            Appointment Summary
          </h4>
        </div>
        {content}
      </div>
    </div>
  );
}
