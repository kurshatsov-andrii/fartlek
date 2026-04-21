CREATE OR REPLACE FUNCTION public.assign_registration_bib_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_bib integer;
BEGIN
  IF NEW.bib_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(bib_number), 999) + 1
  INTO next_bib
  FROM public.registrations
  WHERE event_id = NEW.event_id;

  NEW.bib_number := next_bib;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_registration_bib_number_before_insert ON public.registrations;
CREATE TRIGGER assign_registration_bib_number_before_insert
BEFORE INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.assign_registration_bib_number();

CREATE OR REPLACE FUNCTION public.get_event_participants(_event_id uuid)
RETURNS TABLE (
  registration_id uuid,
  user_id uuid,
  bib_number integer,
  full_name text,
  gender public.gender_type,
  birth_year integer,
  city text,
  club text,
  distance_km numeric,
  distance_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id AS registration_id,
    r.user_id,
    r.bib_number,
    p.full_name,
    p.gender,
    EXTRACT(YEAR FROM p.birth_date)::integer AS birth_year,
    p.city,
    p.club,
    d.distance_km,
    d.name AS distance_name
  FROM public.registrations r
  JOIN public.events e ON e.id = r.event_id
  LEFT JOIN public.profiles p ON p.id = r.user_id
  LEFT JOIN public.distances d ON d.id = r.distance_id
  WHERE r.event_id = _event_id
    AND auth.uid() IS NOT NULL
    AND (
      e.status = 'published'::public.event_status
      OR e.organizer_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1
        FROM public.registrations viewer_registration
        WHERE viewer_registration.event_id = _event_id
          AND viewer_registration.user_id = auth.uid()
      )
    )
  ORDER BY r.bib_number ASC NULLS LAST, r.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_participants(uuid) TO authenticated;