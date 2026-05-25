
-- 1) Move results_api_key out of events into a dedicated table
CREATE TABLE IF NOT EXISTS public.event_results_api_keys (
  event_id uuid PRIMARY KEY,
  api_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_results_api_keys ENABLE ROW LEVEL SECURITY;
-- No policies: only SECURITY DEFINER RPCs and service role can access.

INSERT INTO public.event_results_api_keys (event_id, api_key)
SELECT id, results_api_key FROM public.events
 WHERE results_api_key IS NOT NULL
ON CONFLICT (event_id) DO NOTHING;

ALTER TABLE public.events DROP COLUMN IF EXISTS results_api_key;

CREATE OR REPLACE FUNCTION public.generate_event_results_api_key(_event_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_key text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  IF NOT public.can_manage_event(_event_id, auth.uid()) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  new_key := 'fk_' || encode(extensions.gen_random_bytes(24), 'hex');
  INSERT INTO public.event_results_api_keys (event_id, api_key, updated_at)
  VALUES (_event_id, new_key, now())
  ON CONFLICT (event_id) DO UPDATE SET api_key = EXCLUDED.api_key, updated_at = now();
  RETURN new_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_event_results_api_key(_event_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  k text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  IF NOT public.can_manage_event(_event_id, auth.uid()) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  SELECT api_key INTO k FROM public.event_results_api_keys WHERE event_id = _event_id;
  RETURN k;
END;
$$;

-- 2) Restrict event-images uploads to the user's own folder
DROP POLICY IF EXISTS "Authenticated users upload event images" ON storage.objects;
CREATE POLICY "Users upload event images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3) Tighten registration_history reads
DROP POLICY IF EXISTS "Actor views own history" ON public.registration_history;
CREATE POLICY "Owner views own registration history"
ON public.registration_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.registrations r
    WHERE r.id = registration_history.registration_id
      AND r.user_id = auth.uid()
  )
);
-- "Managers view event history" policy remains in place.
