CREATE OR REPLACE FUNCTION public.get_event_participants_count(_event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer FROM public.registrations WHERE event_id = _event_id;
$$;