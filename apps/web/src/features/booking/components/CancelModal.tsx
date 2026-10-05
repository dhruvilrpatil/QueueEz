import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { bookingApi } from '../api/bookingApi';
import { formatTo12Hour } from '../utils/bookingHelpers';
import type { Appointment } from '@/types';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export function CancelModal({ isOpen, onClose, appointment }: CancelModalProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      await bookingApi.cancelAppointment(appointment.id, reason.trim() || undefined);

      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment-slots'] });

      toast.success('Appointment cancelled successfully.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-canvas border border-hairline rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
        <div className="p-5 border-b border-hairline flex items-center justify-between bg-surface-soft/40">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={18} />
            <h3 className="text-base font-bold text-ink font-display">Cancel Appointment</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-hairline hover:bg-surface-soft text-muted hover:text-ink flex items-center justify-center cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            Are you sure you want to cancel this booking? This slot will be released immediately for other patients.
          </p>

          <div className="p-3.5 bg-surface-soft border border-hairline rounded-xl text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted">Service:</span>
              <strong className="text-ink">{appointment.services?.name || 'General Consultation'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Slot:</span>
              <strong className="text-ink">
                {format(new Date(appointment.date), 'MMM d, yyyy')} at {formatTo12Hour(appointment.start_time)}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Reference:</span>
              <span className="font-mono text-muted">{appointment.booking_reference}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink block">
              Reason for Cancellation (Optional)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Schedule conflict, feeling better..."
              className="w-full p-2.5 rounded-lg border border-hairline text-xs text-ink outline-none focus:border-red-500 bg-white resize-none"
            />
          </div>
        </div>

        <div className="p-5 pt-3 border-t border-hairline flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-hairline hover:bg-surface-soft text-xs font-semibold text-ink cursor-pointer"
          >
            Keep Appointment
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <span>Cancel Appointment</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
