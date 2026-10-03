-- ============================================================
-- EzQueue Messaging & Customer Query Subsystem Schema
-- Migration: 002_messaging_schema.sql
-- ============================================================

-- 1. Custom Enumerations
DO $$ BEGIN
  CREATE TYPE conversation_status AS ENUM (
    'open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE conversation_priority AS ENUM (
    'low', 'normal', 'high', 'urgent'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE conversation_category AS ENUM (
    'appointment', 'queue', 'service', 'facility',
    'documents', 'technical_issue', 'payment_fees', 'general_query'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE message_type AS ENUM (
    'customer_message', 'staff_reply', 'internal_note', 'system_event'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE message_status AS ENUM (
    'sent', 'read', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  assigned_staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  queue_ticket_id UUID REFERENCES queue_tickets(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  subject TEXT NOT NULL CHECK (char_length(trim(subject)) >= 3 AND char_length(subject) <= 200),
  category conversation_category NOT NULL DEFAULT 'general_query',
  status conversation_status NOT NULL DEFAULT 'open',
  priority conversation_priority NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- 3. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role user_role NOT NULL,
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 10000),
  message_type message_type NOT NULL DEFAULT 'customer_message',
  status message_status NOT NULL DEFAULT 'sent',
  reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 4. Conversation Participants Table
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- 5. Message Reactions Table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction)
);

-- 6. Message Attachments Table
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_facility_id ON conversations(facility_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_staff_id ON conversations(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_priority ON conversations(priority);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_participants_user_last_read ON conversation_participants(user_id, last_read_at);

-- 8. Trigger Functions
CREATE OR REPLACE FUNCTION on_message_inserted()
RETURNS TRIGGER AS $$
BEGIN
  -- Advance last_message_at on parent conversation
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;

  -- Ensure sender is marked as participant and has updated last_read_at
  INSERT INTO conversation_participants (conversation_id, user_id, last_read_at)
  VALUES (NEW.conversation_id, NEW.sender_id, NEW.created_at)
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET last_read_at = EXCLUDED.last_read_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_on_message_inserted ON messages;
CREATE TRIGGER trigger_on_message_inserted
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION on_message_inserted();

-- 9. Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Conversations RLS Policies
CREATE POLICY "Customers view own conversations"
  ON conversations FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Customers create own conversations"
  ON conversations FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Staff view facility conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'facility_admin')
        AND facility_id = conversations.facility_id
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'system_admin'
    )
  );

CREATE POLICY "Staff update facility conversations"
  ON conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'facility_admin', 'system_admin')
        AND (facility_id = conversations.facility_id OR role = 'system_admin')
    )
  );

-- Messages RLS Policies
CREATE POLICY "Customers view messages in own conversations (excluding internal notes)"
  ON messages FOR SELECT
  USING (
    message_type != 'internal_note'
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
        AND customer_id = auth.uid()
    )
  );

CREATE POLICY "Customers insert messages into own active conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND message_type = 'customer_message'
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
        AND customer_id = auth.uid()
        AND status != 'closed'
    )
  );

CREATE POLICY "Staff view all messages in facility conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = messages.conversation_id
        AND (p.facility_id = c.facility_id OR p.role = 'system_admin')
        AND p.role IN ('staff', 'facility_admin', 'system_admin')
    )
  );

CREATE POLICY "Staff insert messages and internal notes"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = conversation_id
        AND (p.facility_id = c.facility_id OR p.role = 'system_admin')
        AND p.role IN ('staff', 'facility_admin', 'system_admin')
    )
  );

-- Enable Supabase Realtime for messaging
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conversations, messages, conversation_participants;
EXCEPTION WHEN OTHERS THEN null;
END $$;
