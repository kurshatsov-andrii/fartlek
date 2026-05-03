-- Distances: relay configuration
ALTER TABLE public.distances
  ADD COLUMN IF NOT EXISTS is_relay boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS relay_legs_count integer,
  ADD COLUMN IF NOT EXISTS relay_categories text[] NOT NULL DEFAULT ARRAY['mix','men','women']::text[];

-- Registrations: team data
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS team_name text,
  ADD COLUMN IF NOT EXISTS team_category text,
  ADD COLUMN IF NOT EXISTS relay_members jsonb;

-- Validation trigger for relay registrations
CREATE OR REPLACE FUNCTION public.validate_relay_registration()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  d public.distances%ROWTYPE;
  expected_legs integer;
  members_count integer;
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
    expected_legs := COALESCE(d.relay_legs_count, jsonb_array_length(NEW.relay_members));
    members_count := jsonb_array_length(NEW.relay_members);
    IF d.relay_legs_count IS NOT NULL AND members_count <> d.relay_legs_count THEN
      RAISE EXCEPTION 'RELAY_MEMBERS_COUNT_MISMATCH';
    END IF;
    IF members_count < 2 THEN
      RAISE EXCEPTION 'RELAY_MIN_MEMBERS';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_relay_registration_trg ON public.registrations;
CREATE TRIGGER validate_relay_registration_trg
BEFORE INSERT OR UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.validate_relay_registration();