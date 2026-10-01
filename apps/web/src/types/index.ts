// ============================================================
// Frontend Shared Types – mirrors API types
// ============================================================

export type UserRole = 'customer' | 'staff' | 'facility_admin' | 'system_admin';

export type TicketStatus =
  | 'waiting'
  | 'called'
  | 'checked_in'
  | 'in_service'
  | 'completed'
  | 'skipped'
  | 'cancelled'
  | 'no_show'
  | 'transferred';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export type CounterStatus = 'available' | 'busy' | 'paused' | 'offline';
export type PriorityLevel = 'normal' | 'priority' | 'emergency';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  facility_id?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Facility {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  is_active: boolean;
  max_queue_size: number;
  avg_service_time_minutes: number;
  services?: Service[];
  counters?: Counter[];
  business_hours?: BusinessHour[];
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  facility_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  max_daily_appointments: number;
  allows_walk_in: boolean;
  allows_appointment: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Counter {
  id: string;
  facility_id: string;
  name: string;
  number: number;
  status: CounterStatus;
  current_ticket_id?: string;
  assigned_staff_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessHour {
  id: string;
  facility_id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface Appointment {
  id: string;
  customer_id: string;
  facility_id: string;
  service_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  booking_reference: string;
  notes?: string;
  check_in_time?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  // Joined
  services?: Pick<Service, 'name' | 'duration_minutes'>;
  facilities?: Pick<Facility, 'name' | 'address' | 'city'>;
  profiles?: Pick<Profile, 'full_name' | 'phone'>;
  created_at: string;
  updated_at: string;
}

export interface QueueSession {
  id: string;
  facility_id: string;
  service_id: string;
  date: string;
  status: 'active' | 'paused' | 'closed';
  total_served: number;
  current_number: number;
  created_at: string;
  updated_at: string;
}

export interface QueueTicket {
  id: string;
  queue_session_id: string;
  customer_id: string;
  service_id: string;
  facility_id: string;
  counter_id?: string;
  appointment_id?: string;
  ticket_number: string;
  priority: PriorityLevel;
  status: TicketStatus;
  people_ahead: number;
  estimated_wait_minutes: number;
  joined_at: string;
  called_at?: string;
  service_started_at?: string;
  completed_at?: string;
  notes?: string;
  // Joined
  services?: Pick<Service, 'name' | 'duration_minutes'>;
  facilities?: Pick<Facility, 'name' | 'address'>;
  counters?: Pick<Counter, 'name' | 'number'>;
  profiles?: Pick<Profile, 'full_name' | 'phone'>;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface QueueStats {
  waiting: number;
  called: number;
  in_service: number;
  completed: number;
  skipped: number;
  cancelled: number;
  no_show: number;
  avg_service_time_minutes: number;
}

export interface FacilityAnalytics {
  period: string;
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    no_shows: number;
    scheduled: number;
  };
  queue: {
    total_tickets: number;
    completed: number;
    cancelled: number;
    no_shows: number;
    avg_service_time_minutes: number;
    avg_wait_time_minutes: number;
  };
  chart: Array<{
    date: string;
    appointments: number;
    queue: number;
    completed: number;
  }>;
}
