DROP POLICY IF EXISTS "Organizers upload own event results" ON storage.objects;
DROP POLICY IF EXISTS "Organizers update own event results" ON storage.objects;
DROP POLICY IF EXISTS "Organizers delete own event results" ON storage.objects;

CREATE POLICY "Event managers upload event results"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'event-results'
  AND auth.uid() IS NOT NULL
  AND public.can_manage_event(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Event managers update event results"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'event-results'
  AND auth.uid() IS NOT NULL
  AND public.can_manage_event(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Event managers delete event results"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'event-results'
  AND auth.uid() IS NOT NULL
  AND public.can_manage_event(((storage.foldername(name))[1])::uuid, auth.uid())
);