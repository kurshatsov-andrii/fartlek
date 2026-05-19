
CREATE OR REPLACE FUNCTION public.enforce_distance_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap integer;
  cnt integer;
BEGIN
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
$$;

DROP TRIGGER IF EXISTS trg_enforce_distance_capacity ON public.registrations;
CREATE TRIGGER trg_enforce_distance_capacity
BEFORE INSERT ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.enforce_distance_capacity();
