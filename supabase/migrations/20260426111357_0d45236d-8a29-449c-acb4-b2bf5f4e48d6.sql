CREATE OR REPLACE FUNCTION public.move_registration_to_distance(
  _registration_id uuid,
  _new_distance_id uuid
) RETURNS TABLE(new_bib_number integer, new_distance_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  reg public.registrations%ROWTYPE;
  ev_organizer uuid;
  new_dist public.distances%ROWTYPE;
  next_bib integer;
  start_bib integer;
  max_in_distance integer;
  current_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  SELECT * INTO reg FROM public.registrations WHERE id = _registration_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'REGISTRATION_NOT_FOUND';
  END IF;

  SELECT organizer_id INTO ev_organizer FROM public.events WHERE id = reg.event_id;
  IF ev_organizer <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  SELECT * INTO new_dist FROM public.distances WHERE id = _new_distance_id;
  IF NOT FOUND OR new_dist.event_id <> reg.event_id THEN
    RAISE EXCEPTION 'INVALID_DISTANCE';
  END IF;

  IF new_dist.id = reg.distance_id THEN
    RETURN QUERY SELECT reg.bib_number, reg.distance_id;
    RETURN;
  END IF;

  IF new_dist.max_participants IS NOT NULL THEN
    SELECT COUNT(*) INTO current_count
      FROM public.registrations
     WHERE event_id = reg.event_id AND distance_id = new_dist.id;
    IF current_count >= new_dist.max_participants THEN
      RAISE EXCEPTION 'DISTANCE_FULL';
    END IF;
  END IF;

  start_bib := new_dist.bib_start;
  IF start_bib IS NOT NULL THEN
    SELECT MAX(bib_number) INTO max_in_distance
      FROM public.registrations
     WHERE event_id = reg.event_id AND distance_id = new_dist.id;
    IF max_in_distance IS NULL OR max_in_distance < start_bib THEN
      next_bib := start_bib;
    ELSE
      next_bib := max_in_distance + 1;
    END IF;
  ELSE
    SELECT COALESCE(MAX(bib_number), 999) + 1 INTO next_bib
      FROM public.registrations
     WHERE event_id = reg.event_id;
  END IF;

  UPDATE public.registrations
     SET distance_id = new_dist.id,
         bib_number = next_bib,
         updated_at = now()
   WHERE id = reg.id;

  RETURN QUERY SELECT next_bib, new_dist.id;
END;
$$;