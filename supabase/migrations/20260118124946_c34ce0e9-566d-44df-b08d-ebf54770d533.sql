-- ===========================================
-- SECURITY FIX: Implement session-based RLS
-- ===========================================

-- Create a function to safely get session_id from request headers
CREATE OR REPLACE FUNCTION public.get_session_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    current_setting('request.headers', true)::json->>'x-session-id',
    ''
  );
$$;

-- ===========================================
-- Update chat_messages RLS policies
-- ===========================================
DROP POLICY IF EXISTS "Public read access for chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Public insert access for chat_messages" ON public.chat_messages;

-- Session-based SELECT: users can only read messages from their session
CREATE POLICY "Session-based read access for chat_messages"
ON public.chat_messages
FOR SELECT
USING (session_id = public.get_session_id());

-- Session-based INSERT: users can only insert messages for their session
CREATE POLICY "Session-based insert access for chat_messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (session_id = public.get_session_id());

-- ===========================================
-- Update chat_sessions RLS policies
-- ===========================================
DROP POLICY IF EXISTS "Public read access for chat_sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Public insert access for chat_sessions" ON public.chat_sessions;

-- Session-based SELECT: users can only read their own session
CREATE POLICY "Session-based read access for chat_sessions"
ON public.chat_sessions
FOR SELECT
USING (session_id = public.get_session_id());

-- Session-based INSERT: users can only create their own session
CREATE POLICY "Session-based insert access for chat_sessions"
ON public.chat_sessions
FOR INSERT
WITH CHECK (session_id = public.get_session_id());

-- ===========================================
-- Update crop_scans RLS policies
-- ===========================================
DROP POLICY IF EXISTS "Session-based crop_scans select" ON public.crop_scans;
DROP POLICY IF EXISTS "Session-based crop_scans insert" ON public.crop_scans;

-- Session-based SELECT: users can only read scans from their session
CREATE POLICY "Session-based read access for crop_scans"
ON public.crop_scans
FOR SELECT
USING (session_id = public.get_session_id());

-- Session-based INSERT: users can only insert scans for their session
CREATE POLICY "Session-based insert access for crop_scans"
ON public.crop_scans
FOR INSERT
WITH CHECK (session_id = public.get_session_id());

-- ===========================================
-- Update storage policies for session-based access
-- ===========================================
DROP POLICY IF EXISTS "Allow crop image viewing" ON storage.objects;
DROP POLICY IF EXISTS "Allow crop image uploads" ON storage.objects;

-- Session-based storage SELECT: users can only access images in their session folder
CREATE POLICY "Session-based storage read access"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'crop-images' AND
  (storage.foldername(name))[1] = public.get_session_id()
);

-- Session-based storage INSERT: users can only upload to their session folder
CREATE POLICY "Session-based storage insert access"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'crop-images' AND
  (storage.foldername(name))[1] = public.get_session_id()
);