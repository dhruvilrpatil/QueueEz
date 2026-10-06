# EzQueue Vercel Production Deployment Guide

This guide provides a step-by-step walkthrough for deploying the **EzQueue Web Frontend** (`apps/web`) to **Vercel** with zero-downtime and Single-Page Application (SPA) deep-routing compatibility.

---

## 1. Step-by-Step Deployment Protocol

### Step 1: Push Codebase to GitHub
Ensure all local commits are pushed to your remote repository:
```bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin master
```

### Step 2: Import Repository into Vercel
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New... > Project**.
3. Locate and import your `QueueEz` repository.

### Step 3: Configure Project Directory & Framework
1. In the **Configure Project** screen:
   - **Framework Preset**: Select **Vite**.
   - **Root Directory**: Click Edit and select `apps/web` (or leave as root if using workspace build).
2. **Build and Output Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 4: Configure Production Environment Variables
Add the following variables in the Vercel **Environment Variables** panel:

| Name | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://your-api.onrender.com/api/v1` | Production backend URL |
| `VITE_API_BASE_URL` | `https://your-api.onrender.com/api/v1` | Production backend fallback |
| `VITE_SUPABASE_URL` | `https://<your-project>.supabase.co` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | `ey...` | Supabase Anonymous Public Key |

> [!CAUTION]
> Do NOT set `SUPABASE_SERVICE_ROLE_KEY` on Vercel for the web client. The service key is strictly server-only.

### Step 5: Deploy
Click **Deploy**. Vercel will clone the branch, execute `npm run build` (which runs `tsc --noEmit && vite build`), and publish the production assets to Vercel's global Edge network.

---

## 2. SPA Deep-Routing & Security (`vercel.json`)

To prevent HTTP 404 Not Found errors when refreshing or navigating directly to deep client routes (e.g. `/facilities/123`, `/staff/queue`, `/staff/queue-display`, `/login`), EzQueue includes `apps/web/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

---

## 3. Post-Deployment Supabase & Google OAuth Synchronization

Once your Vercel deployment URL is generated (e.g. `https://ezqueue.vercel.app`):

### 3.1 Supabase Auth Redirects
1. Go to **Supabase Dashboard > Authentication > URL Configuration**.
2. Update **Site URL**: `https://ezqueue.vercel.app`.
3. Add to **Redirect URLs**:
   - `https://ezqueue.vercel.app/**`
   - `https://ezqueue.vercel.app/login`
   - `https://ezqueue.vercel.app/auth/callback`

### 3.2 Google OAuth (if enabled)
1. Go to **Google Cloud Console > Credentials**.
2. Verify that Authorized Redirect URI includes:
   ```
   https://<your-supabase-ref>.supabase.co/auth/v1/callback
   ```
3. Authorized JavaScript Origins: Add `https://ezqueue.vercel.app`.

### 3.3 Backend API CORS Synchronization
1. In your backend host (e.g. Render/Railway), update `CLIENT_URL` to include your Vercel URL:
   ```env
   CLIENT_URL=https://ezqueue.vercel.app
   ```
2. Trigger a redeploy of the backend API.

---

## 4. Production Smoke Tests

Perform the following validation tests on your deployed Vercel site:

1. **Direct Route Reload**: Navigate to `https://ezqueue.vercel.app/facilities` and press `F5` / Refresh. Verify no 404 error occurs.
2. **Customer Registration & Login**: Test user signup at `/register` and login at `/login`.
3. **Real-time Queue TV Display**: Open `https://ezqueue.vercel.app/staff/queue-display` and press `F11` (Fullscreen). Verify zero horizontal/vertical scrollbars and active connection status indicator.
4. **Live Chat Inquiries**: Send a test query from `/chat` and verify real-time receipt on `/staff/chat`.
