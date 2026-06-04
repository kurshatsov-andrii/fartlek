DROP POLICY IF EXISTS "Event managers view event results" ON storage.objects;
DROP POLICY IF EXISTS "Event managers upload event results" ON storage.objects;
DROP POLICY IF EXISTS "Event managers update event results" ON storage.objects;
DROP POLICY IF EXISTS "Event managers delete event results" ON storage.objects;

CREATE POLICY "Event managers view event results"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'event-results'
  AND auth.role() = 'authenticated'
  AND public.can_manage_event_storage_object(name, auth.uid())
);

CREATE POLICY "Event managers upload event results"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'event-results'
  AND auth.role() = 'authenticated'
  AND public.can_manage_event_storage_object(name, auth.uid())
);

CREATE POLICY "Event managers update event results"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'event-results'
  AND auth.role() = 'authenticated'
  AND public.can_manage_event_storage_object(name, auth.uid())
)
WITH CHECK (
  bucket_id = 'event-results'
  AND auth.role() = 'authenticated'
  AND public.can_manage_event_storage_object(name, auth.uid())
);

CREATE POLICY "Event managers delete event results"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'event-results'
  AND auth.role() = 'authenticated'
  AND public.can_manage_event_storage_object(name, auth.uid())
);