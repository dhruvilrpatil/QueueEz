import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

const supabaseUrl = config.supabase.url || 'https://placeholder.supabase.co';
const serviceRoleKey = config.supabase.serviceRoleKey || 'placeholder-service-key-for-development';
const anonKey = config.supabase.anonKey || 'placeholder-anon-key-for-development';

// Admin client with service role key (server-side only, never expose to frontend)
export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Anon client for user-context operations
export const supabaseAnon = createClient(
  supabaseUrl,
  anonKey
);
