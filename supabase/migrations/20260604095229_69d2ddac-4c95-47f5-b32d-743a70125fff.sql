DROP POLICY IF EXISTS "Event managers update event results" ON storage.objects;

CREATE POLICY "Event managers update event results"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'event-results'
  AND auth.role() = 'authenticated'
  AND (
    public.can_manage_event_storage_object(name, auth.uid())
    OR public.can_manage_event_storage_insert_object(name, owner_id)
  )
)
WITH CHECK (
  bucket_id = 'event-results'
  AND auth.role() = 'authenticated'
  AND (
    public.can_manage_event_storage_object(name, auth.uid())
    OR public.can_manage_event_storage_insert_object(name, owner_id)
  )
);