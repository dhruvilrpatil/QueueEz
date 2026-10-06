# EzQueue Authentication & Authorization Setup Guide

This document describes the complete identity, session management, and role-based authorization architecture for **EzQueue – Smart Appointment & Virtual Queue Management System**.

---

## 1. Authentication Architecture Overview

EzQueue delegates identity lifecycle management to **Supabase Auth** (backed by GoTrue) while enforcing authorization via:
1. **Server-Side Role Verification**: Express.js middleware (`requireRole`, `requireAdmin`, `requireStaff`) validating decoded JWT profiles.
2. **Database-Level Row-Level Security (RLS)**: PostgreSQL policies on tables preventing cross-tenant data exfiltration.
3. **Server-Controlled Bootstrap**: Automatic, idempotent elevation of designated initial administrators without client-side bypasses.

---

## 2. Step 1: Supabase Project Authentication Settings

1. In the [Supabase Dashboard](https://supabase.com/dashboard), open your project and go to **Authentication > Configuration > URL Configuration**.
2. **Site URL**:
   - Development: `http://localhost:5173`
   - Production: `https://your-ezqueue-domain.vercel.app`
3. **Redirect URLs**:
   Add the following patterns:
   - `http://localhost:5173/**`
   - `http://localhost:5173/login`
   - `https://your-ezqueue-domain.vercel.app/**`
   - `https://your-ezqueue-domain.vercel.app/login`
   - `https://your-ezqueue-domain.vercel.app/auth/callback`

---

## 3. Step 2: Email & Password Configuration

1. Under **Authentication > Providers > Email**:
   - **Enable Email Provider**: ON.
   - **Confirm email**:
     - *For production*: ON.
     - *For academic evaluation / staging*: OFF (enables immediate login upon registration).
   - **Minimum Password Length**: 8 characters.

---

## 4. Step 3: Google OAuth Provider Setup (Optional)

1. Open [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials.
2. Create an **OAuth 2.0 Client ID** (Application type: Web Application).
3. Under **Authorized redirect URIs**, enter:
   ```
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```
4. Copy the **Client ID** and **Client Secret**.
5. Back in Supabase Dashboard, go to **Authentication > Providers > Google**:
   - Toggle **Enable Google** ON.
   - Paste **Client ID** and **Client Secret**.
   - Click **Save**.

---

## 5. Step 4: User Profile Creation Trigger

EzQueue ensures every user who signs up automatically receives an application profile in the `public.profiles` table:

```sql
-- Trigger handle_new_user() runs on auth.users INSERT
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
Every new user begins with role `customer`. The client cannot manipulate this role during signup.

---

## 6. Step 5: Initial Organization Owner / Bootstrap Setup

To establish the first Organization Owner safely without hardcoding emails in React or committing credentials:

1. In `apps/api/.env`, set:
   ```env
   BOOTSTRAP_ADMIN_EMAIL=owner@yourdomain.com
   ```
2. Have the designated owner register or sign in using that exact email address (`owner@yourdomain.com`).
3. Upon fetching `/api/v1/auth/me` or invoking `POST /api/v1/auth/bootstrap`, the backend validates the authenticated JWT email against `BOOTSTRAP_ADMIN_EMAIL`.
4. The server elevates the user's role in PostgreSQL to `facility_admin` (Organization Owner) idempotently and auditably.
5. All non-matching users receive `403 Forbidden` if attempting to call `/api/v1/auth/bootstrap`.

---

## 7. Step 6: Permission Matrix & Role Verification

EzQueue implements three primary roles:

| Action / Capability | Customer | Staff | Organization Owner (`facility_admin`) |
|---|:---:|:---:|:---:|
| Browse Public Organizations & Services | Yes | Yes | Yes |
| Book Appointment & Join Virtual Queue | Yes | Yes | Yes |
| View Own Tickets & Booking History | Yes | Yes | Yes |
| Submit Queries / Customer Chat | Yes | Yes | Yes |
| Operate Counter Dashboard (Call, Start, Complete, Skip) | No | Yes | Yes |
| Access Public Staff Queue TV Display | No | Yes | Yes |
| Respond to Customer Support Messages | No | Yes | Yes |
| Add / Manage Staff Members | No | No | Yes |
| Configure Services & Slot Durations | No | No | Yes |
| Configure Physical Counters | No | No | Yes |
| View Organization Throughput Analytics | No | No | Yes |

---

## 8. Verification Protocol

Run the following checks to verify authorization enforcement:

1. **Customer Verification**:
   - Log in as a customer account.
   - Attempt to navigate to `/staff/queue` or call `POST /api/v1/queues/tickets/:id/call`.
   - Verify: HTTP 403 Forbidden and redirect to customer dashboard.
2. **Staff Verification**:
   - Log in as staff.
   - Verify access to `/staff/queue` and counter operations.
   - Attempt to access Organization Settings or Staff Management: forbidden.
3. **Owner Verification**:
   - Log in as bootstrapped owner.
   - Verify full access to `/admin` and `/staff/queue`.
