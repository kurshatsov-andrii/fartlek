
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

  -- Не додаємо дубль, якщо на цю дату вже є подія з такою ж (вкладеною) назвою
  IF EXISTS (
    SELECT 1 FROM public.calendar_events ce
    WHERE ce.event_date = NEW.event_date
      AND ce.telegram_start_id IS DISTINCT FROM NEW.id
      AND (
        lower(NEW.title) LIKE '%' || lower(ce.title) || '%'
        OR lower(ce.title) LIKE '%' || lower(NEW.title) || '%'
      )
  ) THEN
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
