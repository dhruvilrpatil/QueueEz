# DATA FLOW DIAGRAMS (DFD)
## MODULE: CUSTOMER QUERY & STAFF MESSAGING (MOD-MSG)

---

### 1. Context Analysis: Level 0 (Context Diagram)

```mermaid
flowchart TD
    Customer([Customer / Patient])
    Staff([Healthcare Staff Operator])
    Admin([Facility Administrator])

    System[[EzQueue System - MOD-MSG]]

    Customer -->|1. Submit Query / Message| System
    Customer -->|2. Mark Read / Reopen| System
    System -->|3. Deliver Staff Reply & Status| Customer

    Staff -->|4. Staff Reply / Internal Note| System
    Staff -->|5. Status / Priority / Assignment| System
    System -->|6. Deliver Patient Inquiries & Context| Staff

    Admin -->|7. Reassign / Escalate / Audit| System
    System -->|8. Query Metrics & Audit Log| Admin
```

---

### 2. Level 1 DFD: Subsystem Process Decomposition

```mermaid
flowchart TD
    Customer([Customer])
    Staff([Staff Operator])

    P1[1.0 Process Query Creation]
    P2[2.0 Dispatch & Store Messages]
    P3[3.0 Manage Read State & Badges]
    P4[4.0 Query Routing & Assignment]
    P5[5.0 Lifecycle State Transition]
    P6[6.0 Retrieve Contextual Records]

    D1[(D1: Conversations Store)]
    D2[(D2: Messages Store)]
    D3[(D3: Participants Store)]
    D4[(D4: Profiles Store)]
    D5[(D5: Appointments Store)]
    D6[(D6: Queue Tickets Store)]
    D7[(D7: Notifications Store)]

    Customer -->|Subject, Category, Message| P1
    P1 -->|Create Conversation| D1
    P1 -->|Create Initial Message| D2
    P1 -->|Add Participant| D3
    P1 -->|Fetch Context| P6
    P6 -.->|Read Appt| D5
    P6 -.->|Read Ticket| D6
    P1 -->|Trigger Alert| D7

    Customer -->|Follow-up Message| P2
    Staff -->|Staff Reply / Internal Note| P2
    P2 -->|Save Message| D2
    P2 -->|Update last_message_at| D1

    Staff -->|Open Conversation| P3
    Customer -->|Open Conversation| P3
    P3 -->|Update last_read_at| D3
    P3 -->|Calculate Unread Count| Staff
    P3 -->|Calculate Unread Count| Customer

    Staff -->|Assign to Me / Staff ID| P4
    P4 -->|Update assigned_staff_id| D1
    P4 -->|Verify Role & Facility| D4

    Staff -->|Resolve / Close / Reopen| P5
    P5 -->|Update status| D1
    P5 -->|Record System Event| D2
```

---

### 3. Detailed Data Dictionary Entries

1. **`Customer_Query_Submission`**:
   `{ customer_id + facility_id + subject + category + initial_content + [appointment_id] + [queue_ticket_id] }`
2. **`Staff_Reply_Submission`**:
   `{ conversation_id + sender_id + staff_role + content + message_type + [reply_to_id] }`
3. **`Internal_Note_Submission`**:
   `{ conversation_id + staff_id + note_content + (message_type = 'INTERNAL_NOTE') }`
4. **`Conversation_State_Update`**:
   `{ conversation_id + actor_id + new_status + timestamp }`
5. **`Read_Receipt_Update`**:
   `{ conversation_id + user_id + read_timestamp }`
