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

---

### 4. Staff Queue TV Display Subsystem (MOD-QUEUE-TV)

#### 4.1 System Topology & Reactive Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Existing Staff Operations                   │
│   (Desk Call Next, Serve, Complete, Skip via Dashboard)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
               Existing Queue Express APIs / SQL
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Supabase PostgreSQL Database                │
│             [ queue_tickets | counters | sessions ]         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                     PostgreSQL CDC Events
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Realtime Channel                 │
│      postgres_changes (event: '*', table: 'queue_tickets')  │
│      postgres_changes (event: '*', table: 'counters')       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                     WSS WebSocket Streaming
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             TV Display Feature Subscription Hook            │
│                 (useQueueDisplayRealtime)                   │
│  - Receives change payloads scoped by facility / session    │
│  - Triggers debounced local state refresh without full load │
│  - Tracks connection status (SUBSCRIBED, CHANNEL_ERROR)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                useQueueDisplay Presentation Hook            │
│  - Detects newly called ticket -> triggers announcement     │
│  - Invokes Web Audio API clinic chime (C5 -> E5 dual harmonic)
│  - Strips all customer PII (only renders ticket & desk ID)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           Public Light-Theme Display Board Component         │
│                 (QueueDisplayBoard.tsx)                     │
│  - Hero NOW SERVING card with responsive clamp() typography │
│  - Dynamic active desk counters grid                        │
│  - Next-in-line ticket numbers strip                        │
│  - Local independent 1-second live clock (no API polling)   │
│  - Fullscreen API toggling with auto-hiding floating chrome │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2 Security, Privacy & Reliability Guarantees

* **Zero Queue Mutation Attack Surface**: The TV Display is strictly read-only (`GET` query and Realtime listening). It exposes no mutating endpoints or user action handlers capable of advancing, serving, or canceling queue tickets.
* **PII Redaction at the Boundary**: The display model (`DisplayTicket`) maps only `ticket_number`, `service_name`, and `counter_name`. All customer names, email addresses, medical notes, and contact numbers are discarded before reaching the rendering layer.
* **Resilient Connection Lifecycle**: Supabase Realtime channel detachment is guaranteed on component unmount via `supabase.removeChannel(channel)`. Network interruptions trigger the `Reconnecting...` badge and automatically resynchronize the board upon socket re-establishment.
* **Audio Autoplay Compliance**: The Web Audio API context is created and resumed strictly upon explicit user interaction (e.g. clicking "Enter Fullscreen", "Test Chime", or toggling "Sound ON"), guaranteeing that no unhandled audio promise rejection occurs.

