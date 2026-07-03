ALTER TABLE public.events ADD COLUMN IF NOT EXISTS max_total_participants integer;

CREATE OR REPLACE FUNCTION public.enforce_distance_capacity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  cap integer;
  cnt integer;
  ev_cap integer;
  ev_cnt integer;
BEGIN
  -- Event-wide cap
  SELECT max_total_participants INTO ev_cap FROM public.events WHERE id = NEW.event_id;
  IF ev_cap IS NOT NULL THEN
    SELECT COUNT(*) INTO ev_cnt FROM public.registrations WHERE event_id = NEW.event_id;
    IF ev_cnt >= ev_cap THEN
      RAISE EXCEPTION 'EVENT_FULL';
    END IF;
  END IF;

  -- Per-distance cap
  SELECT max_participants INTO cap FROM public.distances WHERE id = NEW.distance_id;
  IF cap IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT COUNT(*) INTO cnt FROM public.registrations
   WHERE distance_id = NEW.distance_id;
  IF cnt >= cap THEN
    RAISE EXCEPTION 'DISTANCE_FULL';
  END IF;
  RETURN NEW;
END;
$function$;