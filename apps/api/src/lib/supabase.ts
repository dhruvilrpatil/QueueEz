import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Admin client with service role key (server-side only, never expose to frontend)
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Anon client for user-context operations
export const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey
);
