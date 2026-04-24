CREATE OR REPLACE FUNCTION public.get_public_stats()
 RETURNS TABLE(events_count integer, runners_count integer, cities_count integer, clubs_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    (SELECT COUNT(*)::integer FROM public.events WHERE status IN ('published'::public.event_status, 'completed'::public.event_status)),
    (SELECT COUNT(*)::integer FROM public.profiles),
    (SELECT COUNT(DISTINCT LOWER(TRIM(p.city)))::integer
     FROM public.profiles p
     WHERE p.city IS NOT NULL AND TRIM(p.city) <> ''),
    (SELECT COUNT(DISTINCT LOWER(TRIM(p.club)))::integer
     FROM public.profiles p
     WHERE p.club IS NOT NULL AND TRIM(p.club) <> '');
$function$;