-- Fix storage RLS policies to use auth.uid() instead of get_session_id()
-- The get_session_id() function reads x-session-id header which isn't available in storage operations

DROP POLICY IF EXISTS "Session-based storage insert access" ON storage.objects;
DROP POLICY IF EXISTS "Session-based storage read access" ON storage.objects;

-- Allow authenticated users (including anonymous) to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'crop-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'crop-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);