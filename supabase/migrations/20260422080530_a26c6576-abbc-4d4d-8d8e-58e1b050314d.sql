ALTER TABLE public.distances ADD COLUMN IF NOT EXISTS bib_start integer;

CREATE OR REPLACE FUNCTION public.assign_registration_bib_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_bib integer;
  start_bib integer;
  max_in_distance integer;
BEGIN
  IF NEW.bib_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT bib_start INTO start_bib FROM public.distances WHERE id = NEW.distance_id;

  IF start_bib IS NOT NULL THEN
    SELECT MAX(bib_number) INTO max_in_distance
    FROM public.registrations
    WHERE event_id = NEW.event_id AND distance_id = NEW.distance_id;

    IF max_in_distance IS NULL OR max_in_distance < start_bib THEN
      next_bib := start_bib;
    ELSE
      next_bib := max_in_distance + 1;
    END IF;
  ELSE
    SELECT COALESCE(MAX(bib_number), 999) + 1 INTO next_bib
    FROM public.registrations
    WHERE event_id = NEW.event_id;
  END IF;

  NEW.bib_number := next_bib;
  RETURN NEW;
END;
$function$;