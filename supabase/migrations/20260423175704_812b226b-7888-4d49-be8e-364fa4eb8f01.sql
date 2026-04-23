DROP FUNCTION IF EXISTS public.get_event_participants(uuid);

CREATE OR REPLACE FUNCTION public.get_event_participants(_event_id uuid)
 RETURNS TABLE(registration_id uuid, user_id uuid, bib_number integer, full_name text, email text, gender gender_type, birth_year integer, city text, club text, distance_km numeric, distance_name text, payment_status payment_status_type, receipt_url text, receipt_uploaded_at timestamp with time zone, receipt_confirmed_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    r.id, r.user_id, r.bib_number,
    COALESCE(a.full_name, p.full_name),
    p.email,
    COALESCE(a.gender, p.gender),
    EXTRACT(YEAR FROM COALESCE(a.birth_date, p.birth_date))::integer,
    COALESCE(a.city, p.city),
    COALESCE(a.club, p.club),
    d.distance_km, d.name,
    r.payment_status, r.receipt_url, r.receipt_uploaded_at, r.receipt_confirmed_at
  FROM public.registrations r
  JOIN public.events e ON e.id = r.event_id
  LEFT JOIN public.athletes a ON a.id = r.athlete_id
  LEFT JOIN public.profiles p ON p.id = r.user_id
  LEFT JOIN public.distances d ON d.id = r.distance_id
  WHERE r.event_id = _event_id
    AND auth.uid() IS NOT NULL
    AND (
      e.status = 'published'::public.event_status
      OR e.organizer_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1 FROM public.registrations vr
        WHERE vr.event_id = _event_id AND vr.user_id = auth.uid()
      )
    )
  ORDER BY r.bib_number ASC NULLS LAST, r.created_at ASC;
$function$;