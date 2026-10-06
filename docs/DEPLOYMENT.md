# EzQueue Production Deployment & Operations Guide

This document defines the deployment architecture, step-by-step setup procedure, environment configuration, database migration sequence, and smoke testing verification for the EzQueue Smart Appointment & Virtual Queue Management System.

---

## 1. System Architecture & Topology

EzQueue follows a modern decoupled 3-tier architecture:

```
┌─────────────────────────────────────────┐
│        Client Presentation Layer        │
│       Vercel / Cloudflare Pages         │
│   (Vite + React 18 SPA + Tailwind CSS)  │
└────────────┬────────────────────────────┘
             │                     ▲
   REST APIs │          WebSockets │ (Supabase Realtime)
             ▼                     │
┌────────────────────────────┐     │
│   Application Tier (API)   │     │
│  Render / Railway / Docker │     │
│ (Node.js + Express + Zod)  │     │
└────────────┬───────────────┘     │
             │                     │
             ▼                     │
┌──────────────────────────────────┴──────┐
│          Data & Auth Platform           │
│           Supabase PostgreSQL           │
│  - Auth (OAuth / JWT Tokens)            │
│  - Database (PostgreSQL 15 + RLS)       │
│  - Realtime (Broadcast, Presence & WAL) │
│  - Storage (User Profile Avatars)       │
└─────────────────────────────────────────┘
```

---

## 2. Supabase Infrastructure Setup (Step-by-Step)

### Step 2.1: Project Creation
1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project (e.g. `ezqueue-prod`).
2. Select your geographic region closest to target users (e.g., `ap-south-1` Mumbai / Singapore).
3. Note your project credentials under **Settings > API**:
   - `Project URL` (`https://<project-ref>.supabase.co`)
   - `anon` / `public` API Key
   - `service_role` / `secret` API Key

### Step 2.2: Database Migration Execution
Execute the SQL migrations in order via the Supabase SQL Editor or Supabase CLI (`npx supabase db push`):

1. **`supabase/migrations/001_initial_schema.sql`**
   - Enables `uuid-ossp` and `pg_trgm` extensions.
   - Creates enumerations: `user_role`, `ticket_status`, `appointment_status`, `counter_status`, `priority_level`, etc.
   - Creates core tables: `profiles`, `facilities`, `services`, `counters`, `queue_sessions`, `queue_tickets`, `appointments`, `notifications`, `audit_logs`.
   - Configures PostgreSQL trigger `handle_new_user()` to automatically create profile records upon auth signups.
   - Establishes Row-Level Security (RLS) policies enforcing multi-tenant facility isolation.
   - Seeds baseline demo facilities and services.
   - Enrolls `queue_tickets` and `counters` into publication `supabase_realtime`.

2. **`supabase/migrations/002_messaging_schema.sql`**
   - Creates messaging tables: `conversations`, `messages`, `conversation_participants`.
   - Adds triggers for auto-updating timestamps and conversation previews.
   - Configures RLS policies granting customer-ticket ownership and staff facility visibility.
   - Enrolls `conversations`, `messages`, and `conversation_participants` into publication `supabase_realtime`.

### Step 2.3: CRITICAL Supabase Realtime Configuration
> [!IMPORTANT]
> **Realtime Broadcast Channels Must Be Enabled**
> 
> Under **Supabase Dashboard > Project Settings > Realtime**:
> 1. Ensure **Realtime** is toggled **ON**.
> 2. Verify **Broadcast** and **Presence** are enabled.
> 
> **Why this is required:**
> - EzQueue uses ephemeral Supabase broadcast channels (e.g. `supabase.channel('typing:conv_id')`) to relay live typing indicators between customers and support staff without database writes or polling overhead.
> - The Staff TV Queue Display uses Supabase Realtime channels to receive instant announcements when tickets are called, in-service, or completed.

### Step 2.4: Storage Bucket Setup
1. In Supabase Dashboard, navigate to **Storage > New Bucket**.
2. Create bucket named `avatars`.
3. Set bucket to **Public** (or configure signed URL generation).
4. Add the following Storage Policy:
   - Allow public `SELECT` to everyone.
   - Allow `INSERT`, `UPDATE` to authenticated users (`auth.uid() = (storage.foldername(name))[1]`).

### Step 2.5: Authentication Configuration
1. Under **Authentication > URL Configuration**:
   - Set **Site URL** to your frontend production domain (e.g., `https://ezqueue.vercel.app`).
   - Add **Redirect URLs**:
     - `https://ezqueue.vercel.app/**`
     - `https://ezqueue.vercel.app/login`
     - `http://localhost:5173/**` (for local development)
