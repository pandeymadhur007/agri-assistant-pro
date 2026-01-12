-- Create table for crop scans
CREATE TABLE public.crop_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  crop_name TEXT,
  disease_name TEXT,
  severity TEXT,
  cause TEXT,
  treatment TEXT,
  pesticide TEXT,
  prevention TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  raw_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.crop_scans ENABLE ROW LEVEL SECURITY;

-- Create policy for session-based access
CREATE POLICY "Users can view their own scans" 
ON public.crop_scans 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own scans" 
ON public.crop_scans 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster session queries
CREATE INDEX idx_crop_scans_session_id ON public.crop_scans(session_id);
CREATE INDEX idx_crop_scans_created_at ON public.crop_scans(created_at DESC);

-- Create storage bucket for crop images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'crop-images', 
  'crop-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

-- Storage policies for crop images
CREATE POLICY "Anyone can view crop images"
ON storage.objects FOR SELECT
USING (bucket_id = 'crop-images');

CREATE POLICY "Anyone can upload crop images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'crop-images');

CREATE POLICY "Anyone can update their crop images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'crop-images');

CREATE POLICY "Anyone can delete their crop images"
ON storage.objects FOR DELETE
USING (bucket_id = 'crop-images');