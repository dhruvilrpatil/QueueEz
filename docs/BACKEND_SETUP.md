# EzQueue Backend API Setup & Operations Guide

This document describes the setup, configuration, security middleware, and operational commands for the **EzQueue Express API** backend service (`apps/api`).

---

## 1. System Requirements & Runtime

- **Node.js**: `v18.0.0` or higher (LTS recommended, tested on Node 20+)
- **npm**: `v9.0.0` or higher
- **TypeScript**: `v5.6.3`
- **Framework**: Express.js 4.21 with Zod validation, Helmet, CORS, and Supabase JS Client

---

## 2. Directory Structure & Architecture

```
apps/api/
├── src/
│   ├── app.ts                  # Express application setup & middleware stack
│   ├── server.ts               # Server bootstrap & graceful shutdown handler
│   ├── config/                 # Typed environment configuration
│   ├── lib/
│   │   └── supabase.ts         # Supabase client instances (anon + admin)
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication & session attachment
│   │   ├── roles.ts            # Role-Based Access Control middleware
│   │   ├── rateLimit.ts        # General & sensitive route rate limiters
│   │   ├── validation.ts       # Zod schema request body & query validators
│   │   └── errorHandler.ts     # Global sanitized error handler
│   └── modules/
│       ├── auth/               # Profile, authentication & bootstrap routes
│       ├── facilities/         # Organization discovery & configuration
│       ├── appointments/       # Booking, scheduling & conflict prevention
│       ├── queues/             # Virtual queue, tickets & counter operations
│       ├── messaging/          # Customer-staff support inquiries
│       ├── notifications/      # Real-time and push alerts
│       └── analytics/          # Operational throughput metrics
```

---

## 3. Environment Variables Configuration

Create `.env` inside `apps/api/` based on `apps/api/.env.example`:

| Key | Description | Example / Default | Required? |
|---|---|---|---|
| `PORT` | Listening TCP port | `4000` | No (defaults to 4000) |
| `NODE_ENV` | Environment mode | `development` or `production` | Yes |
| `CLIENT_URL` | Allowed frontend origins (comma-delimited) | `http://localhost:5173,https://your-app.vercel.app` | Yes |
| `SUPABASE_URL` | Supabase API URL | `https://your-ref.supabase.co` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged admin key for database operations | `ey...` | Yes |
| `SUPABASE_ANON_KEY` | Public anon key for client-scoped operations | `ey...` | Yes |
| `JWT_SECRET` | Secret key for internal token operations | `32+ characters long` | Yes |
| `BOOTSTRAP_ADMIN_EMAIL` | Email of designated initial organization owner | `owner@example.com` | Optional |

---

## 4. Security Middleware Stack

EzQueue's backend implements defense-in-depth across every HTTP request:

1. **Helmet HTTP Headers** (`helmet`):
   - Sets secure headers including `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`.
2. **CORS Origin Filtering** (`cors`):
   - Rejects unwhitelisted origins with `Error: Origin not allowed by CORS`.
   - Supports comma-separated production origins and Vercel preview environments (`.vercel.app`).
3. **Payload Compression** (`compression`):
   - Gzip/Deflate compression for fast mobile network throughput.
4. **Body Size Limits** (`express.json({ limit: '10mb' })`):
   - Prevents memory exhaustion attacks from oversized payloads.
5. **Rate Limiting** (`express-rate-limit`):
   - Limits IP request frequency to mitigate brute-force and Denial-of-Service attacks.
6. **Authentication & Production Gate** (`authenticate`):
   - Validates Supabase JWT against GoTrue.
   - Strictly disables demo tokens (`demo-token-*`) when `NODE_ENV === 'production'`.
7. **Role-Based Access Control** (`requireRole`, `requireAdmin`, `requireStaff`):
   - Enforces facility/organization boundaries before controllers execute.
8. **Request Sanitization & Validation** (`validateBody(schema)`):
   - Validates all payloads using Zod schemas before database execution.
9. **Centralized Error Handling** (`errorHandler`):
   - Logs detailed error stacks on the server while returning sanitized, safe error objects to clients (`{ success: false, message: '...', code: '...' }`).

---

## 5. Health Check Endpoint

Request:
```http
GET /health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "environment": "production",
    "timestamp": "2026-10-06T08:00:00.000Z"
  }
}
```

---

## 6. Development & Production Commands

From the workspace root (`g:\QueueEz`):

```bash
# Run API dev server with live tsx reloading
npm run dev:api

# Type-check and build production bundle
npm run build -w apps/api

# Run production build
npm run start -w apps/api
```
