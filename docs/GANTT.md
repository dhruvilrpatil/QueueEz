# PROJECT SCHEDULE (GANTT SPECIFICATION)
## EZQUEUE 16-WEEK IMPLEMENTATION TIMELINE WITH MESSAGING

**Standard:** ISO/IEC/IEEE 16326 Systems and software engineering — Life cycle processes — Project management  

---

### 1. Work Breakdown Structure (WBS) with Messaging Integration

```mermaid
gantt
    title EzQueue 16-Week Implementation Schedule (With Messaging Integration)
    dateFormat  YYYY-MM-DD
    axisFormat  W%W

    section Sprint 1-4: Foundation & Core
    Requirements & Architecture      :done,    des1, 2026-06-01, 2026-06-15
    Supabase DB Schema & Auth        :done,    des2, 2026-06-15, 2026-06-29
    Facility & Service Management    :done,    des3, 2026-06-29, 2026-07-13

    section Sprint 5-8: Appointments & Queues
    Appointment Scheduling Engine    :done,    app1, 2026-07-13, 2026-07-27
    Virtual Queue Session & Calling  :done,    que1, 2026-07-27, 2026-08-10
    Twilio SMS & Notification Router :done,    not1, 2026-08-10, 2026-08-17

    section Sprint 9-12: Messaging Module (MOD-MSG)
    MSG-01: Requirements & CR-MSG-001:done,    msg1, 2026-08-17, 2026-08-20
    MSG-02: SRS, DFD & UML Update    :done,    msg2, 2026-08-20, 2026-08-24
    MSG-03: Messaging Database Schema:done,    msg3, 2026-08-24, 2026-08-27
    MSG-04: Express API & Policies   :active,  msg4, 2026-08-27, 2026-09-03
    MSG-05: Customer Queries UI      :active,  msg5, 2026-09-03, 2026-09-10
    MSG-06: Staff Chat Workspace     :active,  msg6, 2026-09-07, 2026-09-15
    MSG-07: Realtime & Unread Sync   :         msg7, 2026-09-15, 2026-09-20

    section Sprint 13-16: Verification & Deployment
    MSG-08: Integration & System QA  :         tst1, 2026-09-20, 2026-09-28
    MSG-09: SQA Audit & RTM Review   :         tst2, 2026-09-28, 2026-10-05
    MSG-10: Staging & Vercel Deploy  :         dep1, 2026-10-05, 2026-10-12
    MSG-11: Production Verification  :         dep2, 2026-10-12, 2026-10-19
```

---

### 2. Task Allocation & Resource Distribution

| Task ID | Task Description | Estimated Days | Assigned Role | Dependencies |
| :--- | :--- | :---: | :--- | :--- |
| **MSG-01** | Change Request & Requirements Analysis | 3 | Systems Analyst | - |
| **MSG-02** | SRS, DFD, UML & State Machine Specifications | 4 | System Architect | MSG-01 |
| **MSG-03** | PostgreSQL Migration & RLS Security Policies | 3 | Database Engineer | MSG-02 |
| **MSG-04** | Express Backend API Module & Controller/Service | 6 | Backend Engineer | MSG-03 |
| **MSG-05** | Customer "Help & Queries" UI & Modal | 5 | Frontend Engineer | MSG-04 |
| **MSG-06** | Staff Dedicated Dual-Pane Chat Workspace | 6 | Senior Frontend | MSG-04 |
| **MSG-07** | Supabase Realtime Channels & Unread Counters | 4 | Fullstack Engineer | MSG-05, MSG-06 |
| **MSG-08** | Unit, Integration & Regression Testing (25+ TCs) | 5 | SQA Engineer | MSG-07 |
| **MSG-09** | SQA Quality Gates & RTM Traceability Audit | 4 | QA Lead / Architect | MSG-08 |
| **MSG-10** | Staging Migration & Vercel Frontend Deployment | 4 | DevOps Engineer | MSG-09 |
| **MSG-11** | Production Acceptance & Verification Run | 3 | Project Manager | MSG-10 |
