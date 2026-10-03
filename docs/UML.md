# UML MODELING & DIAGRAMS
## MODULE: CUSTOMER QUERY & STAFF MESSAGING (MOD-MSG)

---

### 1. Use Case Diagram

```mermaid
flowchart LR
    Customer((Customer))
    Staff((Staff Operator))
    Admin((Facility Admin))

    subgraph EzQueue Messaging Subsystem
        UC1[UC-MSG-01: Create Customer Query]
        UC2[UC-MSG-02: Send Message]
        UC3[UC-MSG-03: Receive Staff Reply]
        UC4[UC-MSG-04: View Conversation]
        UC5[UC-MSG-05: Mark Conversation Read]
        UC6[UC-MSG-06: Assign Conversation]
        UC7[UC-MSG-07: Change Conversation Status]
        UC8[UC-MSG-08: Resolve Conversation]
        UC9[UC-MSG-09: Reopen Conversation]
        UC10[UC-MSG-10: View Context]
        UC11[UC-MSG-11: Add Internal Note]
        UC12[UC-MSG-12: Realtime Message Sync]
    end

    Customer --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Customer --> UC9
    Customer --> UC12

    Staff --> UC2
    Staff --> UC3
    Staff --> UC4
    Staff --> UC5
    Staff --> UC6
    Staff --> UC7
    Staff --> UC8
    Staff --> UC9
    Staff --> UC10
    Staff --> UC11
    Staff --> UC12

    Admin --> UC4
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    Admin --> UC10
    Admin --> UC11
```

---

### 2. Domain Class Diagram

```mermaid
classDiagram
    class Profile {
        +UUID id
        +String email
        +String full_name
        +String role
        +UUID facility_id
    }

    class Facility {
        +UUID id
        +String name
        +String address
    }

    class Appointment {
        +UUID id
        +String appointment_number
        +DateTime scheduled_time
        +String status
    }

    class QueueTicket {
        +UUID id
        +String ticket_number
        +Integer position
        +String status
    }

    class Conversation {
        +UUID id
        +UUID customer_id
        +UUID facility_id
        +UUID assigned_staff_id
        +UUID appointment_id
        +UUID queue_ticket_id
        +String subject
        +String category
        +String status
        +String priority
        +DateTime created_at
        +DateTime last_message_at
        +DateTime closed_at
    }

    class Message {
        +UUID id
        +UUID conversation_id
        +UUID sender_id
        +String sender_role
        +String content
        +String message_type
        +String status
        +UUID reply_to_message_id
        +DateTime read_at
        +DateTime created_at
    }

    class Participant {
        +UUID conversation_id
        +UUID user_id
        +DateTime joined_at
        +DateTime last_read_at
    }

    class Reaction {
        +UUID id
        +UUID message_id
        +UUID user_id
        +String reaction
    }

    class Attachment {
        +UUID id
        +UUID message_id
        +String file_name
        +String file_path
        +String mime_type
        +Integer file_size
    }

    Profile "1" --> "*" Conversation : customer
    Profile "0..1" --> "*" Conversation : assigned_staff
    Facility "1" --> "*" Conversation : belongs_to
    Appointment "0..1" --> "0..*" Conversation : references
    QueueTicket "0..1" --> "0..*" Conversation : references
    Conversation "1" --> "*" Message : contains
    Conversation "1" --> "*" Participant : tracks
    Message "1" --> "*" Reaction : has
    Message "1" --> "*" Attachment : attaches
    Message "0..1" --> "*" Message : replies_to
```

---

### 3. Sequence Diagram: End-to-End Query & Staff Response

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Patient (Rahul Patel)
    participant WebClient as Customer UI (React)
    participant API as Express API Server
    participant DB as Supabase PostgreSQL
    participant Realtime as Supabase Realtime
    actor Staff as Staff Operator (Dr. Jane Smith)
    participant StaffUI as Staff Chat Workspace

    Customer->>WebClient: Click "Ask a Question" (Attach Appt EZQ-1042)
    WebClient->>API: POST /api/v1/conversations (Subject, Category, Message, Facility)
    API->>API: Validate JWT & Schema (Zod)
    API->>DB: INSERT INTO conversations & messages (ACID transaction)
    DB-->>API: Conversation & Message persisted
    API->>Realtime: Broadcast 'NEW_CONVERSATION' & 'NEW_MESSAGE'
    Realtime-->>StaffUI: Push to Staff Facility Inbox
    StaffUI->>StaffUI: Increment Chat Unread Badge (1 active)
    API-->>WebClient: 201 Created (Conversation Details)
    WebClient->>Customer: Display Active Conversation Timeline

    Staff->>StaffUI: Open Conversation
    StaffUI->>API: PATCH /api/v1/conversations/:id/read
    API->>DB: UPDATE conversation_participants.last_read_at = NOW()
    StaffUI->>StaffUI: View Customer Context (Rahul Patel • Appt EZQ-1042)
    Staff->>StaffUI: Type response & click "Send"
    StaffUI->>API: POST /api/v1/conversations/:id/messages
    API->>DB: INSERT INTO messages (sender_role: 'staff', message_type: 'staff_reply')
    DB-->>API: Message Committed
    API->>Realtime: Broadcast 'NEW_MESSAGE'
    Realtime-->>WebClient: Deliver Staff Reply
    WebClient->>Customer: Render reply in timeline with Sent/Read tick

    Staff->>StaffUI: Click "Mark Resolved"
    StaffUI->>API: PATCH /api/v1/conversations/:id/status (status: 'resolved')
    API->>DB: UPDATE conversations.status = 'resolved'
    API->>Realtime: Broadcast 'STATUS_CHANGED'
    Realtime-->>WebClient: Update Status Pill to 'Resolved'
```
