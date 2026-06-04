CREATE OR REPLACE FUNCTION public.can_manage_event_storage_object(_object_name text, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'storage'
AS $$
DECLARE
  first_folder text;
  event_uuid uuid;
BEGIN
  IF _user_id IS NULL OR _object_name IS NULL THEN
    RETURN false;
  END IF;

  first_folder := (storage.foldername(_object_name))[1];
  IF first_folder IS NULL OR first_folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;

  event_uuid := first_folder::uuid;
  RETURN public.can_manage_event(event_uuid, _user_id);
END;
$$;

DROP POLICY IF EXISTS "Event managers upload event results" ON storage.objects;
DROP POLICY IF EXISTS "Event managers update event results" ON storage.objects;
DROP POLICY IF EXISTS "Event managers delete event results" ON storage.objects;

CREATE POLICY "Event managers upload event results"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'event-results'
  AND public.can_manage_event_storage_object(name, auth.uid())
);

CREATE POLICY "Event managers update event results"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'event-results'
  AND public.can_manage_event_storage_object(name, auth.uid())
)
WITH CHECK (
  bucket_id = 'event-results'
  AND public.can_manage_event_storage_object(name, auth.uid())
);

CREATE POLICY "Event managers delete event results"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'event-results'
  AND public.can_manage_event_storage_object(name, auth.uid())
);