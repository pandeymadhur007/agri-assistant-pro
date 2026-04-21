DROP POLICY IF EXISTS "Users can set initial farmer role" ON public.user_roles;

CREATE POLICY "Users can set their initial role"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('farmer'::app_role, 'buyer'::app_role)
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);