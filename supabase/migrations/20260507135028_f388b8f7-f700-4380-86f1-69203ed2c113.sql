ALTER TABLE public.distances ADD COLUMN IF NOT EXISTS virtual_start_time time;
ALTER TABLE public.distances ADD COLUMN IF NOT EXISTS virtual_end_time time;