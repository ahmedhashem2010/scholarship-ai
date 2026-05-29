-- Run this in Supabase SQL editor (Dashboard > SQL Editor)
-- This creates the "documents" bucket and RLS policies

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('documents', 'documents', true, false)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow users to upload files to their own folder
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Allow users to view their own files
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
