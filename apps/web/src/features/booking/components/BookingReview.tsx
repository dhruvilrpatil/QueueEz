import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  User,
  ShieldCheck,
  ChevronLeft,
  Check,
  Loader2,
  FileText,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import type { Facility, Service } from '@/types';
import { useAuth } from '@/providers/AuthProvider';

interface BookingReviewProps {
  facility?: Facility;
  service?: Service;
  date: string; // YYYY-MM-DD
  timeLabel: string; // e.g. "10:30 AM"
  notes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function BookingReview({
  facility,
  service,
  date,
  timeLabel,
  notes,
  onNotesChange,
  onConfirm,
  onBack,
  isSubmitting = false,
}: BookingReviewProps) {
  const { profile, user } = useAuth();

  const patientName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    'Guest Patient';

  const patientEmail = profile?.email || user?.email || 'N/A';
  const patientPhone = profile?.phone || '+91 9876543210';

  const formattedDate = (() => {
    try {
      const parsed = parseISO(date);
      return isValid(parsed) ? format(parsed, 'EEEE, d MMMM yyyy') : date;
    } catch {
      return date;
    }
  })();

  const duration = service?.duration_minutes || 30;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight font-display">
          Review your appointment
        </h2>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Please check your appointment details before locking your slot.
        </p>
      </div>

      {/* Appointment Summary Card */}
      <div className="bg-surface-soft border border-hairline rounded-xl p-5 sm:p-6 space-y-4">
        {/* Header with Service & Duration */}
        <div className="flex items-start justify-between pb-4 border-b border-hairline">
          <div>
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
              Service Requested
            </span>
            <h3 className="text-base font-bold text-ink mt-0.5">
              {service?.name || 'General Consultation'}
            </h3>
            {service?.description && (
              <p className="text-xs text-muted mt-1">{service.description}</p>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-hairline text-ink shrink-0">
            <Clock size={12} className="text-muted" />
            {duration} minutes
          </span>
        </div>

        {/* Date, Time & Facility Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-muted block font-medium">Date & Time</span>
            <p className="font-bold text-ink text-sm flex items-center gap-1.5">
              <Calendar size={14} className="text-muted" />
              {formattedDate}
            </p>
            <p className="font-semibold text-emerald-700 flex items-center gap-1.5">
              <Clock size={13} />
              {timeLabel}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-muted block font-medium">Location</span>
            <p className="font-bold text-ink text-sm flex items-center gap-1.5">
              <Building2 size={14} className="text-muted" />
              {facility?.name || 'Metro General Hospital'}
            </p>
            <p className="text-muted flex items-start gap-1.5">
              <MapPin size={13} className="text-muted shrink-0 mt-0.5" />
              <span>{facility?.address}, {facility?.city}</span>
            </p>
          </div>
        </div>

        {/* Auto-filled Patient Info (Avoid Form Fatigue) */}
        <div className="pt-3 border-t border-hairline flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white border border-hairline flex items-center justify-center text-muted">
              <User size={13} />
            </div>
            <div>
              <span className="font-semibold text-ink">{patientName}</span>
              <span className="text-muted block text-[11px]">{patientEmail} • {patientPhone}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <ShieldCheck size={13} />
            <span>Profile Verified</span>
          </div>
        </div>
      </div>

      {/* Optional Reason / Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
          <FileText size={13} className="text-muted" />
          <span>Reason for Visit or Special Notes (Optional)</span>
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="e.g. Routine checkup, follow-up on test results, wheelchair assistance required..."
          className="w-full p-3 rounded-lg border border-hairline text-xs text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white resize-none"
        />
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-hairline flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg border border-hairline bg-white hover:bg-surface-soft text-ink font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <ChevronLeft size={14} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-7 py-2.5 rounded-lg bg-primary hover:bg-primary-active text-on-primary font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-w-[170px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Confirming...</span>
            </>
          ) : (
            <>
              <Check size={14} strokeWidth={3} />
              <span>Confirm Appointment</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
