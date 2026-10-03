# EZQUEUE SYSTEM REQUIREMENTS SPECIFICATION
## MODULE: CUSTOMER QUERY & STAFF MESSAGING (MOD-MSG)

**Document Reference:** REQ-MSG-V1  
**Project:** EzQueue – Smart Appointment & Virtual Queue Management  
**Standard:** IEEE 830-1998 Software Requirements Specification Guidelines  

---

### 1. Functional Requirements

#### FR-MSG-001: Query Creation
The system shall permit an authenticated customer to initiate a new support/operational query with a required subject, mandatory category, message content, and target facility.

#### FR-MSG-002: Query Categorization
The system shall require the customer to select exactly one category from predefined options:
* `appointment` (Appointment Inquiries)
* `queue` (Queue Token & Waiting Times)
* `service` (Healthcare Services & Procedures)
* `facility` (Directions, Parking & Logistics)
* `documents` (Pre-registration & Insurance Papers)
* `technical_issue` (App & Virtual Token Errors)
* `payment_fees` (Billing & Fee Structures)
* `general_query` (General Inquiries)

#### FR-MSG-003: Appointment Context Association
The system shall allow the customer to associate a query with an existing appointment belonging to them. When initiated from an appointment details screen, the appointment reference (`appointment_id`) shall be linked automatically without requiring manual ID entry.

#### FR-MSG-004: Queue Ticket Context Association
The system shall allow the customer to associate a query with an active virtual queue ticket (`queue_ticket_id`). When initiated from the live queue tracker, the ticket token reference (e.g. `A-104`) shall be linked automatically.

#### FR-MSG-005: Conversation & Message History Persistence
The system shall persistently store all conversation headers and chronologically ordered messages in the PostgreSQL database with timestamps, sender identity, sender role, and delivery status.

#### FR-MSG-006: Facility Staff Query Inbox
Authorized facility staff and facility administrators shall be able to view all customer queries directed to their assigned facility, with status, priority, and last updated indicators.

#### FR-MSG-007: Staff Reply Capability
Authorized staff shall be able to submit text responses to customer queries within their assigned facility, automatically transitioning conversations from `open` or `waiting_for_customer` to `in_progress`.

#### FR-MSG-008: Unread Message Tracking & Badges
The system shall compute unread message counts per participant using the formula:
$$\text{Unread} = \{ m \in \text{Messages} \mid m.\text{created\_at} > p.\text{last\_read\_at} \land m.\text{sender\_id} \neq p.\text{user\_id} \}$$
Staff navigation shall display a dedicated badge showing the active unread count calculated from database state.

#### FR-MSG-009: Realtime Message Synchronization
The system shall propagate new messages, message read events, status changes, and assignments to connected clients via Supabase Realtime channels within $\le 500\text{ ms}$ without full page reloads.

#### FR-MSG-010: Conversation Status Management
Authorized staff and administrators shall be able to change conversation lifecycle statuses according to the defined state machine:
$$\text{OPEN} \longrightarrow \text{IN\_PROGRESS} \rightleftharpoons \text{WAITING\_FOR\_CUSTOMER} \longrightarrow \text{RESOLVED} \longrightarrow \text{CLOSED}$$

#### FR-MSG-011: Conversation Assignment
Authorized staff shall be able to assign a conversation to themselves ("Assign to Me") or reassign it to another qualified healthcare operator within the facility.

#### FR-MSG-012: Unauthorized Access Prevention
The system shall strictly prevent unauthorized users from viewing or posting messages to conversations they do not own or are not assigned to manage.

#### FR-MSG-013: Customer Historical Queries View
The system shall provide a dedicated view (`/app/messages`) where customers can view their active and past resolved queries with status pills, timestamps, and staff responses.

#### FR-MSG-014: Conversation Resolution & Reopening
The system shall allow staff to mark queries as `RESOLVED`. If a customer submits a subsequent inquiry on a resolved ticket within a permitted grace period, the system shall transition status to `REOPENED` and notify staff.

---

### 2. Non-Functional Requirements

#### NFR-MSG-001: Data Persistence & ACID Compliance
All messages and conversation state transitions shall be committed to PostgreSQL within strict ACID transactions. No message transmission shall be reported as delivered unless successfully written to the database.

#### NFR-MSG-002: Security & Tenant Isolation
Row Level Security (RLS) policies and backend API middleware shall enforce multi-tenant isolation. Under no circumstances shall staff of Facility A access conversations belonging to Facility B, nor shall Customer X access conversations of Customer Y.

#### NFR-MSG-003: Confidentiality of Internal Staff Notes
Internal operational notes (`message_type: 'INTERNAL_NOTE'`) recorded by healthcare operators shall remain strictly confidential to staff and facility administrators. The API layer shall filter internal notes from customer serialization, and database RLS shall enforce zero read privilege for customer roles.

#### NFR-MSG-004: Low-Latency Realtime Synchronization
Message broadcast to active WebSocket subscriptions shall achieve a 95th percentile latency of under 500 milliseconds under nominal network conditions.

#### NFR-MSG-005: Responsive Human-Interface Design
The messaging user interface shall provide responsive layout adaptation across mobile (single-column card flow) and desktop (dual-pane inbox and workspace) conforming to `DESIGN.md`.

#### NFR-MSG-006: Composer Fault Tolerance & Error Recovery
The message composer shall provide explicit optimistic rendering, loading spinners, and failure retry buttons if a transmission fails due to network dropouts.

#### NFR-MSG-007: Defense-in-Depth Input Validation
All text content shall be validated on the server with Zod schemas: minimum length 1 character, maximum length 10,000 characters, whitespace trimming, and prevention of script injection through safe text rendering.

#### NFR-MSG-008: Modularity & Low Coupling
The messaging module shall exist as a bounded context that references existing appointments and queue tickets by ID without introducing circular dependencies or direct mutations into core booking tables.
