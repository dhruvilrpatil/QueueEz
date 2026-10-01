# EzQueue – Smart Appointment & Virtual Queue Management System

> **Semester V End-Semester Full-Stack Project**  
> Built with React 18, Vite, TypeScript, Express.js, Supabase PostgreSQL with Row-Level Security, and Cal.com Design System principles.

---

## 📌 Executive Summary & Problem Solved

EzQueue solves the friction and lost productivity caused by long physical queues and inefficient walk-in management at high-traffic facilities such as **clinics, banks, customer care centers, educational offices, and diagnostic labs**.

### Key Value Propositions
- **For Customers / Citizens:**
  - 🔍 **Discover Facilities:** Browse service locations, operating hours, active queues, and wait times.
  - 🎟️ **Instant Virtual Queueing:** Join queues remotely or on-site to receive a live digital ticket number.
  - ⏱️ **Real-Time Position Tracking:** Monitor your exact place in queue and estimated wait time live via WebSockets.
  - 📅 **Advance Appointment Booking:** Reserve time slots in advance with automated conflict prevention and buffer management.
  - 🔔 **Instant Status Alerts:** Real-time visual and audio cues when called to a specific service counter.

- **For Staff & Counter Operators:**
  - 🎯 **Dedicated Counter Dashboard:** Call next customer, start service, complete service, skip, mark no-show, or transfer.
  - 📊 **Live Operational Metrics:** View served count, average service time, waiting tickets, and counter occupancy in real time.
  - 🔄 **Multi-Counter Support:** Seamless ticket delegation and load balancing between staff counters.

- **For Facility & System Administrators:**
  - 📈 **Performance Analytics:** Historical throughput, service speed trends, and peak-hour heatmaps.
  - ⚙️ **Service & Counter Configuration:** Define slot capacities, average service durations, and operating schedules.
  - 🛡️ **Role-Based Access Control (RBAC):** Strict isolation between customers, staff, facility admins, and system administrators.

---

## 🛠️ Technology Stack & Architecture

```
                                  EzQueue Monorepo
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        ▼                                                                 ▼
apps/web (Frontend)                                             apps/api (Backend)
- Vite + React 18 + TypeScript                                   - Express.js + TypeScript
- TanStack React Query v5                                        - Zod Schema Validation
- React Router v6 (Protected Role Guards)                        - JWT & Supabase Auth Middleware
- Cal.com Design System (DESIGN.md specs)                        - Rate Limiting (express-rate-limit)
- Lucide React & TailwindCSS                                     - Helmet & CORS Security
- Supabase Realtime Client                                       - Compression & Morgan Logging
        │                                                                 │
        └────────────────────────────────┬────────────────────────────────┘
                                         ▼
                             Supabase PostgreSQL Database
                             - 10+ Relational Tables
                             - Row Level Security (RLS) Policies
                             - PostgreSQL Triggers & Stored Functions
                             - Realtime Postgres Changes Subscription
```

---

## 🎨 UI/UX Design System Compliance (`DESIGN.md`)

EzQueue strictly adheres to the design specification in `DESIGN.md`:
- **Typography:** Uses Cal Sans display hierarchy for titles paired with Inter for clean, readable interface typography and JetBrains Mono for ticket tokens and timestamps.
- **Palette:** Clean `#ffffff` canvas with high-contrast `#111111` primary interactive CTAs, `#374151` body text, `#6b7280` muted labels, and `#e5e7eb` hairline dividers.
- **Components:** Soft-rounded cards (12px radius), product UI fragments embedded directly into dashboard cards, distinct semantic status badges (`waiting`, `called`, `in_service`, `completed`, `cancelled`).
- **Footer:** Visual closing with high-contrast `#101010` dark footer.

---

## 🚀 Getting Started & Local Development

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Supabase Account / Local PostgreSQL**

### 2. Monorepo Installation
Clone the repository and install all dependencies across workspace packages:
```bash
# In project root: g:\QueueEz
npm install
```

### 3. Environment Variables

