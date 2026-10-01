import { supabaseAdmin } from '../../lib/supabase';
import {
  ConflictError,
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '../../middleware/errorHandler';
import { CreateAppointmentInput, RescheduleAppointmentInput } from './schema';
import { v4 as uuidv4 } from 'uuid';

function generateBookingReference(): string {
  return `EZ-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .substr(2, 4)
    .toUpperCase()}`;
}

export class AppointmentRepository {
  async findByCustomer(customerId: string, status?: string) {
    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        services(name, duration_minutes),
        facilities(name, address, city)
      `)
      .eq('customer_id', customerId)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async findByFacility(facilityId: string, date?: string) {
    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        profiles(full_name, phone, email),
        services(name, duration_minutes)
      `)
      .eq('facility_id', facilityId)
      .order('date')
      .order('start_time');

    if (date) query = query.eq('date', date);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async findById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        profiles(full_name, phone, email),
        services(name, duration_minutes),
        facilities(name, address, city, phone)
      `)
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundError('Appointment');
    return data;
  }

  async create(customerId: string, input: CreateAppointmentInput) {
    // 1. Validate appointment is in the future
    const appointmentDateTime = new Date(`${input.date}T${input.start_time}`);
    if (appointmentDateTime <= new Date()) {
      throw new BadRequestError('Cannot book appointments in the past');
    }

    // 2. Get service to determine duration and working hours
    const { data: service } = await supabaseAdmin
      .from('services')
      .select('duration_minutes, allows_appointment, max_daily_appointments')
      .eq('id', input.service_id)
      .single();

    if (!service?.allows_appointment) {
      throw new BadRequestError('This service does not accept appointments');
    }

    const durationMinutes = service.duration_minutes || 30;
    const [hours, mins] = input.start_time.split(':').map(Number);
    const endMinutes = hours * 60 + mins + durationMinutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // 3. Check for double booking (same slot)
    const { data: conflicting } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('facility_id', input.facility_id)
      .eq('service_id', input.service_id)
      .eq('date', input.date)
      .not('status', 'in', '(cancelled,no_show,rescheduled)')
      .or(`start_time.lt.${endTime},end_time.gt.${input.start_time}`);

    if (conflicting && conflicting.length > 0) {
      throw new ConflictError('This time slot is already booked');
    }

    // 4. Check daily limit
    const { count: dailyCount } = await supabaseAdmin
      .from('appointments')
      .select('id', { count: 'exact' })
      .eq('facility_id', input.facility_id)
      .eq('service_id', input.service_id)
      .eq('date', input.date)
      .not('status', 'in', '(cancelled,no_show)');

    if ((dailyCount || 0) >= (service.max_daily_appointments || 50)) {
      throw new ConflictError('Daily appointment limit reached for this service');
    }

    // 5. Check customer doesn't already have a booking on same date for same service
    const { data: existingBooking } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('customer_id', customerId)
      .eq('facility_id', input.facility_id)
      .eq('service_id', input.service_id)
      .eq('date', input.date)
      .not('status', 'in', '(cancelled,no_show,rescheduled)')
      .single();

    if (existingBooking) {
      throw new ConflictError('You already have an appointment for this service on this date');
    }

    // 6. Create appointment
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        customer_id: customerId,
        facility_id: input.facility_id,
        service_id: input.service_id,
        date: input.date,
        start_time: input.start_time,
        end_time: endTime,
        status: 'scheduled',
        booking_reference: generateBookingReference(),
        notes: input.notes || null,
      })
      .select()
      .single();

    if (error || !appointment) throw new Error('Failed to create appointment');

    // 7. Create confirmation notification
    await supabaseAdmin.from('notifications').insert({
      user_id: customerId,
      type: 'appointment_confirmed',
      title: 'Appointment Confirmed',
      message: `Your appointment has been confirmed for ${input.date} at ${input.start_time}. Reference: ${appointment.booking_reference}`,
      data: { appointment_id: appointment.id, booking_reference: appointment.booking_reference },
      is_read: false,
    });

    return appointment;
  }

  async cancel(id: string, customerId: string, reason?: string) {
    const appointment = await this.findById(id);

    if (appointment.customer_id !== customerId) {
      throw new ForbiddenError('Not your appointment');
    }

    if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
      throw new BadRequestError(`Cannot cancel an appointment with status: ${appointment.status}`);
    }

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async reschedule(id: string, customerId: string, input: RescheduleAppointmentInput) {
    const appointment = await this.findById(id);

    if (appointment.customer_id !== customerId) {
      throw new ForbiddenError('Not your appointment');
    }

    if (!['scheduled', 'confirmed'].includes(appointment.status)) {
      throw new BadRequestError('Cannot reschedule this appointment');
    }

    const { data: service } = await supabaseAdmin
      .from('services')
      .select('duration_minutes')
      .eq('id', appointment.service_id)
      .single();

    const durationMinutes = service?.duration_minutes || 30;
    const [h, m] = input.start_time.split(':').map(Number);
    const endMinutes = h * 60 + m + durationMinutes;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({
        date: input.date,
        start_time: input.start_time,
        end_time: endTime,
        status: 'rescheduled',
        notes: input.notes || appointment.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getAvailableSlots(facilityId: string, serviceId: string, date: string) {
    const { data: service } = await supabaseAdmin
      .from('services')
      .select('duration_minutes')
      .eq('id', serviceId)
      .single();

    const duration = service?.duration_minutes || 30;

    // Get business hours for this day
    const dayOfWeek = new Date(date).getDay();
    const { data: hours } = await supabaseAdmin
      .from('business_hours')
      .select('open_time, close_time, is_closed')
      .eq('facility_id', facilityId)
      .eq('day_of_week', dayOfWeek)
      .single();

    if (!hours || hours.is_closed) return [];

    // Get existing appointments for this day
    const { data: existing } = await supabaseAdmin
      .from('appointments')
      .select('start_time, end_time')
      .eq('facility_id', facilityId)
      .eq('service_id', serviceId)
      .eq('date', date)
      .not('status', 'in', '(cancelled,no_show,rescheduled)');

    // Generate slots
    const slots: string[] = [];
    const [openH, openM] = hours.open_time.split(':').map(Number);
    const [closeH, closeM] = hours.close_time.split(':').map(Number);
    let current = openH * 60 + openM;
    const end = closeH * 60 + closeM;

    while (current + duration <= end) {
      const slotTime = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
      const slotEnd = current + duration;
      const slotEndTime = `${String(Math.floor(slotEnd / 60)).padStart(2, '0')}:${String(slotEnd % 60).padStart(2, '0')}`;

      // Check if slot conflicts with existing
      const conflict = existing?.some((e: { start_time: string; end_time: string }) => {
        const [eStartH, eStartM] = e.start_time.split(':').map(Number);
        const [eEndH, eEndM] = e.end_time.split(':').map(Number);
        const eStart = eStartH * 60 + eStartM;
        const eEnd = eEndH * 60 + eEndM;
        return current < eEnd && slotEnd > eStart;
      });

      if (!conflict) {
        slots.push(slotTime);
      }

      current += duration;
    }

    return slots;
  }
}
