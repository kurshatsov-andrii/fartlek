ALTER POLICY "Authenticated upload avatar" ON storage.objects TO authenticated WITH CHECK (
  bucket_id = 'avatars'
  AND owner_id = (SELECT auth.uid()::text)
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
ALTER POLICY "Authenticated update avatar" ON storage.objects TO authenticated USING (
  bucket_id = 'avatars' AND owner_id = (SELECT auth.uid()::text)
) WITH CHECK (
  bucket_id = 'avatars'
  AND owner_id = (SELECT auth.uid()::text)
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
ALTER POLICY "Authenticated delete avatar" ON storage.objects TO authenticated USING (
  bucket_id = 'avatars' AND owner_id = (SELECT auth.uid()::text)
);