Create `.env` in `apps/api/`:
```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Supabase credentials
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

JWT_SECRET=your-secure-jwt-secret-key-at-least-32-chars
```

Create `.env` in `apps/web/`:
```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Database Schema Setup
Execute the complete schema and seed script located at:
`supabase/migrations/001_initial_schema.sql`
Run this inside your **Supabase Project SQL Editor**. It creates:
- Tables: `organizations`, `facilities`, `services`, `counters`, `queue_sessions`, `queue_tickets`, `appointments`, `profiles`, `staff_members`, `audit_logs`
- Triggers: Auto-update timestamps and automated queue session statistics
- Row-Level Security: Role-based policies ensuring data isolation
- Seed Data: Pre-populated facility ("Metro General Hospital"), services (General Consultation, Pharmacy, Lab Test), counters, and demo accounts.

### 5. Running the Application

You can run both apps concurrently or independently:

```bash
# Run both API and Web concurrently from root:
npm run dev

# Or run API server individually (Port 4000):
npm run dev:api

# Or run Web frontend individually (Port 5173):
npm run dev:web
```

---

## 🔑 Demo Accounts & Credentials

The system includes pre-seeded demo accounts for instant evaluation:

| Role | Email | Password | Allowed Access |
|---|---|---|---|
| **Customer** | `customer@demo.com` | `demo1234` | Facilities, Bookings, Active Ticket, Queue Tracker |
| **Staff Member** | `staff@demo.com` | `demo1234` | Counter Queue Dashboard (Call, Start, Skip, Complete) |
| **Facility Admin** | `admin@demo.com` | `demo1234` | Facility Analytics, Operational Overview, Management |

---

## 📡 API Reference Overview

Base URL: `http://localhost:4000/api/v1`

### 1. Authentication (`/auth`)
- `POST /auth/register` — Create new customer account
- `POST /auth/login` — Sign in and receive session tokens
- `GET /auth/me` — Retrieve current authenticated profile

### 2. Facilities & Services (`/facilities`)
- `GET /facilities` — List all active facilities with search & category filters
- `GET /facilities/:id` — Get facility details, services, and counters
- `POST /facilities` — Create facility (Admin only)
- `PATCH /facilities/:id` — Update facility details (Admin only)

### 3. Queue Management (`/queues`)
- `POST /queues/join` — Join virtual queue and obtain digital ticket
- `GET /queues/tickets/active` — Get customer's current active ticket
- `GET /queues/tickets/:ticketId` — Get ticket status & position
- `PATCH /queues/tickets/:ticketId/cancel` — Customer cancel ticket
- `GET /queues/:sessionId/tickets` — Staff view all session tickets
- `GET /queues/:sessionId/stats` — Staff view live session queue statistics
- `POST /queues/tickets/:ticketId/call` — Staff call ticket to counter
- `POST /queues/tickets/:ticketId/start` — Staff begin service
- `POST /queues/tickets/:ticketId/complete` — Staff mark service complete
- `POST /queues/tickets/:ticketId/skip` — Staff skip absent customer
- `POST /queues/tickets/:ticketId/no-show` — Staff mark ticket as no-show
- `POST /queues/tickets/:ticketId/transfer` — Staff transfer to another counter

### 4. Appointments (`/appointments`)
- `POST /appointments` — Book an appointment with automatic time validation
- `GET /appointments` — List customer or facility appointments
- `GET /appointments/:id` — View appointment details
- `PATCH /appointments/:id/cancel` — Cancel scheduled appointment
- `PATCH /appointments/:id/reschedule` — Reschedule to a new slot

---

## 🔒 Security & Data Protection

- **Password Hashing:** Supabase Auth with bcrypt-hashed credentials.
- **Row-Level Security (RLS):** Policies enforced at database level — customers can only read and modify their own tickets and appointments.
- **Sanitized Inputs:** All incoming request payloads validated against strict Zod schemas with formatted error responses.
- **HTTP Security Headers:** Protected with Helmet CSP, HSTS, and frameguard protections.
- **API Rate Limiting:** Enforces maximum request limits per window to prevent brute force or denial-of-service attempts.
