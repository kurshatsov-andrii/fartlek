CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE(events_count integer, runners_count integer, cities_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*)::integer FROM public.events WHERE status = 'published'::public.event_status),
    (SELECT COUNT(DISTINCT r.user_id)::integer FROM public.registrations r),
    (SELECT COUNT(DISTINCT LOWER(TRIM(SPLIT_PART(location, ',', 1))))::integer
     FROM public.events
     WHERE status = 'published'::public.event_status AND location IS NOT NULL AND location <> '');
$$;

GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated;