CREATE POLICY "Public can view organizer logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'organizer-logos');