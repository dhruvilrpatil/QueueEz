# SOFTWARE DEVELOPMENT METHODOLOGY (SDM)
## CHANGE REQUEST: CUSTOMER QUERY & STAFF MESSAGING MODULE

**Document ID:** CR-MSG-001  
**Project:** EzQueue – Smart Appointment & Virtual Queue Management System  
**System Version:** 1.2.0  
**Status:** Approved  
**Priority:** High  
**Requestor:** Product & Operations Management  
**Date:** 2026-10-03  

---

### 1. Change Request Identification
* **Change Request ID:** `CR-MSG-001`
* **Feature Name:** Customer Query & Staff Messaging Subsystem
* **Module Code:** `MOD-MSG`
* **Target Release:** Release 1.3.0

---

### 2. Reason for Change
Customers using EzQueue currently have access to scheduled appointments and live virtual queue tokens, but have **no structured, contextual channel to communicate with facility staff**. When customers have inquiries regarding:
1. Approaching queue token arrival and check-in procedures,
2. Pre-appointment preparation (e.g. fasting, medical documentation, insurance papers),
3. Service duration, delays, or rescheduling constraints,
4. Counter directions or general facility logistics,

they are forced to either leave the virtual queue, crowd physical reception desks, or make unscheduled phone calls. This degrades the virtual queue experience and causes staff workload spikes. Introducing a contextual query and messaging module directly inside EzQueue solves this bottleneck while preserving operational context.

---

### 3. Existing System Impact Analysis

| System Component | Existing Capability | Impact of Proposed Change | Risk Level |
| :--- | :--- | :--- | :--- |
| **Customer Portal** | View appointments, track live queue, view profile | Adds dedicated "Help & Queries" tab and "Ask a Question" workflow linked to appointments and queue tokens | Low |
| **Staff Workspace** | Live queue dispatch, counter operations, served roster | Adds dedicated "Chat" workspace with unread badge counters, dual-pane conversation inbox, and context viewer | Medium |
| **Admin Portal** | Facility oversight, service configuration, staff directory | Adds facility-level conversation audit, escalation, reassignment, and SLA tracking | Low |
| **Database (Supabase PostgreSQL)** | Facilities, services, counters, appointments, tickets, profiles | Introduces 5 normalized tables (`conversations`, `messages`, `conversation_participants`, `message_reactions`, `message_attachments`) with RLS | Medium |
| **Realtime Engine** | Queue updates and token calling notifications | Extends Supabase Realtime channels for instant message delivery, read receipts, and typing broadcasts | Medium |
| **Notification Engine** | In-app, SMS, email alerts for tokens & appointments | Dispatches query and reply alerts to staff and customer without duplicate triggers | Low |
| **RBAC & Security** | Role-based authorization (`customer`, `staff`, `facility_admin`, `system_admin`) | Extends authorization policies: customers see only own queries; staff see facility queries; internal notes restricted to staff/admin | High (Critical) |

---

### 4. Proposed Change Specification
1. **Bounded Subsystem Architecture**: Implement Messaging as an application-level subsystem that references existing `facilities`, `appointments`, `queue_tickets`, and `services` via foreign keys without mutating appointment or queue operational states.
2. **Contextual Association**: Allow customers to attach active appointment IDs (`EZQ-1042`) or queue ticket tokens (`A-104`) when opening a query.
3. **Dual-Role Communication Workflow**:
   * **Customer Experience**: Streamlined conversation timeline, message status indicators, composer, and resolution acknowledgment.
   * **Staff Workspace**: Split-pane inbox, filter tabs (*All*, *Unread*, *Open*, *Waiting for Customer*, *Resolved*, *Assigned to Me*), quick contextual sidebar, internal notes capability (`message_type: 'INTERNAL_NOTE'`), assignment controls, and status transitions.
4. **Realtime Synchronization**: Multi-client event propagation via Supabase Realtime for instant updates without page reloads.

---

### 5. Affected Modules & Artifacts
* **Frontend (`apps/web`)**:
  * New features directory: `apps/web/src/features/messaging/`
  * New components directory: `apps/web/src/components/messaging/`
  * New pages: `MessagesPage.tsx` (Customer), `ChatPage.tsx` (Staff), `AdminChatPage.tsx` (Admin)
  * Updated navigation: `AppSidebar.tsx` with live unread badge counters
  * Updated routes: `App.tsx`
* **Backend (`apps/api`)**:
  * New module: `apps/api/src/modules/messaging/` (`controller.ts`, `service.ts`, `repository.ts`, `schema.ts`, `policies.ts`, `routes.ts`, `types.ts`)
  * Router registration: `apps/api/src/app.ts` (`/api/v1/conversations`)
* **Database (`supabase/migrations/`)**:
  * Migration: `002_messaging_schema.sql`

---

### 6. Security Impact & Controls
1. **Server-Side Authorization**: Endpoints derive user identity strictly from authenticated JWT (`req.user.id`). Identity cannot be spoofed by client payload.
2. **Row Level Security (RLS)**: PostgreSQL policies enforce strict row isolation. Customers can only read and insert into their own conversations.
3. **Internal Notes Confidentiality**: `message_type = 'INTERNAL_NOTE'` is strictly filtered from customer queries at both the database RLS layer and the API repository layer.
4. **Input Sanitization & Constraints**: Maximum message length of 10,000 characters, whitespace trimming, empty content rejection, and safe plain-text rendering to prevent XSS.

---

### 7. Testing & SQA Impact
* **Unit Testing**: Validation schemas, state machine transition validity, RLS policy logic, unread count calculators.
* **Integration Testing**: Message dispatch, Supabase persistence, API authorization, notification triggering.
* **System E2E Testing**: Complete flow (Customer Query → Staff Notification → Staff Reply → Customer Realtime Receipt → Resolution).
* **Regression Testing**: Ensure no regressions on appointment booking, queue ticket dispatch, or authentication.

---

### 8. Approval & Sign-Off
* **System Architect:** Approved (SDM Architecture Board)
* **Lead Backend Engineer:** Approved
* **Lead Frontend Engineer:** Approved
* **Quality Assurance Lead:** Approved
