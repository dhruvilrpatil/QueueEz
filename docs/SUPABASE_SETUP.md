# EzQueue Supabase Complete Setup Guide

This guide provides end-to-end instructions for provisioning, configuring, and verifying the Supabase backend for **EzQueue – Smart Appointment & Virtual Queue Management System**.

---

## 1. Overview of Supabase Services Used in EzQueue

EzQueue leverages four primary Supabase capabilities:

1. **PostgreSQL 15 Database**: Relational schema with strong types, triggers, foreign keys, and multi-tenant Row-Level Security (RLS).
2. **Supabase Auth**: Secure user registration, authentication (Email/Password & Google OAuth), and JWT session management.
3. **Supabase Realtime**:
   - **Postgres Changes**: Real-time table change notifications for queue tickets, counter assignments, and new chat messages.
   - **Broadcast Channels**: Low-latency ephemeral events (such as typing indicators `typing:conversation_id` and instant staff announcements).
4. **Supabase Storage**: Object storage for user profile avatar image uploads.

---

## 2. Step 1: Provisioning a New Project

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New project** and select an Organization.
3. Provide project details:
   - **Name**: `ezqueue-production` (or `ezqueue-dev`)
   - **Database Password**: Generate and store a secure 20+ character password.
   - **Region**: Select the geographic region closest to your operational facility (e.g., `ap-south-1` Mumbai / India).
4. Wait 1–2 minutes for the database instance to initialize.

---

## 3. Step 2: Applying Database Migrations

You can apply the migrations using either the **Supabase Dashboard SQL Editor** or the **Supabase CLI**.

### Option A: Via Supabase SQL Editor (Fastest)

1. Open **SQL Editor** from the left navigation bar.
2. Click **New query**.
3. Copy the entire contents of [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql) and paste into the editor. Click **Run**.
   - *What this creates*: Extensions (`uuid-ossp`, `pg_trgm`), enums (`user_role`, `ticket_status`, etc.), tables (`profiles`, `facilities`, `services`, `counters`, `queue_sessions`, `queue_tickets`, `appointments`, `notifications`, `audit_logs`), auth triggers (`handle_new_user`), RLS policies, seed facilities, and realtime publication assignments.
4. Click **New query** again.
5. Copy the entire contents of [`supabase/migrations/002_messaging_schema.sql`](../supabase/migrations/002_messaging_schema.sql) and paste into the editor. Click **Run**.
   - *What this creates*: Messaging tables (`conversations`, `messages`, `conversation_participants`), automated update triggers, support staff assignment policies, and realtime publication assignments.

### Option B: Via Supabase CLI

```bash
# Link project to local repository
npx supabase login
npx supabase link --project-ref <your-project-ref>

# Push all migrations
npx supabase db push
```

---

## 4. Step 3: CRITICAL — Enable Realtime Broadcast Channels

> [!IMPORTANT]
> **This configuration step is required for live queue and chat features.**
> 
> EzQueue relies on Supabase Realtime broadcast channels (`supabase.channel('typing:...')`) to transmit real-time typing indicators between customers and staff without incurring database write latency or database bloat.
> 
> The Staff Queue TV Display also uses Realtime channels to receive instant announcements when tickets are called.

### How to configure in Dashboard:
1. In the Supabase Dashboard, go to **Project Settings** (gear icon at the bottom of the left sidebar).
2. Select **API** or **Realtime** in the settings menu.
3. Ensure **Realtime** is toggled **ON**.
4. Confirm **Broadcast** and **Presence** are enabled.
5. Under the SQL Editor, verify that the required tables are in the `supabase_realtime` publication:

```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```
*Expected tables in output*:
- `queue_tickets`
- `counters`
- `conversations`
- `messages`
- `conversation_participants`

If any are missing, run:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE queue_tickets, counters, conversations, messages, conversation_participants;
```

---

## 5. Step 4: Storage Bucket Configuration (`avatars`)

EzQueue supports custom profile photo uploads for customers and staff members.

1. Navigate to **Storage** in the left menu.
2. Click **New bucket**.
3. Name: `avatars`.
4. Toggle **Public bucket** to **ON** (allows public URL reads for avatar display).
5. Click **Save**.
6. Navigate to **Policies** under Storage and add policies for the `avatars` bucket:

```sql
-- Allow anyone to read avatars
CREATE POLICY "Public avatar read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Authenticated users can upload avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Authenticated users can update avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 6. Step 5: Authentication & OAuth Setup

### 6.1 General Auth Settings
1. Go to **Authentication > URL Configuration**.
2. Set **Site URL**: `https://your-domain.vercel.app` (or `http://localhost:5173` for dev).
3. Under **Redirect URLs**, add:
   - `https://your-domain.vercel.app/**`
   - `https://your-domain.vercel.app/login`
   - `http://localhost:5173/**`
   - `http://localhost:5173/login`
4. Under **Authentication > Providers > Email**:
   - Enable Email Provider.
   - For demo / grading environments, toggle off "Confirm email" if you wish to allow instant login upon registration without verification emails.

### 6.2 Google OAuth Provider (Optional for One-Click Google Login)
1. In Google Cloud Console, create an OAuth 2.0 Web Application client.
2. Set Authorized Redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. In Supabase Dashboard, go to **Authentication > Providers > Google**.
4. Enable Google and enter your `Client ID` and `Client Secret`. Save.

---

## 7. Step 6: Environment Variables Wiring

Retrieve your project API keys from **Project Settings > API**:

### For `apps/web/.env` (Frontend):
```ini
VITE_API_URL=https://your-api.onrender.com/api/v1
VITE_API_BASE_URL=https://your-api.onrender.com/api/v1
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

### For `apps/api/.env` (Backend Express):
```ini
PORT=4000
NODE_ENV=production
CLIENT_URL=https://your-domain.vercel.app
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret-key>
SUPABASE_ANON_KEY=<your-anon-public-key>
JWT_SECRET=<strong-random-32-char-string>
```

> [!CAUTION]
> Never expose `SUPABASE_SERVICE_ROLE_KEY` in `apps/web` or any client-side JavaScript. This key bypasses Row-Level Security and is strictly reserved for the Node.js backend.

---

## 8. Verification & Sanity Checks

Run this query in SQL Editor to verify complete table and trigger provisioning:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Required output tables**:
- `appointments`
- `audit_logs`
- `business_hours`
- `conversation_participants`
- `conversations`
- `counters`
- `facilities`
- `messages`
- `notifications`
- `profiles`
- `queue_sessions`
- `queue_tickets`
- `services`

Your Supabase backend is now completely prepared for EzQueue production traffic.
