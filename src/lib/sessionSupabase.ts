import { supabase } from '@/integrations/supabase/client';

const ANON_AUTH_TIMEOUT_MS = 4000;

/**
 * Get the current user's ID for session-based features.
 * This uses Supabase anonymous auth for secure server-side session management.
 * If no user is authenticated, returns null.
 */
export const getSessionId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
};

/**
 * Ensure user has a valid session by using Supabase anonymous auth.
 * This is more secure than client-generated session IDs because:
 * 1. Session IDs are generated server-side with cryptographic security
 * 2. Sessions are validated on every request
 * 3. Sessions have proper expiration and refresh mechanisms
 */
export const ensureAnonymousSession = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    localStorage.setItem('gram_user_id', session.user.id);
    return session.user.id;
  }

  try {
    const { data, error } = await Promise.race([
      supabase.auth.signInAnonymously(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Anonymous auth timed out')), ANON_AUTH_TIMEOUT_MS);
      }),
    ]);

    if (error) {
      console.error('Failed to create anonymous session:', error.message);
      return null;
    }

    const userId = data.user?.id ?? null;
    if (userId) {
      localStorage.setItem('gram_user_id', userId);
    }

    return userId;
  } catch (error) {
    console.error('Failed to create anonymous session:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

/**
 * Synchronous getter for session ID from cached session.
 * Used for compatibility with existing code that expects sync access.
 * Falls back to localStorage legacy session for backwards compatibility during migration.
 */
export const getSessionIdSync = (): string => {
  // Try to get from Supabase session (cached)
  const session = supabase.auth.getSession();
  
  // For sync access, we need to use a cached value
  // Check localStorage for cached user ID
  const cachedUserId = localStorage.getItem('gram_user_id');
  if (cachedUserId) {
    return cachedUserId;
  }
  
  // Legacy fallback - will be removed after migration
  const legacySessionId = localStorage.getItem('gram_session_id');
  if (legacySessionId) {
    return legacySessionId;
  }
  
  // Generate a new UUID as last resort (will be replaced by auth on next async call)
  const tempId = crypto.randomUUID();
  localStorage.setItem('gram_session_id', tempId);
  return tempId;
};

/**
 * Cache the user ID for synchronous access
 */
export const cacheUserId = (userId: string): void => {
  localStorage.setItem('gram_user_id', userId);
};

/**
 * Clear the cached session
 */
export const clearSession = async (): Promise<void> => {
  localStorage.removeItem('gram_user_id');
  localStorage.removeItem('gram_session_id');
  await supabase.auth.signOut();
};
