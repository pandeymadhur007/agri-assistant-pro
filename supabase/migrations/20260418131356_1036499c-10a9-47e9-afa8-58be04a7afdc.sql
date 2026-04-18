ALTER TABLE public.schemes
  ADD COLUMN IF NOT EXISTS application_deadline DATE,
  ADD COLUMN IF NOT EXISTS success_rate INTEGER,
  ADD COLUMN IF NOT EXISTS eligibility_criteria JSONB;