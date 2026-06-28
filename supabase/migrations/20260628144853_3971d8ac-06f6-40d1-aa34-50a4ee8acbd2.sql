CREATE POLICY "Admins manage event-images" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'event-images' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'event-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));