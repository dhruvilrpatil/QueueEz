# DECISION TABLE SPECIFICATION
## AUTOMATED QUERY ROUTING & DISPATCH LOGIC (MOD-MSG)

**Document Reference:** DT-MSG-001  
**Project:** EzQueue Smart Queue Management  

---

### 1. Conditions

| Condition ID | Description | Values |
| :--- | :--- | :--- |
| **C1** | Is the query associated with a confirmed upcoming appointment? | Yes (Y) / No (N) |
| **C2** | Is the query associated with an active waiting queue ticket? | Yes (Y) / No (N) |
| **C3** | Does the target facility have an available online support staff? | Yes (Y) / No (N) |
| **C4** | Is the inquiry categorized under urgent / critical priority? | Yes (Y) / No (N) |
| **C5** | Has the patient been previously served by an active counter operator? | Yes (Y) / No (N) |

---

### 2. Actions

| Action ID | Action Description |
| :--- | :--- |
| **A1** | Auto-link appointment details (`appointment_id`, scheduled time, doctor, service) |
| **A2** | Auto-link live queue ticket details (`queue_ticket_id`, token, wait estimate) |
| **A3** | Assign query directly to the previously handling counter operator |
| **A4** | Assign query to primary facility general triage queue |
| **A5** | Set initial conversation priority to `URGENT` / `HIGH` |
| **A6** | Set initial conversation priority to `NORMAL` |
| **A7** | Dispatch push/SMS notification to assigned operator |
| **A8** | Escalate query to Facility Administrator dashboard |

---

### 3. Decision Matrix (16 Evaluated Rules)

| Rule # | C1 (Appt?) | C2 (Queue?) | C3 (Staff Avail?) | C4 (Urgent?) | C5 (Prev Staff?) | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **R01** | Y | N | Y | N | Y | X | - | X | - | - | X | X | - |
| **R02** | Y | N | Y | Y | Y | X | - | X | - | X | - | X | X |
| **R03** | Y | N | Y | N | N | X | - | - | X | - | X | X | - |
| **R04** | Y | N | N | N | - | X | - | - | X | - | X | - | X |
| **R05** | N | Y | Y | N | Y | - | X | X | - | - | X | X | - |
| **R06** | N | Y | Y | Y | Y | - | X | X | - | X | - | X | X |
| **R07** | N | Y | Y | N | N | - | X | - | X | - | X | X | - |
| **R08** | N | Y | N | Y | - | - | X | - | X | X | - | - | X |
| **R09** | Y | Y | Y | Y | - | X | X | - | X | X | - | X | X |
| **R10** | Y | Y | Y | N | - | X | X | - | X | - | X | X | - |
| **R11** | N | N | Y | Y | - | - | - | - | X | X | - | X | X |
| **R12** | N | N | Y | N | - | - | - | - | X | - | X | X | - |
| **R13** | N | N | N | Y | - | - | - | - | X | X | - | - | X |
| **R14** | N | N | N | N | - | - | - | - | X | - | X | - | - |

---

### 4. Implementation Rules
1. **Rule Consolidation**: If both appointment and queue ticket are present (e.g. checked-in appointment patient waiting for consultation), both contexts are linked simultaneously (`A1` and `A2`).
2. **Escalation Trigger (`A8`)**: An escalation to the Facility Admin is automatically executed whenever an urgent query (`C4 = Y`) arrives and no dedicated operator is assigned within 10 minutes.
3. **Audit Trail**: Every routing rule executed is logged in `conversation_events` with rule ID, actor timestamp, and assigned target.
