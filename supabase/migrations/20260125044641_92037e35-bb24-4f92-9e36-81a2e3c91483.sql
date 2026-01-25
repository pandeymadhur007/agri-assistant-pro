-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('farmer', 'expert', 'admin');

-- Create user profiles table for OTP-based auth
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phone TEXT,
  display_name TEXT,
  avatar_url TEXT,
  state TEXT,
  district TEXT,
  language TEXT DEFAULT 'hi',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'farmer',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create market prices table
CREATE TABLE public.market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name TEXT NOT NULL,
  crop_name_hi TEXT,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  mandi TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'quintal',
  price_date DATE NOT NULL DEFAULT CURRENT_DATE,
  price_trend TEXT CHECK (price_trend IN ('up', 'down', 'stable')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create MSP rates table
CREATE TABLE public.msp_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name TEXT NOT NULL UNIQUE,
  crop_name_hi TEXT,
  msp_price DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'quintal',
  season TEXT CHECK (season IN ('kharif', 'rabi', 'other')),
  year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crop calendar table
CREATE TABLE public.crop_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name TEXT NOT NULL,
  crop_name_hi TEXT,
  region TEXT[],
  sowing_start_month INT CHECK (sowing_start_month BETWEEN 1 AND 12),
  sowing_end_month INT CHECK (sowing_end_month BETWEEN 1 AND 12),
  harvest_start_month INT CHECK (harvest_start_month BETWEEN 1 AND 12),
  harvest_end_month INT CHECK (harvest_end_month BETWEEN 1 AND 12),
  fertilizer_months INT[],
  irrigation_frequency TEXT,
  pest_risk_months INT[],
  notes_en TEXT,
  notes_hi TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user reminders table
CREATE TABLE public.user_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  crop_name TEXT NOT NULL,
  reminder_type TEXT CHECK (reminder_type IN ('sowing', 'fertilizer', 'irrigation', 'pest_check', 'harvest')),
  reminder_date DATE NOT NULL,
  message TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community posts table
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  crop_category TEXT,
  tags TEXT[],
  upvotes INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community replies table
CREATE TABLE public.community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  upvotes INT DEFAULT 0,
  is_expert_answer BOOLEAN DEFAULT false,
  is_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create upvotes table to track user votes
CREATE TABLE public.upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.community_replies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id),
  UNIQUE (user_id, reply_id),
  CHECK (post_id IS NOT NULL OR reply_id IS NOT NULL)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles RLS policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- User roles RLS policies (read-only for users, admin managed)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Market prices RLS policies (public read)
CREATE POLICY "Market prices are publicly readable"
  ON public.market_prices FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage market prices"
  ON public.market_prices FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- MSP rates RLS policies (public read)
CREATE POLICY "MSP rates are publicly readable"
  ON public.msp_rates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage MSP rates"
  ON public.msp_rates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Crop calendar RLS policies (public read)
CREATE POLICY "Crop calendar is publicly readable"
  ON public.crop_calendar FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage crop calendar"
  ON public.crop_calendar FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- User reminders RLS policies
CREATE POLICY "Users can view their own reminders"
  ON public.user_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
  ON public.user_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON public.user_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON public.user_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Community posts RLS policies
CREATE POLICY "Community posts are publicly readable"
  ON public.community_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.community_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.community_posts FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Community replies RLS policies
CREATE POLICY "Community replies are publicly readable"
  ON public.community_replies FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create replies"
  ON public.community_replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own replies"
  ON public.community_replies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies"
  ON public.community_replies FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Upvotes RLS policies
CREATE POLICY "Upvotes are publicly readable"
  ON public.upvotes FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own upvotes"
  ON public.upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own upvotes"
  ON public.upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_market_prices_crop ON public.market_prices(crop_name);
CREATE INDEX idx_market_prices_state ON public.market_prices(state);
CREATE INDEX idx_market_prices_date ON public.market_prices(price_date);
CREATE INDEX idx_crop_calendar_crop ON public.crop_calendar(crop_name);
CREATE INDEX idx_community_posts_user ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_created ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_replies_post ON public.community_replies(post_id);
CREATE INDEX idx_user_reminders_user ON public.user_reminders(user_id);
CREATE INDEX idx_user_reminders_date ON public.user_reminders(reminder_date);

-- Create trigger for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment reply count
CREATE OR REPLACE FUNCTION public.increment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.community_posts
  SET reply_count = reply_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_reply_created
  AFTER INSERT ON public.community_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_reply_count();

-- Function to handle upvote changes on posts
CREATE OR REPLACE FUNCTION public.handle_post_upvote()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    UPDATE public.community_posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE public.community_posts SET upvotes = upvotes - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_post_upvote
  AFTER INSERT OR DELETE ON public.upvotes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_upvote();

-- Function to handle upvote changes on replies
CREATE OR REPLACE FUNCTION public.handle_reply_upvote()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.reply_id IS NOT NULL THEN
    UPDATE public.community_replies SET upvotes = upvotes + 1 WHERE id = NEW.reply_id;
  ELSIF TG_OP = 'DELETE' AND OLD.reply_id IS NOT NULL THEN
    UPDATE public.community_replies SET upvotes = upvotes - 1 WHERE id = OLD.reply_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_reply_upvote
  AFTER INSERT OR DELETE ON public.upvotes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_reply_upvote();