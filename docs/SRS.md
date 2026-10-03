# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## SYSTEM: EZQUEUE SMART APPOINTMENT & VIRTUAL QUEUE MANAGEMENT

**Document Version:** 2.0.0  
**Project:** EzQueue Healthcare Operations System  
**Prepared Under:** IEEE Std 830-1998 Format  
**Status:** Approved for Implementation  

---

### 1. Introduction
EzQueue is an enterprise-grade appointment booking and virtual queue management system built for multi-facility healthcare environments. It provides patient self-check-in, real-time wait estimation, automated SMS notifications, counter operator dispatching, and administrative operational oversight.

---

### 2. Overall Description & System Context
The EzQueue ecosystem encompasses:
* **Customer Subsystem:** Patient account management, facility discovery, service selection, appointment booking, and real-time virtual queue ticket tracking.
* **Staff Subsystem:** Counter terminal management, patient calling, ticket completion, skip handling, and operational metrics.
* **Admin Subsystem:** Multi-tenant facility management, service definition, counter configuration, staff directory, and enterprise analytics.
* **Core Infrastructure:** Express.js TypeScript API, Supabase PostgreSQL, Supabase Auth, and Supabase Realtime WebSocket engine.

---

### 3. Existing Functional Modules
1. `MOD-AUTH`: Authentication & Role-Based Access Control (RBAC)
2. `MOD-FAC`: Healthcare Facilities & Departments
3. `MOD-SRV`: Clinical Services & Operating Hours
4. `MOD-APPT`: Appointment Rostering & Capacity Limits
5. `MOD-QUEUE`: Virtual Queue Sessions, Counter Desks & Token Dispatching
6. `MOD-NOTIF`: Multi-channel Notifications (In-app, SMS, Email)
7. `MOD-ANLYT`: Queue Throughput & SLA Metrics

---

### 4. Messaging & Customer Query Management (MOD-MSG)

#### 4.1 Purpose
The Customer Query & Messaging Module facilitates bidirectional, contextual communication between healthcare patients and clinical staff. It eliminates front-desk bottlenecks by allowing patients to ask questions regarding appointments, queue status, preparation guidelines, and logistics directly from the application.

#### 4.2 Scope
* Creation and categorization of customer queries.
* Contextual linking to active appointments and queue tickets.
* Dedicated Staff Chat Workspace with dual-pane inbox and customer context sidebar.
* Confidential internal staff notes (`INTERNAL_NOTE`) for handover and escalation.
* Real-time bidirectional message streaming and read-receipt synchronization.
* Facility Administrator oversight, assignment, and status audit.

#### 4.3 Actors
* **Customer:** Patient seeking healthcare services, asking questions, reviewing answers, and confirming resolution.
* **Staff:** Clinical operators and nurses reviewing queries, responding to patients, drafting internal notes, and resolving inquiries.
* **Facility Admin:** Healthcare administrator monitoring facility-wide query volumes, reassigning escalations, and reviewing SLA compliance.
* **System Admin:** Platform superuser ensuring cross-tenant isolation and security policy enforcement.

#### 4.4 Functional Requirements Summary
* `FR-MSG-001` through `FR-MSG-014` as defined in `docs/REQUIREMENTS.md`.

#### 4.5 Non-Functional Requirements Summary
* `NFR-MSG-001` through `NFR-MSG-008` as defined in `docs/REQUIREMENTS.md`.

#### 4.6 Assumptions
1. Customers have registered an authenticated profile in EzQueue prior to submitting queries.
2. Clinical staff are assigned to a primary facility (`facility_id`) through their operational profile.
3. Supabase Realtime WebSocket infrastructure is available for state synchronization.
4. Messages consist primarily of text with optional file attachments (images, PDFs) hosted on Supabase Storage.

#### 4.7 Constraints
1. **Bounded Domain Constraint:** The messaging module must reference `appointment_id` and `queue_ticket_id` via foreign keys and must NEVER mutate the operational status of appointments or tickets.
2. **Access Isolation:** Staff cannot view or respond to queries originating from facilities they are not authorized to operate.
3. **Internal Note Redaction:** Customer clients must never receive messages marked as `INTERNAL_NOTE`.

#### 4.8 Use Cases
* `UC-MSG-01`: Create Customer Query
* `UC-MSG-02`: Send Message
* `UC-MSG-03`: Receive Staff Reply
* `UC-MSG-04`: View Conversation
* `UC-MSG-05`: Mark Conversation Read
* `UC-MSG-06`: Assign Conversation
* `UC-MSG-07`: Change Conversation Status
* `UC-MSG-08`: Resolve Conversation
* `UC-MSG-09`: Reopen Conversation
* `UC-MSG-10`: View Appointment/Queue Context
* `UC-MSG-11`: Add Internal Staff Note
* `UC-MSG-12`: Receive Realtime Message Update

#### 4.9 Business Rules
* **BR-MSG-01 (Single Facility Routing):** Every query must be bound to a single healthcare facility.
* **BR-MSG-02 (Staff Eligibility):** Only staff assigned to `facility_id` can claim or reply to queries belonging to that facility.
* **BR-MSG-03 (Customer Confidentiality):** Customers can only read and contribute to queries created under their own `customer_id`.
* **BR-MSG-04 (Auto Status Transition):** When a staff member replies to an `OPEN` query, the status transitions automatically to `IN_PROGRESS`. When staff awaits patient documents, status transitions to `WAITING_FOR_CUSTOMER`.
* **BR-MSG-05 (Reopen Grace Period):** A customer reply on a `RESOLVED` conversation within 48 hours reopens the inquiry. After 48 hours, a new query must be initiated.

#### 4.10 Security Requirements
* All endpoints require valid JWT authentication verified by `apps/api/src/middleware/auth.ts`.
* SQL injection prevention via parameterized queries and Supabase PostgREST ORM.
* Cross-Site Scripting (XSS) prevention via sanitization and plain-text DOM rendering.
* PostgreSQL Row Level Security (RLS) policies acting as secondary defense-in-depth behind Express API authorization.

#### 4.11 Realtime Requirements
* Supabase Realtime channel `realtime:facility-{facilityId}` for staff and `realtime:conversation-{conversationId}` for participants.
* Realtime payloads broadcast record updates upon `INSERT` and `UPDATE` on `conversations` and `messages`.
* Client listeners must immediately unmount and detach WebSocket listeners on view change to prevent memory leaks.
