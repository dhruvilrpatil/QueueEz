# DETAILED DESIGN SPECIFICATION
## MODULE: CUSTOMER QUERY & STAFF MESSAGING (MOD-MSG)

---

### 1. Module Responsibilities
* **`MOD-MSG`** owns:
  * Conversation lifecycle, metadata, category, priority, status.
  * Message payloads, types (`CUSTOMER_MESSAGE`, `STAFF_REPLY`, `INTERNAL_NOTE`, `SYSTEM_EVENT`), timestamps, read status.
  * Participant activity and per-user read pointers (`last_read_at`).
  * Message reactions and attachment metadata.
* **`MOD-MSG`** references (does NOT own):
  * Patient demographic records (`profiles`).
  * Scheduled appointment slots (`appointments`).
  * Real-time queue sessions and tokens (`queue_tickets`).
  * Healthcare clinics and counter stations (`facilities`, `counters`).

---

### 2. Data Model & Relational Schema

```sql
-- Conversations Table
CREATE TABLE conversations (
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

-- Messages Table
CREATE TABLE messages (
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

-- Conversation Participants Table
CREATE TABLE conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);
```

---

### 3. REST API Specifications

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/conversations` | List conversations (filterable by status, priority, search, page) | Authenticated |
| `GET` | `/api/v1/conversations/unread-count` | Retrieve actual unread query count for staff/customer badge | Authenticated |
| `GET` | `/api/v1/conversations/:id` | Get single conversation with linked appointment/queue context | Authorized Participant/Staff |
| `POST` | `/api/v1/conversations` | Create a new customer inquiry | Customer |
| `GET` | `/api/v1/conversations/:id/messages` | Get paginated message history | Authorized Participant/Staff |
| `POST` | `/api/v1/conversations/:id/messages` | Post a reply or internal note | Authorized Participant/Staff |
| `PATCH` | `/api/v1/conversations/:id/read` | Update participant `last_read_at` pointer | Authorized Participant |
| `PATCH` | `/api/v1/conversations/:id/status` | Update lifecycle status (`in_progress`, `resolved`, etc.) | Staff / Facility Admin |
| `PATCH` | `/api/v1/conversations/:id/priority` | Update priority tier (`low`, `normal`, `high`, `urgent`) | Staff / Facility Admin |
| `PATCH` | `/api/v1/conversations/:id/assign` | Assign query to specific staff operator | Staff / Facility Admin |
| `POST` | `/api/v1/messages/:id/reactions` | Add emoji reaction to message | Authorized Participant |
| `DELETE` | `/api/v1/messages/:id/reactions/:reactionId` | Remove emoji reaction from message | Author of reaction |

---

### 4. Queue & Appointment Context Linking Logic

When a customer creates a query:
1. **Appointment Context Attachment**:
   * If `appointment_id` is supplied, the repository joins `appointments` to extract `appointment_number`, `scheduled_time`, and `service_name`.
   * Staff workspace displays an **Appointment Context Pill** (`EZQ-1042 • Today 3:00 PM`) with a single-click "View Appointment" shortcut.
2. **Queue Ticket Context Attachment**:
   * If `queue_ticket_id` is supplied, the repository joins `queue_tickets` to extract `ticket_number` (`A-104`), current queue position, and estimated minutes remaining.
   * Staff workspace displays a **Queue Context Pill** (`Token A-104 • 6 ahead • ~24 min`) with a "View Queue" action button.

---

### 5. Realtime Architecture & Subscription Lifecycle

```
Client Navigation
      │
      ▼
useMessagingRealtime Hook Mounted
      │
      ├── Connect to Database Realtime Channel:
      │   `realtime:conversations:${conversationId}`
      │
      ├── Listen for postgres_changes:
      │   - INSERT on messages -> Trigger queryClient.setQueryData (append message)
      │   - UPDATE on conversations -> Trigger queryClient.invalidateQueries
      │   - UPDATE on conversation_participants -> Sync read checks
      │
      └── Component Unmount / Route Change:
          └── supabase.removeChannel(channel) (guarantees zero memory leaks)
```
