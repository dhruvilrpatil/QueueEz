// ============================================================
// Shared Types – EzQueue API
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

export type QueueSessionStatus = 'active' | 'paused' | 'closed';

// ============================================================
// Profile / User
// ============================================================

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

// ============================================================
// Organization
// ============================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Facility
// ============================================================

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
  created_at: string;
  updated_at: string;
}

// ============================================================
// Service
// ============================================================

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

// ============================================================
// Counter
// ============================================================

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

// ============================================================
// Business Hours
// ============================================================

export interface BusinessHour {
  id: string;
  facility_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  open_time: string;   // HH:MM
  close_time: string;  // HH:MM
  is_closed: boolean;
}

// ============================================================
// Appointment
// ============================================================

export interface Appointment {
  id: string;
  customer_id: string;
  facility_id: string;
  service_id: string;
  date: string;           // YYYY-MM-DD
  start_time: string;     // HH:MM
  end_time: string;       // HH:MM
  status: AppointmentStatus;
  booking_reference: string;
  notes?: string;
  check_in_time?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Queue
// ============================================================

export interface QueueSession {
  id: string;
  facility_id: string;
  service_id: string;
  date: string;
  status: QueueSessionStatus;
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
  created_at: string;
  updated_at: string;
}

export interface QueueEvent {
  id: string;
  ticket_id: string;
  queue_session_id: string;
  event_type: string;
  actor_id: string;
  previous_status?: TicketStatus;
  new_status: TicketStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ============================================================
// Notification
// ============================================================

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

// ============================================================
// Audit Log
// ============================================================

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ============================================================
// API Response Types
// ============================================================

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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================
// Service Metrics
// ============================================================

export interface ServiceMetrics {
  id: string;
  facility_id: string;
  service_id: string;
  date: string;
  total_appointments: number;
  total_walk_ins: number;
  total_completed: number;
  total_cancelled: number;
  total_no_shows: number;
  avg_wait_time_minutes: number;
  avg_service_time_minutes: number;
  created_at: string;
}
