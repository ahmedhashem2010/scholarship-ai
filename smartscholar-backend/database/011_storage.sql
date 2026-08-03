-- =============================================================================
-- 011_storage.sql — Supabase Storage buckets & policies for SmartScholar
-- Generated from docs/DATABASE.md §11. Run after 001–010.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Buckets
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('student-documents', 'student-documents', false, 20971520, ARRAY[
    'application/pdf', 'image/png', 'image/jpeg', 'image/webp',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]),
  ('scholarship-assets', 'scholarship-assets', true, 52428800, NULL),
  ('scholarship-pdfs', 'scholarship-pdfs', true, 20971520, ARRAY['application/pdf']),
  ('logos', 'logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- student-documents (private) — owner-scoped paths: <user_id>/<file>
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Student can upload own documents" ON storage.objects;
CREATE POLICY "Student can upload own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'student-documents'
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

DROP POLICY IF EXISTS "Student can read own documents" ON storage.objects;
CREATE POLICY "Student can read own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'student-documents'
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

DROP POLICY IF EXISTS "Student can update own documents" ON storage.objects;
CREATE POLICY "Student can update own documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'student-documents'
  AND (storage.foldername(name))[1]::uuid = auth.uid()
)
WITH CHECK (
  bucket_id = 'student-documents'
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

DROP POLICY IF EXISTS "Student can delete own documents" ON storage.objects;
CREATE POLICY "Student can delete own documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'student-documents'
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

DROP POLICY IF EXISTS "Admins can access any document" ON storage.objects;
CREATE POLICY "Admins can access any document"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'student-documents'
  AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
);

-- -----------------------------------------------------------------------------
-- Public buckets — anon read, authenticated writes restricted to staff paths
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION storage_public_read()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT bucket_id IN ('scholarship-assets', 'scholarship-pdfs', 'logos', 'avatars');
$$;

DROP POLICY IF EXISTS "Public can read public buckets" ON storage.objects;
CREATE POLICY "Public can read public buckets"
ON storage.objects FOR SELECT TO anon, authenticated
USING (storage_public_read());

-- Writes to public buckets: admins/moderators may write anywhere in these buckets;
-- authenticated users may only write their own avatars.
DROP POLICY IF EXISTS "Staff can write public buckets" ON storage.objects;
CREATE POLICY "Staff can write public buckets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('scholarship-assets', 'scholarship-pdfs', 'logos')
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN', 'PROVIDER_STAFF')
  )
);

DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);
