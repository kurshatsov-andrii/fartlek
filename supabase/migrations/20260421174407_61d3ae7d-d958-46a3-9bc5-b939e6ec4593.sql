DROP FUNCTION IF EXISTS public.get_public_stats();

CREATE FUNCTION public.get_public_stats()
RETURNS TABLE(events_count integer, runners_count integer, cities_count integer, clubs_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*)::integer FROM public.events WHERE status = 'published'::public.event_status),
    (SELECT COUNT(*)::integer FROM public.registrations),
    (SELECT COUNT(DISTINCT LOWER(TRIM(p.city)))::integer
     FROM public.profiles p
     WHERE p.city IS NOT NULL AND TRIM(p.city) <> ''
       AND EXISTS (SELECT 1 FROM public.registrations r WHERE r.user_id = p.id)),
    (SELECT COUNT(DISTINCT LOWER(TRIM(p.club)))::integer
     FROM public.profiles p
     WHERE p.club IS NOT NULL AND TRIM(p.club) <> ''
       AND EXISTS (SELECT 1 FROM public.registrations r WHERE r.user_id = p.id));
$$;

GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated;