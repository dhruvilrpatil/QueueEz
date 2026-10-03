# SYSTEM ARCHITECTURE & DESIGN SPECIFICATION
## EZQUEUE MESSAGING & QUERY SUBSYSTEM

---

### 1. Multi-Tier Architecture

```
[ Customer / Staff React 18 + Vite Web Application ]
                       │
             HTTP / REST (JSON) + WSS (Realtime)
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express.js TypeScript API                 │
│                                                             │
│  [ Helmet + CORS + RateLimit + Compression Middleware ]     │
│                              │                              │
│  [ Supabase JWT Auth Middleware (Derives Authenticated User) ]
│                              │                              │
│  [ RBAC & Facility Authorization Policies ]                 │
│                              │                              │
│  [ Messaging Controller (HTTP Parse, DTO, Response Code) ]  │
│                              │                              │
│  [ Messaging Service (Business Rules, State Transitions) ]  │
│                              │                              │
│  [ Messaging Repository (PostgreSQL Query Construction) ]   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                PostgreSQL Client (Supabase Pool)
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Supabase PostgreSQL 15 Database             │
│                                                             │
│  [ conversations | messages | participants | reactions ]    │
│  [ Row Level Security (RLS) Policies ]                      │
│  [ Triggers: last_message_at, updated_at ]                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                   WAL / Postgres CDC Engine
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Realtime Cluster                 │
│                                                             │
│  Channels: realtime:facility-{id} | realtime:conv-{id}      │
│  Broadcast: NEW_MESSAGE, READ_RECEIPT, STATUS_CHANGED       │
└──────────────────────────────┬──────────────────────────────┘
                               │
             WebSocket (Real-Time Reactive Streaming)
                               │
                               ▼
[ React Query Hooks: useConversations, useMessages, useRealtime ]
```

---

### 2. Separation of Concerns & Architectural Contract

* **UI Components Layer (`apps/web/src/components/messaging/`)**: Pure presentation. Renders avatars, timelines, badges, and composer input states strictly governed by `DESIGN.md`. Has no knowledge of raw SQL or database connection details.
* **React Feature Hooks (`apps/web/src/features/messaging/hooks/`)**: Orchestrates optimistic mutation, cache invalidation, and WebSocket lifecycle binding.
* **API Controller (`apps/api/src/modules/messaging/controller.ts`)**: Handles HTTP parameter parsing, validation via Zod schemas, status code mapping, and response serialization.
* **Business Service (`apps/api/src/modules/messaging/service.ts`)**: Governs state machine transitions (`OPEN` -> `IN_PROGRESS` -> `RESOLVED`), query routing rules, SLA assignment logic, and triggers downstream patient/staff notifications.
* **Repository (`apps/api/src/modules/messaging/repository.ts`)**: Manages database queries, foreign key joins (`appointments`, `queue_tickets`, `profiles`), unread computation, and transaction consistency.

---

### 3. Security Architecture & Threat Mitigation

| Security Risk | Mitigation Strategy | Architectural Layer |
| :--- | :--- | :--- |
| **Spoofed User Identity** | Sender ID and Customer ID are strictly derived from verified Supabase JWT claims (`req.user.id`). Client payload cannot override author identity. | API Auth Middleware |
| **Cross-Tenant Infiltration** | Staff queries verify `profile.facility_id == conversation.facility_id`. Staff from Hospital X cannot read inquiries for Hospital Y. | API Policies + PostgreSQL RLS |
| **Internal Notes Leakage** | `message_type = 'INTERNAL_NOTE'` is filtered at database query time when `req.user.role == 'customer'`. Customer RLS policy contains `WHERE message_type != 'INTERNAL_NOTE'`. | DB RLS + Service Layer |
| **XSS & HTML Injection** | Text input is strictly validated as plain string and rendered in React without using `dangerouslySetInnerHTML`. | Frontend & Schema Validation |
| **Spam & Flooding** | General API rate limiting (100 req/min) plus composer debounce and message length caps (10,000 characters max). | Rate Limit Middleware |
