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

---

### 5. Guided Appointment Booking UX/UI Subsystem (MOD-APPT-UX)

#### 5.1 Purpose & Scope
The Guided Appointment Booking Subsystem redesigns and streamlines the patient-facing appointment reservation experience. It replaces multi-field complex forms with a progressive, 3-step "one decision at a time" interaction flow that eliminates user cognitive overload and minimizes booking drop-offs while reusing the existing Express.js and Supabase appointment backend.

#### 5.2 Functional Requirements
* **FR-APPT-UX-001 (Guided Progressive Disclosure):** The system shall provide a simple, guided appointment booking interface that minimizes user confusion and prevents invalid or duplicate bookings.
* **FR-APPT-UX-002 (3-Step Progress Tracking):** The interface shall structure booking into three distinct sequential steps:
  1. *Step 1: Choose Service* (displaying service name, description, duration, and availability)
  2. *Step 2: Choose Date & Time* (scannable grouped slots: Morning, Afternoon, Evening)
  3. *Step 3: Review & Confirm* (complete appointment review and final authorization)
* **FR-APPT-UX-003 (Dynamic Slot Availability):** Real-time available slots shall be queried dynamically from `GET /api/v1/appointments/slots` based on facility operating hours and existing bookings.
* **FR-APPT-UX-004 (Double Submission Guard):** The confirmation action button shall disable immediately upon submission, display a `Confirming...` loading state, and preserve button width to prevent accidental duplicate bookings.
* **FR-APPT-UX-005 (Slot Conflict Recovery):** If a selected slot is booked concurrently before confirmation, the system shall display a friendly conflict notice and return the user to the time selection step while preserving selected service and date.
* **FR-APPT-UX-006 (Zero Form Fatigue):** Authenticated patient credentials (name, email, phone) shall be automatically bound to the booking without requiring redundant re-entry.
* **FR-APPT-UX-007 (Calendar Synchronization):** Upon booking confirmation, the system shall provide an instant `.ics` calendar file download for device calendar integration alongside direct links to `/app/appointments` and `/app/dashboard`.

---

### 6. Staff Queue TV Display Subsystem (MOD-QUEUE-TV)

#### 6.1 Purpose & Scope
The Staff Queue TV Display Subsystem provides a dedicated, read-only public waiting area visual board for reception screens, clinic TVs, and monitors. It presents live queue progress with ultra-high contrast and readability from several meters away, completely eliminating patient ambiguity regarding which ticket is being called and which counter desk to visit. It strictly operates on the existing queue backend and Supabase Realtime channel with zero secondary queue state duplication or write mutations.

#### 6.2 Functional Requirements
* **FR-TV-001 (Dedicated Staff Navigation & Route):** The system shall provide a dedicated navigation entry `TV Display` under the Staff navigation menu (`AppSidebar.tsx`) routing to `/staff/queue-display`, protected by existing Staff/Admin RBAC.
* **FR-TV-002 (Dual-Mode Operation):** The TV Display shall provide two operating modes:
  1. *Normal Preview Mode*: Embedded within the staff layout with interactive chime testing, sound toggle, service category filtering, and operational metrics.
  2. *Fullscreen Display Mode*: Activated via `[Enter Fullscreen]` using the browser Fullscreen API (`document.documentElement.requestFullscreen()`), automatically suppressing unnecessary chrome and floating controls on mouse idle.
* **FR-TV-003 (Strict Light-Theme High-Contrast Aesthetic):** The TV screen shall adhere strictly to a crisp light theme (`#FFFFFF` background, `#F8F9FA` surfaces, `#E5E7EB` hairline borders, `#111111` typography) following `DESIGN.md`. Dark themes, glassmorphism, neon colors, and AI glowing effects are explicitly prohibited.
* **FR-TV-004 (Visual Information Hierarchy & Scaling):** The public board shall prioritize information in the following strict hierarchy:
  1. *Hero NOW SERVING*: Ticket number scaled dynamically via `clamp(4.25rem, 11vw, 10.5rem)` with target desk announcement (`PLEASE PROCEED TO COUNTER X`).
  2. *Active Counters Dynamic Grid*: Scannable cards adapting to open desks showing counter name, staff assignment, and currently served ticket.
  3. *Next in Line Queue Strip*: Sequential upcoming waiting tickets ordered by backend queue rules without revealing private customer data.
  4. *Header & Footer Guidance*: Facility name, active service, local live clock, live sync status, and waiting count ticker.
* **FR-TV-005 (Real-Time Reactive Streaming):** The display shall subscribe to Supabase Realtime `postgres_changes` on `queue_tickets` and `counters` scoped to the authenticated facility. State changes (ticket called, served, completed, skipped) shall reflect instantly without full-page reloads.
* **FR-TV-006 (Zero Customer PII Exposure):** The public board shall never render patient names, telephone numbers, email addresses, or private appointment notes. Only ticket identifiers, service names, and counter numbers shall be displayed.
* **FR-TV-007 (Announcement Chime & Attention Highlight):** When a new ticket is called, the display shall trigger a short visual pulse (300-500ms) on the ticket card and play a harmonic dual-tone clinic chime (C5 -> E5) via Web Audio API when sound is enabled.
* **FR-TV-008 (Connection Lifecycle & Stale Data Protection):** The interface shall display a discreet `Live Sync` vs `Reconnecting...` indicator. If connectivity is lost, last known state is retained with a subtle notice, and automatic queue resynchronization occurs immediately upon reconnection.
* **FR-TV-009 (Strict Read-Only Enforcement):** The TV Display interface shall not expose queue manipulation controls (Call Next, Serve, Complete, Skip). All queue modifications remain strictly confined to the existing staff queue dashboard.


