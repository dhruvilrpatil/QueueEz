# USE CASE SPECIFICATION
## MODULE: CUSTOMER QUERY & STAFF MESSAGING (MOD-MSG)

**Document Reference:** UC-MSG-V1  
**Project:** EzQueue Smart Queue Management  

---

### Use Case Summary Matrix

| Use Case ID | Name | Primary Actor | Secondary Actor | Precondition |
| :--- | :--- | :--- | :--- | :--- |
| **UC-MSG-01** | Create Customer Query | Customer | System | Logged in as Customer |
| **UC-MSG-02** | Send Message | Customer / Staff | Realtime Engine | Conversation exists & is active |
| **UC-MSG-03** | Receive Staff Reply | Customer | Staff, Realtime | Open or in-progress query |
| **UC-MSG-04** | View Conversation | Customer / Staff | System | Authorized participant/staff |
| **UC-MSG-05** | Mark Conversation Read | Customer / Staff | Database | Unread messages exist |
| **UC-MSG-06** | Assign Conversation | Staff / Admin | Assigned Staff | Staff is authorized at facility |
| **UC-MSG-07** | Change Conversation Status | Staff / Admin | Customer | Conversation exists |
| **UC-MSG-08** | Resolve Conversation | Staff / Admin | Customer | Inquiry satisfactorily addressed |
| **UC-MSG-09** | Reopen Conversation | Customer / Staff | Staff | Conversation was resolved |
| **UC-MSG-10** | View Appointment/Queue Context | Staff / Admin | Appt/Queue Subsystem | Query linked to Appt/Ticket |
| **UC-MSG-11** | Add Internal Staff Note | Staff / Admin | Staff Peers | User has staff or admin role |
| **UC-MSG-12** | Receive Realtime Message Update | Customer / Staff | Realtime Service | WebSocket channel connected |

---

### Detailed Use Cases

#### UC-MSG-01: Create Customer Query
* **Actor:** Customer
* **Trigger:** Customer clicks "Ask a Question" on Dashboard, Appointments, or Live Queue screen.
* **Precondition:** Customer is authenticated with role `customer`.
* **Main Success Scenario:**
  1. System displays query modal with Subject, Category dropdown, Message content textarea, and target facility.
  2. If opened from an appointment or queue ticket, system auto-populates the context reference (`appointment_id` or `queue_ticket_id`).
  3. Customer enters subject, selects category, inputs message text, and clicks "Submit Query".
  4. System validates inputs against schema constraints.
  5. System creates record in `conversations` table with status `OPEN` and priority `NORMAL`.
  6. System creates initial record in `messages` table with `message_type: 'CUSTOMER_MESSAGE'`.
  7. System adds customer to `conversation_participants`.
  8. System dispatches real-time broadcast and notification to facility staff.
  9. Customer is redirected to the conversation timeline.
* **Alternative Flows:**
  * *4a. Validation Failure:* Message is empty or subject < 3 characters. System shows field error and prevents submission.
  * *5a. Database Failure:* System displays retry error toast and preserves draft message in local storage.

#### UC-MSG-02: Send Message
* **Actor:** Customer or Staff Operator
* **Trigger:** User enters message in composer and presses Enter or clicks Send.
* **Main Success Scenario:**
  1. System checks authorization and validates content length (1 - 10,000 characters).
  2. System commits message with sender role and timestamp.
  3. System updates `last_message_at` on conversation.
  4. Realtime engine broadcasts new message to recipient.
  5. Recipient's UI appends message without page reload.

#### UC-MSG-06: Assign Conversation
* **Actor:** Staff Member or Facility Administrator
* **Trigger:** Staff clicks "Assign to Me" or selects colleague from dropdown.
* **Main Success Scenario:**
  1. System verifies staff belongs to the conversation's `facility_id`.
  2. System updates `assigned_staff_id` on the conversation.
  3. System appends a `SYSTEM_EVENT` message indicating assignment.
  4. System updates staff inbox view reactively.

#### UC-MSG-10: View Appointment / Queue Context
* **Actor:** Staff Member
* **Trigger:** Staff selects a customer conversation from the inbox.
* **Main Success Scenario:**
  1. System retrieves conversation metadata along with joined `appointment` and `queue_ticket` records.
  2. System renders the Customer Context Sidebar displaying:
     * Patient Full Name & Contact
     * Linked Appointment Time, Code (`EZQ-1042`), and Service Name
     * Linked Queue Token Number (`A-104`), Waiting Position, and Wait Estimate
  3. Staff clicks "View Appointment" or "View Queue" to navigate to details if necessary.

#### UC-MSG-11: Add Internal Staff Note
* **Actor:** Healthcare Staff Operator or Administrator
* **Trigger:** Staff activates "Internal Note" toggle in message composer.
* **Main Success Scenario:**
  1. Staff enters clinical or operational notes (e.g. *"Checked with Dr. Smith; patient fasting test delayed by 15 mins"*).
  2. System stores message with `message_type: 'INTERNAL_NOTE'`.
  3. System renders note with a distinct yellow/amber internal badge visible only to staff.
  4. Note is filtered out from customer's view and Realtime channel.
