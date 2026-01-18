import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Generate or retrieve session ID
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('gram_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('gram_session_id', sessionId);
  }
  return sessionId;
};

// Create a Supabase client with session header for RLS
export const createSessionClient = () => {
  const sessionId = getSessionId();
  
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'x-session-id': sessionId,
      },
    },
  });
};

// Get a fresh client with current session ID
export const getSessionSupabase = () => createSessionClient();
