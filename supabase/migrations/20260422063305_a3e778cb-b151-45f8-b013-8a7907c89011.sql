-- Add slug column to events for SEO-friendly URLs
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS events_slug_unique ON public.events (slug) WHERE slug IS NOT NULL;

-- Transliteration function (Ukrainian -> Latin) and slug generator
CREATE OR REPLACE FUNCTION public.slugify(_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  s text;
BEGIN
  IF _input IS NULL THEN RETURN NULL; END IF;
  s := lower(_input);
  -- Ukrainian / Russian transliteration
  s := translate(s,
    'абвгдеєзиіїйклмнопрстуфхцыэъь',
    'abvgdeezyiiyklmnoprstufhcyeh ');
  s := replace(s, 'ж', 'zh');
  s := replace(s, 'й', 'y');
  s := replace(s, 'х', 'kh');
  s := replace(s, 'ц', 'ts');
  s := replace(s, 'ч', 'ch');
  s := replace(s, 'ш', 'sh');
  s := replace(s, 'щ', 'shch');
  s := replace(s, 'ю', 'yu');
  s := replace(s, 'я', 'ya');
  s := replace(s, 'ґ', 'g');
  s := replace(s, '''', '');
  -- Replace any non a-z0-9 with hyphen
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '(^-+|-+$)', '', 'g');
  RETURN s;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_event_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  n int := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;
  base := public.slugify(NEW.title);
  IF NEW.location IS NOT NULL AND NEW.location <> '' THEN
    base := base || '-' || public.slugify(split_part(NEW.location, ',', 1));
  END IF;
  IF NEW.event_date IS NOT NULL THEN
    base := base || '-' || to_char(NEW.event_date, 'YYYY');
  END IF;
  base := regexp_replace(base, '(^-+|-+$)', '', 'g');
  IF base = '' THEN base := 'event'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = candidate AND id <> NEW.id) LOOP
    n := n + 1;
    candidate := base || '-' || n;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_generate_slug ON public.events;
CREATE TRIGGER events_generate_slug
BEFORE INSERT OR UPDATE OF title, location, event_date ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.generate_event_slug();

-- Backfill existing events
UPDATE public.events SET slug = NULL WHERE slug IS NULL;
UPDATE public.events SET title = title WHERE slug IS NULL;