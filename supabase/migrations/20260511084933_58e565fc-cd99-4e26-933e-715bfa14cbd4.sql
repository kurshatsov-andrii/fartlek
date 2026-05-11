
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS results_api_key text UNIQUE;

ALTER TABLE public.event_results
  ADD COLUMN IF NOT EXISTS gun_time_seconds integer,
  ADD COLUMN IF NOT EXISTS chip_time_seconds integer,
  ADD COLUMN IF NOT EXISTS finish_position integer,
  ADD COLUMN IF NOT EXISTS finished_at timestamptz;

CREATE OR REPLACE FUNCTION public.generate_event_results_api_key(_event_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_key text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  IF NOT public.can_manage_event(_event_id, auth.uid()) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  new_key := 'fk_' || encode(extensions.gen_random_bytes(24), 'hex');
  UPDATE public.events SET results_api_key = new_key, updated_at = now() WHERE id = _event_id;
  RETURN new_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_event_results_api_key(_event_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  k text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  IF NOT public.can_manage_event(_event_id, auth.uid()) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  SELECT results_api_key INTO k FROM public.events WHERE id = _event_id;
  RETURN k;
END;
$$;
