import type { Facility, Service, Appointment } from '@/types';

export type BookingStep = 1 | 2 | 3;

export interface BookingState {
  facilityId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h format for API)
  timeLabel: string; // 12h formatted label, e.g. "09:30 AM"
  notes: string;
}

export interface TimeSlotItem {
  time: string; // HH:MM
  label: string; // e.g. "09:30 AM"
  period: 'morning' | 'afternoon' | 'evening';
  available: boolean;
}

export interface BookingResult {
  id: string;
  booking_reference: string;
  status: string;
  date: string;
  start_time: string;
  end_time?: string;
  notes?: string;
  facilities?: {
    name: string;
    address: string;
    city?: string;
  };
  services?: {
    name: string;
    duration_minutes?: number;
  };
}

export interface BookingErrorState {
  message: string;
  code?: string;
  isConflict?: boolean;
}
