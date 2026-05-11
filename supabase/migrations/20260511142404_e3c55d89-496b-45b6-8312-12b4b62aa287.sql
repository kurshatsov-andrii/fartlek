-- Add multisport segments to distances
ALTER TABLE public.distances
  ADD COLUMN IF NOT EXISTS segments jsonb,
  ADD COLUMN IF NOT EXISTS discipline text,
  ADD COLUMN IF NOT EXISTS obstacle_count integer;

COMMENT ON COLUMN public.distances.segments IS 'Optional array of multisport segments: [{ sport: swim|bike|run|obstacle_run|kayak|ski|other, distance_km: number, order: int, note?: string }]. When present, distance_km should equal the sum of segment distances.';
COMMENT ON COLUMN public.distances.discipline IS 'Optional short label for the distance (e.g. Sprint, Olympic, Half (70.3), Full)';
COMMENT ON COLUMN public.distances.obstacle_count IS 'For OCR distances: number of obstacles on the course';