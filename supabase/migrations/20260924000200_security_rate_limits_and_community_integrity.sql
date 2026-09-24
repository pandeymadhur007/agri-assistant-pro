-- Prevent anonymous callers from spending shared AI/API quota and protect community trust fields.
CREATE TABLE IF NOT EXISTS public.edge_function_rate_limits (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name text NOT NULL,
  window_started timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (user_id, function_name)
);
ALTER TABLE public.edge_function_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.edge_function_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_edge_function_rate_limit(p_function_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_limit integer;
  v_window_start timestamptz;
  v_request_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  v_limit := CASE p_function_name
    WHEN 'chat' THEN 60
    WHEN 'scan-crop' THEN 15
    WHEN 'speech-to-text' THEN 30
    WHEN 'murf-tts' THEN 60
    WHEN 'crop-recommendations' THEN 5
    WHEN 'market-insight' THEN 20
    WHEN 'fetch-market-prices' THEN 1
    ELSE NULL
  END;
  IF v_limit IS NULL THEN
    RETURN false;
  END IF;

  v_window_start := date_trunc('hour', now());
  INSERT INTO public.edge_function_rate_limits (user_id, function_name, window_started, request_count)
  VALUES (v_user_id, p_function_name, v_window_start, 1)
  ON CONFLICT (user_id, function_name) DO UPDATE
  SET window_started = EXCLUDED.window_started,
      request_count = CASE
        WHEN public.edge_function_rate_limits.window_started = EXCLUDED.window_started
          THEN public.edge_function_rate_limits.request_count + 1
        ELSE 1
      END
  RETURNING request_count INTO v_request_count;

  RETURN v_request_count <= v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_edge_function_rate_limit(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_edge_function_rate_limit(text) TO authenticated;

-- Market-price refresh is transactional so an upstream or insert failure cannot
-- leave the public table empty or partially refreshed.
CREATE OR REPLACE FUNCTION public.replace_market_prices(p_rows jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array'
     OR jsonb_array_length(p_rows) = 0 OR jsonb_array_length(p_rows) > 10000 THEN
    RAISE EXCEPTION 'Invalid market price batch';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_rows) AS r(
      crop_name text, crop_name_hi text, state text, district text, mandi text,
      price numeric, unit text, price_date date, price_trend text
    )
    WHERE r.crop_name IS NULL OR r.state IS NULL OR r.district IS NULL
       OR r.mandi IS NULL OR r.price IS NULL OR r.price <= 0
       OR r.price_date IS NULL OR r.price_trend NOT IN ('up', 'down', 'stable')
  ) THEN
    RAISE EXCEPTION 'Invalid market price record';
  END IF;

  DELETE FROM public.market_prices;
  INSERT INTO public.market_prices (
    crop_name, crop_name_hi, state, district, mandi, price, unit, price_date, price_trend
  )
  SELECT crop_name, crop_name_hi, state, district, mandi, price,
         COALESCE(unit, 'quintal'), price_date, price_trend
  FROM jsonb_to_recordset(p_rows) AS r(
    crop_name text, crop_name_hi text, state text, district text, mandi text,
    price numeric, unit text, price_date date, price_trend text
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.replace_market_prices(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_market_prices(jsonb) TO service_role;

-- Community authors may edit their content, but never trust flags or counters.
CREATE OR REPLACE FUNCTION public.guard_community_post_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.upvotes := 0;
    NEW.reply_count := 0;
  ELSIF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    NEW.upvotes := OLD.upvotes;
    NEW.reply_count := OLD.reply_count;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_community_post_fields ON public.community_posts;
CREATE TRIGGER guard_community_post_fields
BEFORE INSERT OR UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.guard_community_post_fields();

CREATE OR REPLACE FUNCTION public.guard_community_reply_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.upvotes := 0;
    NEW.is_accepted := false;
    NEW.is_expert_answer := public.has_role(auth.uid(), 'expert'::public.app_role);
  ELSIF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    NEW.upvotes := OLD.upvotes;
    NEW.is_accepted := OLD.is_accepted;
    NEW.is_expert_answer := OLD.is_expert_answer;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_community_reply_fields ON public.community_replies;
CREATE TRIGGER guard_community_reply_fields
BEFORE INSERT OR UPDATE ON public.community_replies
FOR EACH ROW EXECUTE FUNCTION public.guard_community_reply_fields();