2. Under **Authentication > Providers**:
   - **Email**: Enabled. (Optionally disable "Confirm email" for testing / demonstration environments).
   - **Google**: Enabled (Add Google Cloud Console OAuth Client ID & Client Secret with authorized redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`).

---

## 3. Backend API Deployment (`apps/api`)

The backend API is an Express.js TypeScript microservice packaged with Helmet, CORS, Rate Limiting, and Zod validation.

### Deployment Platforms
- **Render.com** (Web Service)
- **Railway.app**
- **Docker / AWS ECS / Fly.io**

### Environment Variables
Configure the following in your host provider's environment settings:

| Variable | Required | Value / Example | Purpose |
|---|---|---|---|
| `NODE_ENV` | Yes | `production` | Enables production security hardening & disables dev bypass tokens |
| `PORT` | Yes | `4000` (or host assigned `$PORT`) | Port for HTTP server |
| `CLIENT_URL` | Yes | `https://ezqueue.vercel.app` | Allowed CORS origins (comma-separated for multiple domains) |
| `SUPABASE_URL` | Yes | `https://<project-ref>.supabase.co` | Supabase API URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `ey...` | Privileged service key for admin database actions |
| `SUPABASE_ANON_KEY` | Yes | `ey...` | Public anon key for client-facing queries |
| `JWT_SECRET` | Yes | `32+ character high entropy secret` | Internal token signing key |

### Render / Railway Build & Run Settings
- **Root Directory**: `g:\QueueEz` or repository root
- **Build Command**: `npm install && npm run build -w apps/api`
- **Start Command**: `node apps/api/dist/server.js`
- **Health Check Path**: `/health`

---

## 4. Frontend Web Deployment (`apps/web`)

The frontend is a Vite + React 18 Single Page Application deployed to Vercel.

### Vercel Project Settings
- **Framework Preset**: Vite
- **Root Directory**: `apps/web` (or root with workspace build)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Frontend Environment Variables

| Variable | Value | Purpose |
|---|---|---|
| `VITE_API_URL` | `https://ezqueue-api.onrender.com/api/v1` | Backend API base endpoint |
| `VITE_API_BASE_URL` | `https://ezqueue-api.onrender.com/api/v1` | Fallback backend API base endpoint |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `ey...` | Supabase anonymous public key |

### SPA Routing & Security Headers (`vercel.json`)
The application includes `apps/web/vercel.json` configured with:
- Catch-all rewrite `/(.*) -> /index.html` preventing HTTP 404 errors on deep linking (`/dashboard`, `/queue`, `/tv-display`).
- HTTP security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`.

---

## 5. Post-Deployment Verification & Smoke Tests

After both services are deployed, perform the following validation protocol:

1. **Health Check Endpoint**:
   - Request `GET https://<api-domain>/health`.
   - Verify response: `{"success":true,"data":{"status":"healthy","environment":"production"}}`.
2. **Authentication Flow**:
   - Register a new customer account at `/register`.
   - Verify automatic profile creation in `profiles` table.
   - Verify secure login and role-based redirect at `/login`.
   - Test password reset trigger at `/forgot-password`.
3. **Queue & Appointment Operations**:
   - Book an appointment via the 4-step wizard at `/book`.
   - Check in or join virtual queue at `/queue`.
   - Verify ticket number issuance and estimated wait calculation.
4. **Staff Queue TV Display (`/tv-display`)**:
   - Open `/tv-display` in a separate browser tab or monitor.
   - Call ticket from Staff Dashboard (`/staff/queue`).
   - Confirm real-time ticket display update, audio chime announcement, and full-screen Chrome window mode (`F11`).
5. **Real-time Messaging**:
   - Open customer chat modal at `/chat`.
   - Open staff responder view at `/staff/chat`.
   - Confirm instant two-way message delivery without page reloads.
   - Confirm live typing indicator broadcasting.
6. **Support & Contact Inquiries**:
   - Submit contact form on `/contact`.
   - Confirm success toast and designated inbox destination (`ubrivant@gmail.com`).

---

## 6. Disaster Recovery & Rollback

- **Database Backups**: Supabase performs daily automated backups (Point-in-Time Recovery enabled on Pro tiers).
- **Frontend Rollbacks**: Instant 1-click rollback via Vercel Deployment History.
- **Backend Rollbacks**: Redeploy previous Git commit hash on Render/Railway.
