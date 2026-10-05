# DETAILED TEST CASES SPECIFICATION
## MODULE: CUSTOMER QUERY & STAFF MESSAGING (MOD-MSG)

**Standard:** IEEE 829 Standard Test Case Specification  
**Total Test Cases:** 28  

---

| Test ID | Req ID | Test Scenario | Preconditions | Test Data / Payload | Execution Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-MSG-001** | FR-MSG-001 | Create valid customer query | Authenticated as customer | Subject: "Appointment timing", Category: "appointment", Facility: Metro Hospital | 1. Open Ask Question Modal<br>2. Fill fields<br>3. Submit | 201 Created; record inserted in `conversations` & `messages` | As expected | **PASS** |
| **TC-MSG-002** | FR-MSG-001 | Reject empty query message | Authenticated as customer | Content: "   " (whitespace) | 1. Fill subject<br>2. Leave message blank<br>3. Click Submit | 400 Bad Request; validation error returned | As expected | **PASS** |
| **TC-MSG-003** | FR-MSG-001 | Reject oversized query message | Authenticated as customer | Content: String of 10,001 characters | 1. Paste 10,001 chars in composer<br>2. Submit | 400 Bad Request; length limit violated error | As expected | **PASS** |
| **TC-MSG-004** | FR-MSG-002 | Validate query category selection | Authenticated as customer | Category: "invalid_category" | 1. Send API POST with arbitrary category | 400 Bad Request; enum check fails | As expected | **PASS** |
| **TC-MSG-005** | FR-MSG-003 | Auto-link appointment context | Customer has confirmed appointment EZQ-1042 | `appointment_id: "00000000-0000-0000-0000-000000000020"` | 1. Click "Ask Question" from Appointment screen<br>2. Submit | Conversation created with linked appointment; staff sees appointment context card | As expected | **PASS** |
| **TC-MSG-006** | FR-MSG-004 | Auto-link queue ticket context | Customer has active ticket A-104 | `queue_ticket_id: "00000000-0000-0000-0000-000000000030"` | 1. Click "Ask Question" from Live Queue screen<br>2. Submit | Conversation created with linked ticket token; staff sees queue position pill | As expected | **PASS** |
| **TC-MSG-007** | FR-MSG-005 | Chronological message ordering | Active conversation with 5 messages | Multiple messages across timestamps | 1. GET `/conversations/:id/messages` | Messages returned sorted ascending by `created_at` | As expected | **PASS** |
| **TC-MSG-008** | FR-MSG-006 | Staff views facility query inbox | Logged in as Staff for Facility X | Facility X ID | 1. Open `/staff/chat`<br>2. View conversation list | Only queries belonging to Facility X are visible | As expected | **PASS** |
| **TC-MSG-009** | FR-MSG-006 | Prevent staff from viewing Facility Y queries | Staff assigned to Facility X | Conversation belonging to Facility Y | 1. Staff attempts GET `/conversations/:id_of_facility_y` | 403 Forbidden; access denied | As expected | **PASS** |
| **TC-MSG-010** | FR-MSG-007 | Staff sends reply to customer | Logged in as Staff | Content: "Please arrive 15 minutes early" | 1. Open conversation<br>2. Type reply<br>3. Click Send | Message saved with `sender_role: 'staff'`, customer receives message | As expected | **PASS** |
| **TC-MSG-011** | FR-MSG-008 | Unread badge calculation for staff | Conversation has 2 unread customer messages | Customer posts 2 messages | 1. Inspect Staff sidebar badge | Badge indicates `2 active` or incremented unread count | As expected | **PASS** |
| **TC-MSG-012** | FR-MSG-008 | Clear unread count upon opening conversation | Staff opens conversation with unread messages | Conversation ID | 1. Staff opens conversation<br>2. PATCH `/conversations/:id/read` | `last_read_at` updated to NOW; unread badge decrements immediately | As expected | **PASS** |
| **TC-MSG-013** | FR-MSG-009 | Realtime message propagation | Customer and Staff both connected via WebSocket | New message payload | 1. Customer sends message<br>2. Observe Staff UI | Message appears in staff timeline within < 500ms without reload | As expected | **PASS** |
| **TC-MSG-014** | FR-MSG-010 | Transition OPEN to IN_PROGRESS | Conversation in OPEN state | Staff reply | 1. Staff submits first reply | Conversation status automatically transitions to `in_progress` | As expected | **PASS** |
| **TC-MSG-015** | FR-MSG-010 | Reject invalid state transition | Conversation in CLOSED state | Target status: OPEN | 1. Send PATCH `/conversations/:id/status` with `open` | 422 Unprocessable Entity; invalid transition | As expected | **PASS** |
| **TC-MSG-016** | FR-MSG-011 | Staff self-assignment ("Assign to Me") | Staff logged in | Staff ID | 1. Click "Assign to Me" | `assigned_staff_id` updated to current user; system event logged | As expected | **PASS** |
| **TC-MSG-017** | FR-MSG-011 | Admin reassigns conversation | Facility Admin logged in | Target Staff ID: "Dr. Marcus" | 1. Select staff from dropdown<br>2. Confirm | Conversation reassigned; notification dispatched to new assignee | As expected | **PASS** |
| **TC-MSG-018** | FR-MSG-012 | Customer cannot access other customer queries | Logged in as Customer A | Conversation ID belonging to Customer B | 1. Attempt GET `/conversations/:id_B` | 403 Forbidden; RLS and API policy block access | As expected | **PASS** |
| **TC-MSG-019** | FR-MSG-013 | Customer historical queries view | Customer has 3 past queries | Customer ID | 1. Open `/app/messages` | All 3 conversations listed with status pills and timestamps | As expected | **PASS** |
| **TC-MSG-020** | FR-MSG-014 | Staff marks conversation resolved | Conversation IN_PROGRESS | Status: `resolved` | 1. Click "Mark Resolved" | Status changes to `resolved`; customer UI displays resolved banner | As expected | **PASS** |
| **TC-MSG-021** | FR-MSG-014 | Customer reopens resolved query | Conversation RESOLVED within 24h | Content: "Wait, one more question" | 1. Customer posts follow-up | Conversation transitions to `in_progress`; staff alerted | As expected | **PASS** |
| **TC-MSG-022** | NFR-MSG-003 | Staff adds internal note | Staff logged in | `message_type: 'internal_note'` | 1. Toggle Internal Note in composer<br>2. Submit note | Note rendered with yellow badge for staff | As expected | **PASS** |
| **TC-MSG-023** | NFR-MSG-003 | Redaction of internal notes from customer | Conversation contains 1 internal note and 2 public messages | Customer logged in | 1. Customer loads `/conversations/:id/messages` | Internal note is completely excluded from response (only 2 public returned) | As expected | **PASS** |
| **TC-MSG-024** | NFR-MSG-007 | XSS script injection sanitization | Content: `<script>alert('xss')</script>` | Malicious HTML string | 1. Submit message with HTML payload | Rendered as escaped plain text; script does not execute | As expected | **PASS** |
| **TC-MSG-025** | NFR-MSG-006 | Composer offline failure & retry | Simulated network dropout | Valid message content | 1. Disconnect network<br>2. Click Send | Message displays `FAILED` with red retry button; text preserved | As expected | **PASS** |
| **TC-MSG-026** | FR-MSG-001 | Customer submits query with non-existent appointment ID | Invalid appointment UUID | `appointment_id: "99999999-..."` | 1. POST query with bad appointment ID | 400 Bad Request; foreign key constraint violation handled cleanly | As expected | **PASS** |
| **TC-MSG-027** | FR-MSG-001 | Priority escalation to URGENT | Category: "emergency" / critical | Priority: `urgent` | 1. Submit query with urgent flag | Flagged as urgent with red priority pill; top of staff inbox | As expected | **PASS** |
| **TC-MSG-028** | FR-MSG-009 | Realtime channel cleanup on unmount | Customer navigates from Chat to Dashboard | Component lifecycle | 1. Open Chat<br>2. Navigate to Dashboard | `supabase.removeChannel` called; zero memory leaks or dangling sockets | As expected | **PASS** |

