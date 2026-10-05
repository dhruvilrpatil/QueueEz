import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Calendar,
  Clock,
  Building2,
  MapPin,
  CalendarPlus,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { downloadCalendarInvite, formatTo12Hour } from '../utils/bookingHelpers';
import type { BookingResult } from '../types/booking';

interface BookingSuccessProps {
  result: BookingResult;
  onClose?: () => void;
}

export function BookingSuccess({ result, onClose }: BookingSuccessProps) {
  const navigate = useNavigate();

  const formattedDate = (() => {
    try {
      const parsed = parseISO(result.date);
      return isValid(parsed) ? format(parsed, 'EEEE, d MMMM yyyy') : result.date;
    } catch {
      return result.date;
    }
  })();

  const timeLabel = formatTo12Hour(result.start_time);
  const serviceName = result.services?.name || 'Consultation Service';
  const facilityName = result.facilities?.name || 'Healthcare Facility';
  const facilityAddress = result.facilities?.address || '100 Medical Center Dr';

  const handleAddToCalendar = () => {
    downloadCalendarInvite({
      bookingReference: result.booking_reference,
      serviceName,
      facilityName,
      facilityAddress,
      date: result.date,
      startTime: result.start_time,
      durationMinutes: result.services?.duration_minutes || 30,
    });
  };

  const handleViewAppointment = () => {
    onClose?.();
    navigate('/app/appointments');
  };

  const handleBackToDashboard = () => {
    onClose?.();
    navigate('/app/dashboard');
  };

  return (
    <div className="py-4 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Success Badge */}
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
        <Check size={32} strokeWidth={3} />
      </div>

      <div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 uppercase tracking-wider">
          Appointment Confirmed
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink font-display tracking-tight mt-2">
          {serviceName}
        </h2>
        <p className="text-xs sm:text-sm text-muted mt-1 max-w-sm mx-auto">
          Please arrive 10 minutes prior to your scheduled time with a valid photo ID.
        </p>
      </div>

      {/* Confirmation Summary Card */}
      <div className="bg-surface-soft border border-hairline rounded-xl p-5 sm:p-6 max-w-md mx-auto text-left space-y-4">
        {/* Booking Reference Pill */}
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Appointment Reference
          </span>
          <span className="font-mono text-xs font-bold text-ink bg-white px-2.5 py-1 rounded-md border border-hairline">
            {result.booking_reference}
          </span>
        </div>

        {/* Details List */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-1.5">
              <Calendar size={13} /> Date:
            </span>
            <strong className="text-ink">{formattedDate}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-1.5">
              <Clock size={13} /> Time:
            </span>
            <strong className="text-ink">{timeLabel}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-1.5">
              <Building2 size={13} /> Facility:
            </span>
            <strong className="text-ink">{facilityName}</strong>
          </div>

          <div className="flex items-start justify-between gap-3 pt-1 border-t border-hairline">
            <span className="text-muted flex items-center gap-1.5 shrink-0">
              <MapPin size={13} /> Address:
            </span>
            <span className="text-right text-muted">{facilityAddress}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-md mx-auto">
        <button
          type="button"
          onClick={handleViewAppointment}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-active text-on-primary font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <span>View Appointment</span>
          <ArrowRight size={13} />
        </button>

        <button
          type="button"
          onClick={handleAddToCalendar}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-hairline bg-white hover:bg-surface-soft text-ink font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CalendarPlus size={14} className="text-muted" />
          <span>Add to Calendar</span>
        </button>

        <button
          type="button"
          onClick={handleBackToDashboard}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-hairline bg-white hover:bg-surface-soft text-muted hover:text-ink font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LayoutDashboard size={13} />
          <span>Dashboard</span>
        </button>
      </div>
    </div>
  );
}
