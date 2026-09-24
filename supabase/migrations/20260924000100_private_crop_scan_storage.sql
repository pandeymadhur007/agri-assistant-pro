UPDATE storage.buckets
SET public = false
WHERE id = 'crop-scan-uploads';

DROP POLICY IF EXISTS "Anyone can upload crop scan images" ON storage.objects;
DROP POLICY IF EXISTS "Crop scan images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Crop scan images are private to their owner" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their crop scan images" ON storage.objects;

CREATE POLICY "Users can upload their crop scan images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'crop-scan-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Crop scan images are private to their owner"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'crop-scan-uploads'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.crop_scans AS scan
      WHERE scan.session_id = auth.uid()::text
        AND split_part(
          scan.image_url,
          '/storage/v1/object/public/crop-scan-uploads/',
          2
        ) = storage.objects.name
    )
  )
);