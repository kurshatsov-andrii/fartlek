CREATE OR REPLACE FUNCTION public.can_manage_event_storage_object(_object_name text, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'storage'
AS $$
DECLARE
  normalized_name text;
  parts text[];
  first_folder text;
  event_uuid uuid;
BEGIN
  IF _user_id IS NULL OR _object_name IS NULL THEN
    RETURN false;
  END IF;

  normalized_name := regexp_replace(_object_name, '^/+', '');
  parts := storage.foldername(normalized_name);
  first_folder := NULLIF(parts[1], '');

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