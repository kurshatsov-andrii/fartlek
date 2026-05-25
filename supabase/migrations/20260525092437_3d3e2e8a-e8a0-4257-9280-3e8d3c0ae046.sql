
-- 1) Pin search_path on pgmq helper functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

-- 2) Remove broad SELECT policies on storage.objects for public buckets to prevent listing.
--    Public-bucket files remain accessible via getPublicUrl (served by the storage CDN, not gated by RLS).
DROP POLICY IF EXISTS "Anyone views avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read club logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event results" ON storage.objects;
DROP POLICY IF EXISTS "GPX files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Organizer logos public read" ON storage.objects;
DROP POLICY IF EXISTS "Carousel images public read" ON storage.objects;
