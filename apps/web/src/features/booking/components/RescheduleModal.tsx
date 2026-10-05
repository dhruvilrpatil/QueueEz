import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Calendar, Clock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import { DateSelector } from './DateSelector';
import { TimeSlotGrid } from './TimeSlotGrid';
import { useAvailability } from '../hooks/useAvailability';
import { bookingApi } from '../api/bookingApi';
import { formatTo12Hour, formatTo24Hour } from '../utils/bookingHelpers';
import type { Appointment } from '@/types';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export function RescheduleModal({ isOpen, onClose, appointment }: RescheduleModalProps) {
  const queryClient = useQueryClient();
  const [newDate, setNewDate] = useState<string>(
    format(addDays(new Date(), 1), 'yyyy-MM-dd')
  );
  const [newTime, setNewTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    morningSlots,
    afternoonSlots,
    eveningSlots,
    isLoading: isSlotsLoading,
  } = useAvailability({
    facilityId: appointment?.facility_id,
    serviceId: appointment?.service_id,
    date: newDate,
    enabled: isOpen && Boolean(appointment),
  });

  if (!isOpen || !appointment) return null;

  const handleConfirm = async () => {
    if (!newDate || !newTime) {
      toast.error('Please pick an available date and time slot');
      return;
    }

    setIsSubmitting(true);
    try {
      await bookingApi.rescheduleAppointment(appointment.id, {
        date: newDate,
        start_time: formatTo24Hour(newTime),
      });

      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment-slots'] });

      toast.success('Appointment rescheduled successfully!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reschedule appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-canvas border border-hairline rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="p-5 border-b border-hairline flex items-center justify-between bg-surface-soft/40">
          <div>
            <h3 className="text-base font-bold text-ink font-display">Reschedule Appointment</h3>
            <p className="text-xs text-muted">
              {appointment.services?.name || 'Consultation'} • Ref: {appointment.booking_reference}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-hairline hover:bg-surface-soft text-muted hover:text-ink flex items-center justify-center cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Booking Info */}
        <div className="p-5 pb-0">
          <div className="p-3 bg-surface-soft border border-hairline rounded-xl flex items-center justify-between text-xs">
            <span className="text-muted">Current Slot:</span>
            <span className="font-semibold text-ink">
              {format(new Date(appointment.date), 'EEE, MMM d, yyyy')} at {formatTo12Hour(appointment.start_time)}
            </span>
          </div>
        </div>

        {/* Date & Time Pickers */}
        <div className="p-5 space-y-5">
          <DateSelector
            selectedDate={newDate}
            onSelectDate={(d) => {
              setNewDate(d);
              setNewTime('');
            }}
          />

          <TimeSlotGrid
            morningSlots={morningSlots}
            afternoonSlots={afternoonSlots}
            eveningSlots={eveningSlots}
            selectedTime={newTime}
            onSelectTime={setNewTime}
            isLoading={isSlotsLoading}
            onTryAnotherDate={() => {
              const d = new Date(newDate);
              d.setDate(d.getDate() + 1);
              setNewDate(d.toISOString().split('T')[0]);
              setNewTime('');
            }}
          />
        </div>

        {/* Footer */}
        <div className="p-5 pt-3 border-t border-hairline flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-hairline hover:bg-surface-soft text-xs font-semibold text-ink cursor-pointer"
          >
            Keep Current
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!newTime || isSubmitting}
            className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-active text-on-primary text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Rescheduling...</span>
              </>
            ) : (
              <>
                <span>Confirm Reschedule</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