---

## MODULE: GUIDED APPOINTMENT BOOKING UX/UI (MOD-APPT-UX)

| Test ID | Req ID | Test Scenario | Preconditions | Test Data / Payload | Execution Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-APPT-UX-01** | FR-APPT-UX-001 | 3-Step Guided Flow Progression | Customer logged in | Facility ID, General Consultation | 1. Open Booking Flow<br>2. Select Service<br>3. Verify Step 2 unlocks | Interface progresses to Date & Time with breadcrumb indicator | As expected | **PASS** |
| **TC-APPT-UX-02** | FR-APPT-UX-002 | Continue button disabled until service selected | Step 1 active | No service selected | 1. View Step 1<br>2. Attempt to click Continue | Continue button is disabled with opacity 60% and not clickable | As expected | **PASS** |
| **TC-APPT-UX-03** | FR-APPT-UX-003 | Dynamic availability slots query | Facility and Service selected | Target date: YYYY-MM-DD | 1. Select date on Step 2<br>2. Inspect API call | `GET /api/v1/appointments/slots` called; slots grouped into Morning, Afternoon, Evening | As expected | **PASS** |
| **TC-APPT-UX-04** | FR-APPT-UX-004 | Double submission prevention | Step 3 active | Valid booking payload | 1. Click "Confirm Appointment" rapidly | Button immediately disables, displays "Confirming..." spinner, sends single API request | As expected | **PASS** |
| **TC-APPT-UX-05** | FR-APPT-UX-005 | Slot conflict recovery | Another user books slot concurrently | 10:00 AM slot | 1. API returns 409 Conflict<br>2. Observe error modal | Shows "This time slot is no longer available" and "Choose another time" CTA returning to Step 2 | As expected | **PASS** |
| **TC-APPT-UX-06** | FR-APPT-UX-006 | Zero form fatigue with auto-profile sync | Authenticated profile has Name & Phone | Profile data in context | 1. Review Step 3 details | Name, email, and phone pre-populated without manual re-entry | As expected | **PASS** |
| **TC-APPT-UX-07** | FR-APPT-UX-007 | Calendar .ics file export | Booking confirmed | Booking reference: `EZ-...` | 1. On success screen, click "Add to Calendar" | Browser downloads `.ics` file with appointment summary, date, time, and location | As expected | **PASS** |
| **TC-APPT-UX-08** | FR-APPT-UX-001 | Back navigation preserves selections | User on Step 3 | Service: Cardiology, Date: Tomorrow, Time: 02:00 PM | 1. Click "Back"<br>2. Check Step 2<br>3. Click "Back" to Step 1 | Previously chosen service, date, and time remain selected without data loss | As expected | **PASS** |
| **TC-APPT-UX-09** | FR-APPT-UX-001 | Contextual "Book Again" prefill | Past appointment in `/app/history` | Past appointment: Cardiology, Metro Hospital | 1. Click "Book Again" on past appointment | Wizard opens directly with facility and service preselected | As expected | **PASS** |
| **TC-APPT-UX-10** | FR-APPT-UX-001 | Existing appointment reschedule | Upcoming appointment in `/app/appointments` | Appointment ID | 1. Click "Reschedule"<br>2. Pick new slot<br>3. Confirm | `PATCH /appointments/:id/reschedule` called, updates list in real time | As expected | **PASS** |
| **TC-APPT-UX-11** | FR-APPT-UX-001 | Existing appointment cancellation | Upcoming appointment in `/app/appointments` | Appointment ID, Reason | 1. Click "Cancel"<br>2. Provide reason<br>3. Confirm | `PATCH /appointments/:id/cancel` called, status updates to cancelled and slot released | As expected | **PASS** |
| **TC-APPT-UX-12** | FR-APPT-UX-001 | Mobile viewport 390px responsive design | Mobile screen simulation (390px) | Full booking flow | 1. Complete booking on mobile viewport | No horizontal overflow; full-width buttons; expandable summary card | As expected | **PASS** |

