-- Run this in Supabase SQL Editor to set up Storage policies for progress-photos
-- First create the bucket in Dashboard → Storage → New bucket:
--   Name: progress-photos  |  Public: ON

-- Allow authenticated users to upload their own photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy: clients can upload to their own folder
CREATE POLICY "Clients upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'progress-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: public read (bucket is public so URLs work)
CREATE POLICY "Public read progress photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'progress-photos');

-- Policy: clients can delete own photos
CREATE POLICY "Clients delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'progress-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
