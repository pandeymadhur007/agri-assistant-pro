-- Profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type_other text,
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT false;

-- Allow new scheme category
ALTER TABLE public.schemes DROP CONSTRAINT IF EXISTS schemes_category_check;
ALTER TABLE public.schemes ADD CONSTRAINT schemes_category_check
  CHECK (category = ANY (ARRAY['farmers'::text, 'women'::text, 'students'::text, 'rural_workers'::text, 'dairy_livestock'::text]));

-- Animal breeds catalog
CREATE TABLE IF NOT EXISTS public.animal_breeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name_en text NOT NULL,
  name_hi text,
  origin text,
  emoji text DEFAULT '🐄',
  daily_production text,
  suitable_states text[],
  suitable_climate text,
  characteristics_en text,
  characteristics_hi text,
  estimated_profit text,
  related_schemes text[],
  setup_guide_en text,
  setup_guide_hi text,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.animal_breeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Animal breeds publicly readable" ON public.animal_breeds FOR SELECT USING (true);
CREATE POLICY "Deny insert on animal_breeds" ON public.animal_breeds FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny update on animal_breeds" ON public.animal_breeds FOR UPDATE USING (false);
CREATE POLICY "Deny delete on animal_breeds" ON public.animal_breeds FOR DELETE USING (false);
CREATE POLICY "Admins manage animal_breeds" ON public.animal_breeds FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Climate alerts
CREATE TABLE IF NOT EXISTS public.climate_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  alert_type text NOT NULL,
  severity text DEFAULT 'medium',
  title text NOT NULL,
  message text NOT NULL,
  state text,
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.climate_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own alerts" ON public.climate_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert their own alerts" ON public.climate_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own alerts" ON public.climate_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete their own alerts" ON public.climate_alerts FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_climate_alerts_user_unread
  ON public.climate_alerts (user_id, is_read, is_dismissed, triggered_at DESC);