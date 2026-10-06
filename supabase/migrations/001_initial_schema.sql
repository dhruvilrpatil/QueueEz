-- ============================================================
-- EzQueue Database Schema
-- Supabase PostgreSQL Migration
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('customer', 'staff', 'facility_admin', 'system_admin');
CREATE TYPE ticket_status AS ENUM (
  'waiting', 'called', 'checked_in', 'in_service',
  'completed', 'skipped', 'cancelled', 'no_show', 'transferred'
);
CREATE TYPE appointment_status AS ENUM (
  'scheduled', 'confirmed', 'checked_in', 'in_progress',
  'completed', 'cancelled', 'no_show', 'rescheduled'
);
CREATE TYPE counter_status AS ENUM ('available', 'busy', 'paused', 'offline');
CREATE TYPE priority_level AS ENUM ('normal', 'priority', 'emergency');
CREATE TYPE queue_session_status AS ENUM ('active', 'paused', 'closed');
CREATE TYPE notification_type AS ENUM (
  'appointment_confirmed', 'appointment_reminder', 'appointment_cancelled',
  'ticket_called', 'ticket_completed', 'queue_opened', 'queue_closed',
  'system_alert', 'general'
);

-- ============================================================
-- PROFILES
-- Extends Supabase auth.users
-- ============================================================
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  full_name  TEXT NOT NULL,
  phone      TEXT,
  role       user_role NOT NULL DEFAULT 'customer',
  facility_id UUID, -- assigned facility for staff/admin
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url    TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FACILITIES
-- ============================================================
CREATE TABLE facilities (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                     TEXT NOT NULL,
  slug                     TEXT UNIQUE NOT NULL,
  description              TEXT,
  category                 TEXT NOT NULL, -- clinic, bank, government, etc.
  address                  TEXT NOT NULL,
  city                     TEXT NOT NULL,
  state                    TEXT,
  country                  TEXT NOT NULL DEFAULT 'India',
  phone                    TEXT,
  email                    TEXT,
  website                  TEXT,
  latitude                 DECIMAL(9, 6),
  longitude                DECIMAL(9, 6),
  is_active                BOOLEAN NOT NULL DEFAULT TRUE,
  max_queue_size           INTEGER NOT NULL DEFAULT 200,
  avg_service_time_minutes INTEGER NOT NULL DEFAULT 15,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX facilities_category_idx ON facilities(category);
CREATE INDEX facilities_city_idx ON facilities(city);
CREATE INDEX facilities_name_trgm_idx ON facilities USING gin(name gin_trgm_ops);

-- ============================================================
-- BUSINESS HOURS
-- ============================================================
CREATE TABLE business_hours (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  open_time   TIME NOT NULL,
  close_time  TIME NOT NULL,
  is_closed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(facility_id, day_of_week)
);

-- ============================================================
-- SERVICES
-- ============================================================
CREATE TABLE services (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id            UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  description            TEXT,
  duration_minutes       INTEGER NOT NULL DEFAULT 15,
  max_daily_appointments INTEGER NOT NULL DEFAULT 50,
  allows_walk_in         BOOLEAN NOT NULL DEFAULT TRUE,
  allows_appointment     BOOLEAN NOT NULL DEFAULT TRUE,
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COUNTERS
-- ============================================================
CREATE TABLE counters (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id       UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  number            INTEGER NOT NULL,
  status            counter_status NOT NULL DEFAULT 'offline',
  current_ticket_id UUID, -- FK added after queue_tickets table
  assigned_staff_id UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(facility_id, number)
);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TABLE appointments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id           UUID NOT NULL REFERENCES profiles(id),
  facility_id           UUID NOT NULL REFERENCES facilities(id),
  service_id            UUID NOT NULL REFERENCES services(id),
  counter_id            UUID REFERENCES counters(id),
  date                  DATE NOT NULL,
  start_time            TIME NOT NULL,
  end_time              TIME NOT NULL,
  status                appointment_status NOT NULL DEFAULT 'scheduled',
  booking_reference     TEXT UNIQUE NOT NULL,
  notes                 TEXT,
  check_in_time         TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,
  reminder_sent         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX appointments_customer_idx ON appointments(customer_id);
CREATE INDEX appointments_facility_date_idx ON appointments(facility_id, date);
CREATE INDEX appointments_status_idx ON appointments(status);
CREATE INDEX appointments_booking_ref_idx ON appointments(booking_reference);

-- ============================================================
-- QUEUE SESSIONS
-- ============================================================
CREATE TABLE queue_sessions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id    UUID NOT NULL REFERENCES facilities(id),
  service_id     UUID NOT NULL REFERENCES services(id),
  date           DATE NOT NULL,
  status         queue_session_status NOT NULL DEFAULT 'active',
  current_number INTEGER NOT NULL DEFAULT 0,
  total_served   INTEGER NOT NULL DEFAULT 0,
  notes          TEXT,
  opened_by      UUID REFERENCES profiles(id),
  closed_by      UUID REFERENCES profiles(id),
  opened_at      TIMESTAMPTZ DEFAULT NOW(),
  closed_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(facility_id, service_id, date)
);

-- ============================================================
-- QUEUE TICKETS
-- ============================================================
CREATE TABLE queue_tickets (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_session_id       UUID NOT NULL REFERENCES queue_sessions(id),
  customer_id            UUID NOT NULL REFERENCES profiles(id),
  service_id             UUID NOT NULL REFERENCES services(id),
  facility_id            UUID NOT NULL REFERENCES facilities(id),
  counter_id             UUID REFERENCES counters(id),
  appointment_id         UUID REFERENCES appointments(id),
  ticket_number          TEXT NOT NULL,
  priority               priority_level NOT NULL DEFAULT 'normal',
  status                 ticket_status NOT NULL DEFAULT 'waiting',
  people_ahead           INTEGER NOT NULL DEFAULT 0,
  estimated_wait_minutes INTEGER NOT NULL DEFAULT 0,
  joined_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  called_at              TIMESTAMPTZ,
  checked_in_at          TIMESTAMPTZ,
  service_started_at     TIMESTAMPTZ,
  completed_at           TIMESTAMPTZ,
  notes                  TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(queue_session_id, ticket_number)
);

CREATE INDEX tickets_session_idx ON queue_tickets(queue_session_id);
CREATE INDEX tickets_customer_idx ON queue_tickets(customer_id);
CREATE INDEX tickets_status_idx ON queue_tickets(status);
CREATE INDEX tickets_facility_idx ON queue_tickets(facility_id);

-- Add FK for counters.current_ticket_id now that queue_tickets exists
ALTER TABLE counters
  ADD CONSTRAINT counters_current_ticket_fk
  FOREIGN KEY (current_ticket_id) REFERENCES queue_tickets(id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  data       JSONB,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_idx ON notifications(user_id);
CREATE INDEX notifications_unread_idx ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES profiles(id),
  actor_role  user_role,
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  resource_id UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_actor_idx ON audit_logs(actor_id);
CREATE INDEX audit_logs_resource_idx ON audit_logs(resource, resource_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['profiles', 'organizations', 'facilities', 'services',
    'counters', 'appointments', 'queue_sessions', 'queue_tickets', 'notifications']
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl || '_updated_at', tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Service role bypass (for API server)
-- The API uses supabaseAdmin which bypasses RLS

-- FACILITIES (public read)
CREATE POLICY "Facilities are publicly readable"
  ON facilities FOR SELECT
  USING (is_active = TRUE);

-- SERVICES (public read)
CREATE POLICY "Services are publicly readable"
  ON services FOR SELECT
  USING (is_active = TRUE);

-- APPOINTMENTS
CREATE POLICY "Customers can view own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert own appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- QUEUE SESSIONS (public read for active)
CREATE POLICY "Active queue sessions are publicly readable"
  ON queue_sessions FOR SELECT
  USING (status = 'active');

-- QUEUE TICKETS
CREATE POLICY "Customers can view own tickets"
  ON queue_tickets FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert own tickets"
  ON queue_tickets FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Organization
INSERT INTO organizations (id, name, slug, description)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'EzQueue Demo Org', 'demo-org', 'Demo organization for testing');

-- Facility
INSERT INTO facilities (
  id, organization_id, name, slug, category, address, city, country,
  phone, is_active, max_queue_size, avg_service_time_minutes
)
VALUES
  (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'CityCare Clinic', 'citycare-clinic', 'clinic',
    '12 MG Road, Sector 4', 'Mumbai', 'India',
    '+91-22-12345678', TRUE, 150, 15
  ),
  (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000001',
    'National Bank – Main Branch', 'national-bank-main', 'bank',
    '1 Bank Street, Fort', 'Mumbai', 'India',
    '+91-22-98765432', TRUE, 100, 10
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000001',
    'RTO Office – Bandra', 'rto-bandra', 'government',
    'Plot 5, BKC', 'Mumbai', 'India',
    NULL, TRUE, 200, 20
  );

-- Business hours (Mon-Fri 9am-6pm for clinic)
INSERT INTO business_hours (facility_id, day_of_week, open_time, close_time, is_closed)
SELECT
  '00000000-0000-0000-0000-000000000010',
  d,
  '09:00', '18:00',
  CASE WHEN d = 0 THEN TRUE ELSE FALSE END
FROM generate_series(0, 6) d;

-- Services
INSERT INTO services (id, facility_id, name, description, duration_minutes, max_daily_appointments, allows_walk_in, allows_appointment)
VALUES
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 'General Consultation', 'General OPD consultation', 15, 40, TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', 'Specialist Consultation', 'Specialist OPD', 30, 20, FALSE, TRUE),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000011', 'Account Opening', 'New account opening', 20, 30, TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000011', 'Loan Application', 'Loan processing', 45, 15, FALSE, TRUE),
  ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000012', 'License Renewal', 'Driving license renewal', 20, 50, TRUE, FALSE);

-- Counters
INSERT INTO counters (facility_id, name, number, status)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'Counter 1', 1, 'available'),
  ('00000000-0000-0000-0000-000000000010', 'Counter 2', 2, 'available'),
  ('00000000-0000-0000-0000-000000000010', 'Counter 3', 3, 'offline'),
  ('00000000-0000-0000-0000-000000000011', 'Counter A', 1, 'available'),
  ('00000000-0000-0000-0000-000000000011', 'Counter B', 2, 'available');

-- Enable Supabase Realtime for queue & counter status
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE queue_tickets, counters;
EXCEPTION WHEN OTHERS THEN null;
END $$;

