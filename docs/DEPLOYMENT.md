# Deployment Guide & Checklist

## Supabase Deployment Checklist
- [ ] Enable **Realtime Broadcast Channels** under Supabase Dashboard > Project Settings > Realtime.
  - *Reason*: Required for real-time typing indicators (`supabase.channel('typing:...')`) and live queue ticket updates to work without database overhead or server polling.
- [ ] Push database migrations using Supabase CLI (`npx supabase db push`) or SQL Editor (`supabase/migrations/001_initial_schema.sql`).
- [ ] Copy `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Vercel/Render env vars.

## Vercel Deployment Checklist
- [ ] Deploy `apps/web` (Vite + React UI).
- [ ] Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL`.
