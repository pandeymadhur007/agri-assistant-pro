-- Fix get_session_id function to use SECURITY INVOKER instead of SECURITY DEFINER
-- This is safer as the function only reads headers and doesn't need elevated privileges
CREATE OR REPLACE FUNCTION public.get_session_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    current_setting('request.headers', true)::json->>'x-session-id',
    ''
  );
$$;