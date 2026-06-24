
CREATE OR REPLACE FUNCTION public.validate_person_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_name text := NEW.full_name;
  v_city text := NEW.city;
  v_club text := NEW.club;
  v_bdate date := NEW.birth_date;
BEGIN
  IF v_name IS NOT NULL THEN
    v_name := trim(v_name);
    IF length(v_name) < 2 OR length(v_name) > 100 THEN
      RAISE EXCEPTION 'INVALID_FULL_NAME_LENGTH';
    END IF;
    IF v_name ~ '[<>]' THEN
      RAISE EXCEPTION 'INVALID_FULL_NAME_CHARS';
    END IF;
    -- must contain at least one letter (Latin or Cyrillic)
    IF v_name !~ '[A-Za-zА-Яа-яЁёІіЇїЄєҐґ]' THEN
      RAISE EXCEPTION 'INVALID_FULL_NAME_NO_LETTERS';
    END IF;
    -- block obvious garbage: 5+ consecutive special characters
    IF v_name ~ '[`~!@#$%^&*()_+={}\[\]\\|;:"''<>,./?]{5,}' THEN
      RAISE EXCEPTION 'INVALID_FULL_NAME_GARBAGE';
    END IF;
  END IF;

  IF v_city IS NOT NULL THEN
    IF length(v_city) > 100 THEN
      RAISE EXCEPTION 'INVALID_CITY_LENGTH';
    END IF;
    IF v_city ~ '[<>]' THEN
      RAISE EXCEPTION 'INVALID_CITY_CHARS';
    END IF;
  END IF;

  IF v_club IS NOT NULL THEN
    IF length(v_club) > 100 THEN
      RAISE EXCEPTION 'INVALID_CLUB_LENGTH';
    END IF;
    IF v_club ~ '[<>]' THEN
      RAISE EXCEPTION 'INVALID_CLUB_CHARS';
    END IF;
  END IF;

  IF v_bdate IS NOT NULL THEN
    IF v_bdate < DATE '1900-01-01' OR v_bdate > CURRENT_DATE THEN
      RAISE EXCEPTION 'INVALID_BIRTH_DATE';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_profile_fields ON public.profiles;
CREATE TRIGGER validate_profile_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_person_fields();

DROP TRIGGER IF EXISTS validate_athlete_fields ON public.athletes;
CREATE TRIGGER validate_athlete_fields
  BEFORE INSERT OR UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.validate_person_fields();
