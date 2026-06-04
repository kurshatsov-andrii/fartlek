CREATE OR REPLACE FUNCTION public.can_manage_event_storage_object(_object_name text, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'storage'
AS $$
DECLARE
  parts text[];
  first_folder text;
  event_uuid uuid;
BEGIN
  IF _user_id IS NULL OR _object_name IS NULL THEN
    RETURN false;
  END IF;

  parts := storage.foldername(_object_name);
  first_folder := NULLIF(parts[1], '');

  -- Some storage requests/logs include the bucket name in the path. If so, use the next folder as the event id.
  IF first_folder = 'event-results' THEN
    first_folder := NULLIF(parts[2], '');
  END IF;

  IF first_folder IS NULL OR first_folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;

  event_uuid := first_folder::uuid;
  RETURN public.can_manage_event(event_uuid, _user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_event_storage_insert_object(_object_name text, _owner_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'storage'
AS $$
DECLARE
  owner_uuid uuid;
BEGIN
  IF _owner_id IS NULL OR _owner_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;

  owner_uuid := _owner_id::uuid;
  RETURN public.can_manage_event_storage_object(_object_name, owner_uuid);
END;
$$;

DROP POLICY IF EXISTS "Event managers upload event results" ON storage.objects;

CREATE POLICY "Event managers upload event results"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'event-results'
  AND auth.role() = 'authenticated'
  AND (
    public.can_manage_event_storage_object(name, auth.uid())
    OR public.can_manage_event_storage_insert_object(name, owner_id)
  )
);