---

## MODULE: STAFF QUEUE TV DISPLAY / WAITING AREA BOARD (MOD-QUEUE-TV)

| Test ID | Req ID | Test Scenario | Preconditions | Test Data / Payload | Execution Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-TV-01** | FR-TV-001 | Dedicated Staff TV Display Navigation | Staff or Admin user authenticated | Route: `/staff/queue-display` | 1. Log in as staff (`staff@demo.com`)<br>2. Check sidebar navigation | "TV Display" entry with Tv icon is present under Staff section | As expected | **PASS** |
| **TC-TV-02** | FR-TV-002 | Fullscreen Display Mode Toggle | TV Display page loaded | Fullscreen API supported | 1. Click "Enter Fullscreen"<br>2. Press "ESC" | Browser activates fullscreen, hides staff chrome; ESC key cleanly exits | As expected | **PASS** |
| **TC-TV-03** | FR-TV-003 | Strict Light-Theme High-Contrast Verification | Board rendered | CSS color inspection | 1. Inspect DOM background and typography | Background `#FFFFFF`, surfaces `#F8F9FA`, borders `#E5E7EB`, text `#111111`; zero dark mode | As expected | **PASS** |
| **TC-TV-04** | FR-TV-004 | Hero Ticket Scalability (1080p to 4K) | Active serving ticket: `A104` | Viewport sizes: 1080p, 1440p, 4K | 1. Resize browser viewport<br>2. Observe ticket font size | Ticket typography scales fluidly using `clamp(4.25rem, 11vw, 10.5rem)` | As expected | **PASS** |
| **TC-TV-05** | FR-TV-005 | Realtime Supabase Queue Synchronization | Staff desk advances ticket | Event: `UPDATE queue_tickets` | 1. Staff calls next ticket<br>2. Observe TV board | Board updates serving ticket & desk in real time without page reload | As expected | **PASS** |
| **TC-TV-06** | FR-TV-006 | Zero Customer PII Exposure Audit | Waiting tickets with customer records | Ticket records in DB | 1. Inspect TV Display HTML source & network | Zero customer names, emails, phones, or notes rendered; only ticket & counter numbers | As expected | **PASS** |
| **TC-TV-07** | FR-TV-007 | Web Audio API Clinic Chime & Highlight Pulse | Audio output enabled | C5 -> E5 dual-tone synthesis | 1. Click "Test Chime"<br>2. Trigger ticket call | Chime sounds without autoplay rejection; 400ms visual pulse highlights new ticket | As expected | **PASS** |
| **TC-TV-08** | FR-TV-008 | Realtime Disconnect & Reconnect Handling | WebSocket connection dropped | Offline network simulation | 1. Drop socket connection<br>2. Restore socket | Displays "Reconnecting..." badge; automatically restores "Live Sync" and resyncs queue | As expected | **PASS** |
| **TC-TV-09** | FR-TV-009 | Strict Read-Only UI Enforcement | Staff viewing TV Display | Display screen | 1. Inspect page controls | No "Call Next", "Serve", "Skip", or "Complete" mutating controls present | As expected | **PASS** |
| **TC-TV-10** | FR-TV-004 | Dynamic Multi-Counter Grid Adaptation | 3 active counters configured | Desk 1, Desk 2, Desk 3 | 1. Open display board | Renders dynamic cards for all 3 desks with current tickets and staff names | As expected | **PASS** |


