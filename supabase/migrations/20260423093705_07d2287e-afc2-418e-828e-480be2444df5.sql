-- Drop old unique constraint that prevented multiple registrations per account per event
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_event_id_user_id_key;

-- Ensure the correct unique index exists: one athlete per distance per event
CREATE UNIQUE INDEX IF NOT EXISTS registrations_event_athlete_distance_key
  ON public.registrations (event_id, athlete_id, distance_id)
  WHERE athlete_id IS NOT NULL;