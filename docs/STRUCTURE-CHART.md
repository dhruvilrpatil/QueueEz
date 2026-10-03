# HIERARCHICAL STRUCTURE CHART
## EZQUEUE ENTERPRISE SYSTEM ARCHITECTURE WITH MESSAGING

---

```
EzQueue Core System
│
├── 1.0 Authentication & User Management (MOD-AUTH)
│     ├── 1.1 Supabase JWT Verification
│     ├── 1.2 Role-Based Access Control (RBAC)
│     └── 1.3 Profile Management
│
├── 2.0 Healthcare Facility Management (MOD-FAC)
│     ├── 2.1 Multi-Tenant Organizations
│     ├── 2.2 Facility Operating Hours & Capacity
│     └── 2.3 Departmental Hierarchy
│
├── 3.0 Clinical Service Catalog (MOD-SRV)
│     ├── 3.1 Service Duration & Buffers
│     └── 3.2 Counter Eligibility
│
├── 4.0 Appointment Management (MOD-APPT)
│     ├── 4.1 Roster Scheduling
│     ├── 4.2 Time-Slot Booking
│     └── 4.3 Check-in & Cancellation
│
├── 5.0 Virtual Queue & Counter Operations (MOD-QUEUE)
│     ├── 5.1 Virtual Queue Session Control
│     ├── 5.2 Token Generation & Position Calculation
│     ├── 5.3 Counter Desk Calling & Transfer
│     └── 5.4 Wait Time Estimation Engine
│
├── 6.0 Notification Subsystem (MOD-NOTIF)
│     ├── 6.1 In-App Notification Delivery
│     ├── 6.2 Twilio SMS Gateway
│     └── 6.3 Email Transports
│
└── 7.0 Customer Query & Staff Messaging (MOD-MSG)
      │
      ├── 7.1 Conversation Management
      │     ├── 7.1.1 Create Support Query
      │     ├── 7.1.2 Assign Conversation (Staff/Admin)
      │     ├── 7.1.3 Update Status (Open, In Progress, Waiting, Resolved, Closed)
      │     ├── 7.1.4 Update Priority (Low, Normal, High, Urgent)
      │     └── 7.1.5 Reopen / Close Conversation
      │
      ├── 7.2 Message Management
      │     ├── 7.2.1 Send Message (Customer / Staff)
      │     ├── 7.2.2 Send Internal Staff Note (Staff Only)
      │     ├── 7.2.3 Retrieve Paginated Timeline
      │     ├── 7.2.4 Message Status Tracking (Sent / Read / Failed)
      │     ├── 7.2.5 Reply-To Quoting
      │     └── 7.2.6 Emoji Reactions
      │
      ├── 7.3 Context Management
      │     ├── 7.3.1 Linked Appointment Context Resolver
      │     ├── 7.3.2 Linked Queue Ticket Context Resolver
      │     └── 7.3.3 Patient Identity & History Card
      │
      └── 7.4 Realtime Synchronization
            ├── 7.4.1 WebSocket Broadcast (Supabase Realtime)
            ├── 7.4.2 Unread Count Cache Invalidation
            ├── 7.4.3 Read Receipt Synchronization
            └── 7.4.4 Realtime Typing Indicator Broadcast
```
