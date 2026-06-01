-- Public bucket for crop scan uploads (anonymous-friendly, short-lived images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('crop-scan-uploads', 'crop-scan-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone (including anon session users) can upload an image
CREATE POLICY "Anyone can upload crop scan images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'crop-scan-uploads');

-- Public read (so the edge function + Gemini can fetch via URL)
CREATE POLICY "Crop scan images are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'crop-scan-uploads');