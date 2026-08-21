ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS telegram_start_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_events_telegram_start ON public.calendar_events(telegram_start_id) WHERE telegram_start_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_start_to_calendar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _dist text;
  _cat text;
  _loc text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.calendar_events WHERE telegram_start_id = OLD.id;
    RETURN OLD;
  END IF;

  IF NEW.status <> 'published' OR NEW.event_date IS NULL OR NEW.event_date < CURRENT_DATE THEN
    DELETE FROM public.calendar_events WHERE telegram_start_id = NEW.id;
    RETURN NEW;
  END IF;

  _dist := NULLIF(array_to_string(ARRAY(SELECT d::text || ' км' FROM unnest(COALESCE(NEW.distances_km, '{}')) AS d), ', '), '');
  _cat := NULLIF(COALESCE(NEW.sport_types[1], ''), '');
  _loc := NULLIF(concat_ws(', ', NULLIF(NEW.city, ''), NULLIF(NEW.region, '')), '');

  INSERT INTO public.calendar_events (telegram_start_id, title, event_date, location, distances, organizer_name, category, url, notes)
  VALUES (NEW.id, NEW.title, NEW.event_date, _loc, _dist, NULLIF(NEW.organizer_name, ''), _cat, '/starts/' || COALESCE(NEW.slug, NEW.id::text), NULL)
  ON CONFLICT (telegram_start_id) WHERE telegram_start_id IS NOT NULL
  DO UPDATE SET title = EXCLUDED.title,
                event_date = EXCLUDED.event_date,
                location = EXCLUDED.location,
                distances = EXCLUDED.distances,
                organizer_name = EXCLUDED.organizer_name,
                category = EXCLUDED.category,
                url = EXCLUDED.url,
                updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_start_to_calendar ON public.telegram_starts;
CREATE TRIGGER trg_sync_start_to_calendar
AFTER INSERT OR UPDATE OR DELETE ON public.telegram_starts
FOR EACH ROW EXECUTE FUNCTION public.sync_start_to_calendar();

-- Backfill future published starts
INSERT INTO public.calendar_events (telegram_start_id, title, event_date, location, distances, organizer_name, category, url)
SELECT s.id, s.title, s.event_date,
       NULLIF(concat_ws(', ', NULLIF(s.city, ''), NULLIF(s.region, '')), ''),
       NULLIF(array_to_string(ARRAY(SELECT d::text || ' км' FROM unnest(COALESCE(s.distances_km, '{}')) AS d), ', '), ''),
       NULLIF(s.organizer_name, ''),
       NULLIF(COALESCE(s.sport_types[1], ''), ''),
       '/starts/' || COALESCE(s.slug, s.id::text)
FROM public.telegram_starts s
WHERE s.status = 'published' AND s.event_date IS NOT NULL AND s.event_date >= CURRENT_DATE
ON CONFLICT (telegram_start_id) WHERE telegram_start_id IS NOT NULL DO NOTHING;