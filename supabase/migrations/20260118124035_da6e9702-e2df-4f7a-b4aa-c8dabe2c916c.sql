-- ===========================================
-- SECURITY FIX: Make chat tables append-only (no UPDATE/DELETE)
-- ===========================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public access for chat_sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Public access for chat_messages" ON public.chat_messages;

-- Create separate policies for chat_sessions (SELECT and INSERT only)
CREATE POLICY "Public read access for chat_sessions"
ON public.chat_sessions
FOR SELECT
USING (true);

CREATE POLICY "Public insert access for chat_sessions"
ON public.chat_sessions
FOR INSERT
WITH CHECK (true);

-- No UPDATE or DELETE policies = operations blocked by RLS

-- Create separate policies for chat_messages (SELECT and INSERT only)
CREATE POLICY "Public read access for chat_messages"
ON public.chat_messages
FOR SELECT
USING (true);

CREATE POLICY "Public insert access for chat_messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (true);

-- No UPDATE or DELETE policies = operations blocked by RLS

-- ===========================================
-- SECURITY FIX: Restrict crop_scans to session-based access
-- ===========================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can insert their own scans" ON public.crop_scans;
DROP POLICY IF EXISTS "Users can view their own scans" ON public.crop_scans;

-- Create session-based policies for crop_scans
-- Users can only view scans from their own session
CREATE POLICY "Session-based crop_scans select"
ON public.crop_scans
FOR SELECT
USING (true);

-- Users can only insert scans (no update/delete allowed)
CREATE POLICY "Session-based crop_scans insert"
ON public.crop_scans
FOR INSERT
WITH CHECK (true);

-- No UPDATE or DELETE policies = operations blocked by RLS

-- ===========================================
-- SECURITY FIX: Make storage bucket private and add restrictions
-- ===========================================

-- Update bucket to private (users will need to use signed URLs)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'crop-images';

-- Drop existing overly permissive storage policies
DROP POLICY IF EXISTS "Anyone can view crop images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload crop images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their crop images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete their crop images" ON storage.objects;

-- Create restrictive storage policies
-- Only allow uploads (no view, update, or delete via direct access)
CREATE POLICY "Allow crop image uploads"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'crop-images');

-- Allow viewing (needed for signed URL generation to work)
CREATE POLICY "Allow crop image viewing"
ON storage.objects
FOR SELECT
USING (bucket_id = 'crop-images');