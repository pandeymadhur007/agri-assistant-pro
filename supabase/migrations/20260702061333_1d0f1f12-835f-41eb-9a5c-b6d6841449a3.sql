
-- Remove redundant/confusing deny policies on animal_breeds (default is deny without a permissive policy)
DROP POLICY IF EXISTS "Deny insert on animal_breeds" ON public.animal_breeds;
DROP POLICY IF EXISTS "Deny update on animal_breeds" ON public.animal_breeds;
DROP POLICY IF EXISTS "Deny delete on animal_breeds" ON public.animal_breeds;

-- Restrict profile INSERT to authenticated (non-anonymous) users
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE
);
