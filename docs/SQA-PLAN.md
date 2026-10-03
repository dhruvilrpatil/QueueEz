# SOFTWARE QUALITY ASSURANCE (SQA) PLAN & REPORT
## MODULE: CUSTOMER QUERY & STAFF MESSAGING (MOD-MSG)

**Document Reference:** SQA-MSG-001  
**Project:** EzQueue Smart Queue Management  
**Standard:** ISO/IEC 25010 System and Software Quality Models  

---

### 1. Software Quality Attributes Matrix

| Quality Characteristic | Sub-characteristic | Target Metric / Benchmark | Verification Technique | SQA Evaluation |
| :--- | :--- | :--- | :--- | :---: |
| **Reliability** | Fault Tolerance & Data Loss | Zero message loss upon client disconnection; retry queue | Automated fault injection & disconnect test | **Compliant** |
| **Security** | Confidentiality & RLS | Strict tenant & user isolation; internal note redaction | Static analysis + Pen-test authorization suites | **Compliant** |
| **Maintainability** | Modularity & Clean Architecture | High cohesion, loose coupling; layered controller/service/repo | SonarQube & ESLint strict ruleset | **Compliant** |
| **Usability** | User Operability & Ergonomics | Query creation in $\le 3$ clicks; clear status pills | Nielsen Norman 10 Heuristics Review | **Compliant** |
| **Performance** | Response Time & Throughput | Message delivery $\le 500\text{ ms}$; paginated history (25/page) | Load test at 250 concurrent WebSockets | **Compliant** |
| **Compatibility** | Cross-Browser Responsiveness | Chrome 100+, Edge, Safari 15+, Firefox; mobile & desktop | Multi-device headless automated viewport tests | **Compliant** |
| **Data Integrity** | ACID Consistency & Referential Integrity | Cascade deletion on profile; Foreign key links on Appt/Queue | Relational constraint enforcement in PostgreSQL | **Compliant** |

---

### 2. Software Quality Checklist (Pre-Release Gates)

- [x] **Requirements Complete:** All 14 functional requirements (`FR-MSG-001` - `014`) implemented.
- [x] **Non-Functional Met:** All 8 non-functional requirements (`NFR-MSG-001` - `008`) verified.
- [x] **API Validated:** Express API handles all endpoints with Zod schema sanitization.
- [x] **Database Constraints Active:** Foreign keys, UUID defaults, string length limits, and enum checks active.
- [x] **Row Level Security (RLS) Active:** Customer, staff, and admin security policies verified.
- [x] **RBAC Enforced:** Route and controller guards derive identity solely from authenticated JWTs.
- [x] **Realtime WebSocket Operational:** Supabase Realtime synchronization active with automatic channel cleanup.
- [x] **Error States Handled:** Network dropouts render retry buttons; draft text preserved in composer.
- [x] **Mobile Responsive:** Fluid layout on mobile (stacked cards) and desktop (dual-pane workspace).
- [x] **Accessibility (a11y):** ARIA labels on composer, buttons, and conversation items; keyboard operable.
- [x] **Regression Clean:** No disruptions to core queue sessions, appointment roster, or authentication.
- [x] **Design Compliance:** 100% adherence to `DESIGN.md` (near-black `#111111`, Inter font, 8px/12px/16px radii).
- [x] **Zero Exposed Secrets:** All credentials stored in environment variables; no leaked API keys.
- [x] **No Static Mock Badges:** Unread counts computed dynamically from real database records.

---

### 3. SQA Sign-Off
* **SQA Lead:** Approved (Status: Green for Deployment)
* **Lead Architect:** Approved
* **Release Manager:** Scheduled for v1.3.0 Release
