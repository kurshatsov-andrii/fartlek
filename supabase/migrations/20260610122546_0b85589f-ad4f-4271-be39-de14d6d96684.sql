
CREATE OR REPLACE FUNCTION public.assign_registration_bib_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_bib integer;
  start_bib integer;
  gap_bib integer;
  max_in_scope integer;
BEGIN
  IF NEW.bib_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT bib_start INTO start_bib FROM public.distances WHERE id = NEW.distance_id;

  IF start_bib IS NOT NULL THEN
    -- Per-distance numbering: find first free number >= start_bib within same event+distance
    SELECT MAX(bib_number) INTO max_in_scope
    FROM public.registrations
    WHERE event_id = NEW.event_id AND distance_id = NEW.distance_id;

    IF max_in_scope IS NULL OR max_in_scope < start_bib THEN
      next_bib := start_bib;
    ELSE
      SELECT s INTO gap_bib
      FROM generate_series(start_bib, max_in_scope) AS s
      WHERE NOT EXISTS (
        SELECT 1 FROM public.registrations r
        WHERE r.event_id = NEW.event_id
          AND r.distance_id = NEW.distance_id
          AND r.bib_number = s
      )
      ORDER BY s
      LIMIT 1;
      next_bib := COALESCE(gap_bib, max_in_scope + 1);
    END IF;
  ELSE
    -- Event-wide numbering starting from 1000
    SELECT MAX(bib_number) INTO max_in_scope
    FROM public.registrations
    WHERE event_id = NEW.event_id;

    IF max_in_scope IS NULL OR max_in_scope < 1000 THEN
      next_bib := 1000;
    ELSE
      SELECT s INTO gap_bib
      FROM generate_series(1000, max_in_scope) AS s
      WHERE NOT EXISTS (
        SELECT 1 FROM public.registrations r
        WHERE r.event_id = NEW.event_id
          AND r.bib_number = s
      )
      ORDER BY s
      LIMIT 1;
      next_bib := COALESCE(gap_bib, max_in_scope + 1);
    END IF;
  END IF;

  NEW.bib_number := next_bib;
  RETURN NEW;
END;
$function$;
