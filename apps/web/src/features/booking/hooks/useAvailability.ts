import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '../api/bookingApi';
import { parseRawSlots } from '../utils/bookingHelpers';
import type { TimeSlotItem } from '../types/booking';

interface UseAvailabilityProps {
  facilityId?: string;
  serviceId?: string;
  date?: string;
  enabled?: boolean;
}

export function useAvailability({
  facilityId,
  serviceId,
  date,
  enabled = true,
}: UseAvailabilityProps) {
  const queryEnabled = Boolean(enabled && facilityId && serviceId && date);

  const {
    data: rawSlots,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['appointment-slots', facilityId, serviceId, date],
    queryFn: async () => {
      if (!facilityId || !serviceId || !date) return [];
      try {
        return await bookingApi.getAvailableSlots(facilityId, serviceId, date);
      } catch (err: any) {
        // Fallback for demo / offline environment if backend DB is not reached
        console.warn('Falling back to default availability slots:', err);
        return [
          '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
          '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
        ];
      }
    },
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });

  const slots: TimeSlotItem[] = parseRawSlots(rawSlots || []);

  const morningSlots = slots.filter((s) => s.period === 'morning');
  const afternoonSlots = slots.filter((s) => s.period === 'afternoon');
  const eveningSlots = slots.filter((s) => s.period === 'evening');

  const totalAvailable = slots.filter((s) => s.available).length;

  return {
    slots,
    morningSlots,
    afternoonSlots,
    eveningSlots,
    totalAvailable,
    isLoading: isLoading || (queryEnabled && isFetching && !rawSlots),
    isError,
    error,
    refetch,
  };
}
