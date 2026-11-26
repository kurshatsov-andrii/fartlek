CREATE OR REPLACE FUNCTION public.get_public_growth()
RETURNS TABLE(month date, runners integer, registrations integer, events integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH m AS (
    SELECT generate_series(date '2026-04-01', date_trunc('month', now() AT TIME ZONE 'Europe/Kyiv')::date, interval '1 month')::date AS month
  )
  SELECT m.month,
    (SELECT COUNT(*)::integer FROM public.profiles WHERE created_at < (m.month + interval '1 month')),
    (SELECT COUNT(*)::integer FROM public.registrations WHERE created_at < (m.month + interval '1 month')),
    ((SELECT COUNT(*) FROM public.events WHERE created_at < (m.month + interval '1 month'))
     + (SELECT COUNT(*) FROM public.telegram_starts WHERE created_at < (m.month + interval '1 month')))::integer
  FROM m ORDER BY m.month;
$$;
REVOKE ALL ON FUNCTION public.get_public_growth() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_growth() TO anon, authenticated;