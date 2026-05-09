DROP POLICY IF EXISTS "Organizers view event receipts" ON storage.objects;

CREATE POLICY "Organizers view event receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-receipts'
  AND EXISTS (
    SELECT 1
    FROM registrations r
    JOIN events e ON e.id = r.event_id
    WHERE (r.user_id)::text = (storage.foldername(objects.name))[1]
      AND POSITION((r.id)::text IN objects.name) > 0
      AND (
        e.organizer_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR is_event_co_organizer(e.id, auth.uid())
      )
  )
);