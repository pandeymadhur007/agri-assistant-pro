-- Fix Security Issue 1: Phone numbers publicly exposed in profiles table
-- Create a public view that excludes sensitive fields (phone)

CREATE VIEW public.public_profiles AS
  SELECT 
    id, 
    user_id, 
    display_name, 
    avatar_url, 
    state, 
    district, 
    language, 
    created_at, 
    updated_at
  FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a new policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Fix Security Issue 2: User registration fails due to missing role INSERT policy
-- Add a policy allowing users to insert their own default farmer role once during registration

CREATE POLICY "Users can set initial farmer role"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND role = 'farmer'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid()
    )
  );