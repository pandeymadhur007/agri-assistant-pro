-- Update RLS policies to use auth.uid() for session-based tables
-- This is more secure than custom session headers

-- Drop old session-based policies
DROP POLICY IF EXISTS "Session-based read access for chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Session-based insert access for chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Session-based read access for chat_sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Session-based insert access for chat_sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Session-based read access for crop_scans" ON public.crop_scans;
DROP POLICY IF EXISTS "Session-based insert access for crop_scans" ON public.crop_scans;

-- Add user_id column to session-based tables (for migration)
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.crop_scans ADD COLUMN IF NOT EXISTS user_id uuid;

-- Create new RLS policies using auth.uid()
-- Chat messages
CREATE POLICY "Users can read their own chat messages" 
  ON public.chat_messages FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      session_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert their own chat messages" 
  ON public.chat_messages FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      session_id = auth.uid()::text
    )
  );

-- Chat sessions
CREATE POLICY "Users can read their own chat sessions" 
  ON public.chat_sessions FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      session_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert their own chat sessions" 
  ON public.chat_sessions FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      session_id = auth.uid()::text
    )
  );

-- Crop scans
CREATE POLICY "Users can read their own crop scans" 
  ON public.crop_scans FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      session_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert their own crop scans" 
  ON public.crop_scans FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      session_id = auth.uid()::text
    )
  );

-- Add explicit deny policies for reference tables to make implicit deny explicit
CREATE POLICY "Deny insert on crops" ON public.crops FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny update on crops" ON public.crops FOR UPDATE USING (false);
CREATE POLICY "Deny delete on crops" ON public.crops FOR DELETE USING (false);

CREATE POLICY "Deny insert on pests" ON public.pests FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny update on pests" ON public.pests FOR UPDATE USING (false);
CREATE POLICY "Deny delete on pests" ON public.pests FOR DELETE USING (false);

CREATE POLICY "Deny insert on schemes" ON public.schemes FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny update on schemes" ON public.schemes FOR UPDATE USING (false);
CREATE POLICY "Deny delete on schemes" ON public.schemes FOR DELETE USING (false);