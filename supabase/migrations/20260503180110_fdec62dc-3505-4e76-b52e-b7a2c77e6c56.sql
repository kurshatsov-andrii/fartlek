ALTER TABLE public.distances ADD COLUMN IF NOT EXISTS relay_legs jsonb;

CREATE OR REPLACE FUNCTION public.validate_relay_registration()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  d public.distances%ROWTYPE;
  members_count integer;
  expected_legs integer;
BEGIN
  SELECT * INTO d FROM public.distances WHERE id = NEW.distance_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF d.is_relay THEN
    IF NEW.team_name IS NULL OR length(trim(NEW.team_name)) = 0 THEN
      RAISE EXCEPTION 'TEAM_NAME_REQUIRED';
    END IF;
    IF NEW.team_category IS NULL OR NOT (NEW.team_category = ANY(d.relay_categories)) THEN
      RAISE EXCEPTION 'INVALID_TEAM_CATEGORY';
    END IF;
    IF NEW.relay_members IS NULL OR jsonb_typeof(NEW.relay_members) <> 'array' THEN
      RAISE EXCEPTION 'RELAY_MEMBERS_REQUIRED';
    END IF;
    expected_legs := COALESCE(
      d.relay_legs_count,
      CASE WHEN d.relay_legs IS NOT NULL AND jsonb_typeof(d.relay_legs) = 'array' THEN jsonb_array_length(d.relay_legs) END,
      jsonb_array_length(NEW.relay_members)
    );
    members_count := jsonb_array_length(NEW.relay_members);
    IF expected_legs IS NOT NULL AND members_count <> expected_legs THEN
      RAISE EXCEPTION 'RELAY_MEMBERS_COUNT_MISMATCH';
    END IF;
    IF members_count < 2 THEN
      RAISE EXCEPTION 'RELAY_MIN_MEMBERS';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS validate_relay_registration_trg ON public.registrations;
CREATE TRIGGER validate_relay_registration_trg
BEFORE INSERT OR UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.validate_relay_registration();