-- Fix the SECURITY DEFINER view issue by recreating the view with SECURITY INVOKER
-- This ensures the view uses the permissions of the querying user, not the view creator

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
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