# MASTER TEST PLAN (IEEE 829 STANDARD)
## MODULE: CUSTOMER QUERY & STAFF MESSAGING (MOD-MSG)

**Document Reference:** MTP-MSG-001  
**Project:** EzQueue Smart Queue Management  
**Standard:** IEEE Std 829-2008 Standard for Software and System Test Documentation  

---

### 1. Test Strategy & Objectives
The primary goal of the testing program for `MOD-MSG` is to verify that patient queries and staff replies are processed with high fidelity, zero data loss, strict multi-tenant authorization, and low-latency real-time synchronization.

---

### 2. Testing Levels

```
               ┌──────────────────────┐
               │  Acceptance Testing  │  (End-to-End User Verification)
            ┌──┴──────────────────────┴──┐
            │       System Testing       │  (Full Workflow: Query -> Staff -> Reply)
         ┌──┴────────────────────────────┴──┐
         │       Integration Testing        │  (API + Database + Realtime + Auth)
      ┌──┴──────────────────────────────────┴──┐
      │             Unit Testing               │  (Zod Schemas, FSM Transitions, Policies)
      └────────────────────────────────────────┘
```

#### 2.1 Unit Testing
* Schema boundary validation (message length, empty whitespace, invalid categories).
* FSM state transition guards (reject illegal transitions like `CLOSED -> OPEN`).
* Permission policies (verify customer cannot send `INTERNAL_NOTE`).
* Mathematical unread calculation formulas.

#### 2.2 Integration Testing
* REST API endpoints with simulated JWT credentials.
* Supabase PostgreSQL triggers (`last_message_at`, `updated_at`).
* Multi-tenant RLS queries ensuring zero cross-facility data leakage.
* Linked foreign key validation (`appointments`, `queue_tickets`).

#### 2.3 System Testing
* End-to-end patient workflow:
  $$\text{Ask Question} \longrightarrow \text{Staff Inbox Alert} \longrightarrow \text{Staff Reply} \longrightarrow \text{Patient Realtime Receipt} \longrightarrow \text{Resolution}$$

#### 2.4 Regression Testing
* Ensure messaging additions do not disrupt:
  1. Appointment slot reservations,
  2. Live queue token generation,
  3. Staff counter calling chime alerts,
  4. User authentication and token refreshes.

---

### 3. Test Deliverables
1. Master Test Plan (`docs/TEST-PLAN.md`)
2. Comprehensive Test Cases Suite with 25+ detailed cases (`docs/TEST-CASES.md`)
3. Defect & Bug Reporting Register (`docs/BUG-REPORT.md`)
4. Requirement Traceability Matrix (`docs/REQUIREMENT-TRACEABILITY-MATRIX.md`)
5. SQA Quality Audit Report (`docs/SQA-PLAN.md`)
