
-- 1. crop-scan-uploads: require auth on insert, remove broad SELECT (listing) policy
DROP POLICY IF EXISTS "Anyone can upload crop scan images" ON storage.objects;
DROP POLICY IF EXISTS "Crop scan images are publicly readable" ON storage.objects;

CREATE POLICY "Authenticated users can upload crop scan images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'crop-scan-uploads' AND auth.uid() IS NOT NULL);

-- (No SELECT policy needed: bucket is public so files are still served via their public URL,
--  but listing via the storage API is no longer broadly permitted.)

-- 2. crop-images: allow owners to update/delete their own files
CREATE POLICY "Users can update own crop images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'crop-images' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'crop-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own crop images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'crop-images' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. profiles: allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. upvotes: restrict reads to authenticated users (prevents anon enumeration)
DROP POLICY IF EXISTS "Upvotes are publicly readable" ON public.upvotes;
CREATE POLICY "Authenticated users can read upvotes"
ON public.upvotes FOR SELECT
TO authenticated
USING (true);

-- 5. user_roles: prevent self-assigning 'buyer' role
DROP POLICY IF EXISTS "Users can set their initial role" ON public.user_roles;
CREATE POLICY "Users can set their initial farmer role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'farmer'::app_role
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid())
);

-- 6. Lock down trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.increment_reply_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_post_upvote() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_reply_upvote() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
