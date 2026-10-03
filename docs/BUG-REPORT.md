# DEFECT TRACKING & BUG REPORTING
## MODULE: CUSTOMER QUERY & STAFF MESSAGING (MOD-MSG)

**Standard:** IEEE 1044-2009 Standard Classification for Software Anomalies  

---

### 1. Defect Lifecycle State Flow

```
[ New / Reported ] ──▶ [ Triaged & Confirmed ] ──▶ [ In Progress ]
                                                           │
[ Closed / Verified ] ◀── [ Resolved & Fixed ] ◀───────────┘
```

---

### 2. Defect Report Template

* **Bug ID:** `BUG-MSG-XXX`
* **Title:** Brief descriptive title
* **Severity:** Critical / High / Medium / Low
* **Priority:** P1 (Blocker) / P2 (High) / P3 (Medium) / P4 (Low)
* **Module:** Messaging (`MOD-MSG`)
* **Environment:** Staging / Production / Local (Node.js 20+, React 18, Supabase PostgreSQL)
* **Preconditions:** Auth state and preconditions required
* **Steps to Reproduce:** Numbered deterministic steps
* **Expected Result:** What the system should do per SRS
* **Actual Result:** Observed anomalous behavior
* **Root Cause Analysis (RCA):** Technical explanation of the failure
* **Resolution / Patch:** Git commit reference and code fix
* **Status:** New / Triaged / In Progress / Fixed / Closed

---

### 3. Concrete Defect Report: BUG-MSG-001

* **Bug ID:** `BUG-MSG-001`
* **Title:** Unread badge counter in Staff Sidebar fails to decrement after opening active conversation
* **Severity:** Medium
* **Priority:** P2 (High)
* **Module:** `MOD-MSG` (Staff Chat Navigation & Read State)
* **Reported Date:** 2026-08-28
* **Reporter:** SQA Automation Suite
* **Environment:** Chrome 128 / macOS & Windows 11 / Vite 5.4.21 / Node.js 20
* **Preconditions:** Staff logged in at `/staff/chat`. A customer sends 2 new inquiries resulting in unread badge showing `Chat 2`.
* **Steps to Reproduce:**
  1. Navigate to `/staff/chat`.
  2. Click on the first unread conversation in the inbox list.
  3. The conversation timeline loads with customer messages.
  4. Observe the sidebar navigation badge for "Chat".
* **Expected Result:**
  Upon loading the conversation, the client should trigger `PATCH /api/v1/conversations/:id/read`, advancing `conversation_participants.last_read_at` to the current timestamp. The unread count should decrement from 2 to 1 in real time.
* **Actual Result:**
  The unread badge remained at `Chat 2` until the entire web page was manually refreshed.
* **Root Cause Analysis (RCA):**
  The React Query cache key for unread message counts (`['unread-messages-count']`) was not explicitly invalidated inside the `onSuccess` callback of `useMarkConversationRead`. Additionally, the Supabase Realtime channel listener for `conversation_participants` was only subscribed to `INSERT` events, ignoring `UPDATE` on `last_read_at`.
* **Resolution / Fix:**
  1. Updated `apps/web/src/features/messaging/hooks/useMessaging.ts` to invalidate `['unread-messages-count']` immediately on mutation success.
  2. Updated the Realtime channel subscription to listen for `postgres_changes` with `event: '*'` on table `conversation_participants`.
* **Status:** **Closed / Verified (Pass in Regression)**
