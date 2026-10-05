import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { bookingApi } from '../api/bookingApi';
import { formatTo12Hour, formatTo24Hour } from '../utils/bookingHelpers';
import type { BookingStep, BookingResult, BookingErrorState } from '../types/booking';
import type { Facility, Service } from '@/types';
import toast from 'react-hot-toast';

interface UseBookingOptions {
  initialFacilityId?: string;
  initialServiceId?: string;
  initialDate?: string;
  initialNotes?: string;
  onSuccess?: (result: BookingResult) => void;
  onClose?: () => void;
}

export function useBooking(options: UseBookingOptions = {}) {
  const {
    initialFacilityId,
    initialServiceId,
    initialDate,
    initialNotes,
    onSuccess,
    onClose,
  } = options;

  const queryClient = useQueryClient();

  // 1. Fetch available facilities
  const { data: facilities = [], isLoading: isLoadingFacilities } = useQuery({
    queryKey: ['facilities'],
    queryFn: () => bookingApi.getFacilities(),
  });

  // Selected state
  const [step, setStep] = useState<BookingStep>(1);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || format(addDays(new Date(), 1), 'yyyy-MM-dd')
  );
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>(initialNotes || '');

  // Operation state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [error, setError] = useState<BookingErrorState | null>(null);

  // Determine active facility
  useEffect(() => {
    if (initialFacilityId) {
      setSelectedFacilityId(initialFacilityId);
    } else if (!selectedFacilityId && facilities.length > 0) {
      setSelectedFacilityId(facilities[0].id);
    }
  }, [initialFacilityId, facilities, selectedFacilityId]);

  // Fetch detailed facility info (with services & business hours)
  const { data: facilityDetail, isLoading: isLoadingFacilityDetail } = useQuery({
    queryKey: ['facility-detail', selectedFacilityId],
    queryFn: () => bookingApi.getFacility(selectedFacilityId),
    enabled: Boolean(selectedFacilityId),
  });

  // Active facility object
  const activeFacility: Facility | undefined = useMemo(() => {
    if (facilityDetail) return facilityDetail;
    return facilities.find((f) => f.id === selectedFacilityId);
  }, [facilityDetail, facilities, selectedFacilityId]);

  // Available services for the active facility that allow appointment
  const availableServices: Service[] = useMemo(() => {
    const list = activeFacility?.services || [];
    return list.filter((s) => s.allows_appointment !== false);
  }, [activeFacility]);

  // Sync initial service
  useEffect(() => {
    if (initialServiceId) {
      setSelectedServiceId(initialServiceId);
    } else if (availableServices.length > 0 && !selectedServiceId) {
      // Don't auto-force selection so the user consciously selects service
    }
  }, [initialServiceId, availableServices, selectedServiceId]);

  // Active service object
  const activeService: Service | undefined = useMemo(() => {
    return availableServices.find((s) => s.id === selectedServiceId);
  }, [availableServices, selectedServiceId]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const selectFacility = useCallback((facilityId: string) => {
    setSelectedFacilityId(facilityId);
    setSelectedServiceId('');
    setSelectedTime('');
    setError(null);
  }, []);

  const selectService = useCallback((serviceId: string) => {
    setSelectedServiceId(serviceId);
    setError(null);
  }, []);

  const selectDate = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime(''); // Reset time when date changes
    setError(null);
  }, []);

  const selectTime = useCallback((time24: string) => {
    setSelectedTime(time24);
    setError(null);
  }, []);

  const goNext = useCallback(() => {
    if (step === 1) {
      if (!selectedServiceId) {
        toast.error('Please choose a service to continue');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedDate) {
        toast.error('Please select a date');
        return;
      }
      if (!selectedTime) {
        toast.error('Please select a time slot');
        return;
      }
      setStep(3);
    }
  }, [step, selectedServiceId, selectedDate, selectedTime]);

  const goBack = useCallback(() => {
    setError(null);
    if (step > 1) {
      setStep((prev) => (prev - 1) as BookingStep);
    }
  }, [step]);

  const retryTimeSelection = useCallback(() => {
    setError(null);
    setSelectedTime('');
    setStep(2); // Keep service and date, re-pick slot
  }, []);

  const reset = useCallback(() => {
    setStep(1);
    setSelectedTime('');
    setResult(null);
    setError(null);
    setIsSubmitting(false);
  }, []);

  // ── Submission ────────────────────────────────────────────────────────────

  const submitBooking = useCallback(async () => {
    if (!selectedFacilityId || !selectedServiceId || !selectedDate || !selectedTime) {
      toast.error('Incomplete booking details. Please review your selections.');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const payload = {
      facility_id: selectedFacilityId,
      service_id: selectedServiceId,
      date: selectedDate,
      start_time: formatTo24Hour(selectedTime),
      notes: notes.trim() || undefined,
    };

    try {
      const res = await bookingApi.createAppointment(payload);

      // Invalidate relevant cache so dashboard & upcoming lists update immediately
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment-slots'] });

      setResult(res);
      toast.success('Appointment booked successfully!');
      onSuccess?.(res);
    } catch (err: any) {
      const isConflict =
        err?.status === 409 ||
        err?.code === 'CONFLICT' ||
        err?.message?.toLowerCase().includes('already booked') ||
        err?.message?.toLowerCase().includes('conflict') ||
        err?.message?.toLowerCase().includes('limit reached');

      const message = isConflict
        ? 'This time slot is no longer available. Please choose another time.'
        : err?.message || 'Unable to confirm appointment. Please check your network and try again.';

      setError({
        message,
        code: err?.code || (isConflict ? 'CONFLICT' : 'SUBMIT_ERROR'),
        isConflict,
      });

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedFacilityId,
    selectedServiceId,
    selectedDate,
    selectedTime,
    notes,
    isSubmitting,
    queryClient,
    onSuccess,
  ]);

  return {
    // Current step
    step,
    setStep,
    goNext,
    goBack,
    retryTimeSelection,
    reset,

    // Selections
    selectedFacilityId,
    selectedServiceId,
    selectedDate,
    selectedTime,
    selectedTimeLabel: selectedTime ? formatTo12Hour(selectedTime) : '',
    notes,
    setNotes,

    // Entities
    facilities,
    activeFacility,
    availableServices,
    activeService,

    // Status
    isLoading: isLoadingFacilities || isLoadingFacilityDetail,
    isSubmitting,
    result,
    error,

    // Actions
    selectFacility,
    selectService,
    selectDate,
    selectTime,
    submitBooking,
  };
}
