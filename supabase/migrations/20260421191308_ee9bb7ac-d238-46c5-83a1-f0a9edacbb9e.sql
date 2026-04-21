ALTER TABLE public.distances
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_distances_event_active
ON public.distances (event_id, is_active, distance_km);