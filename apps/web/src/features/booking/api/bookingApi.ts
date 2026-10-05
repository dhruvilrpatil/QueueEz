import { apiClient } from '@/lib/api-client';
import type { Facility, Appointment } from '@/types';
import type { BookingResult } from '../types/booking';

export const bookingApi = {
  /**
   * Fetch all active facilities
   */
  async getFacilities(): Promise<Facility[]> {
    const res = await apiClient.get<{ success: boolean; data: Facility[] }>('/facilities');
    return res.data || [];
  },

  /**
   * Fetch facility details including its services, business hours, counters
   */
  async getFacility(id: string): Promise<Facility> {
    const res = await apiClient.get<{ success: boolean; data: Facility }>(`/facilities/${id}`);
    return res.data;
  },

  /**
   * Fetch real available time slots for a service on a given date
   */
  async getAvailableSlots(
    facilityId: string,
    serviceId: string,
    date: string
  ): Promise<string[]> {
    const params = new URLSearchParams({
      facility_id: facilityId,
      service_id: serviceId,
      date,
    });
    const res = await apiClient.get<{ success: boolean; data: string[] }>(
      `/appointments/slots?${params.toString()}`
    );
    return res.data || [];
  },

  /**
   * Book an appointment using existing endpoint
   */
  async createAppointment(payload: {
    facility_id: string;
    service_id: string;
    date: string;
    start_time: string;
    notes?: string;
  }): Promise<BookingResult> {
    const res = await apiClient.post<{ success: boolean; data: BookingResult }>(
      '/appointments',
      payload
    );
    return res.data;
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    const res = await apiClient.patch<{ success: boolean; data: Appointment }>(
      `/appointments/${id}/cancel`,
      { cancellation_reason: reason }
    );
    return res.data;
  },

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(
    id: string,
    payload: { date: string; start_time: string; notes?: string }
  ): Promise<Appointment> {
    const res = await apiClient.patch<{ success: boolean; data: Appointment }>(
      `/appointments/${id}/reschedule`,
      payload
    );
    return res.data;
  },
};
