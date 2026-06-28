
ALTER TABLE public.telegram_starts
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS organizer_name text,
  ADD COLUMN IF NOT EXISTS sport_types text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS distances_km numeric[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_paid boolean;

CREATE INDEX IF NOT EXISTS idx_telegram_starts_city ON public.telegram_starts (city);
CREATE INDEX IF NOT EXISTS idx_telegram_starts_region ON public.telegram_starts (region);
CREATE INDEX IF NOT EXISTS idx_telegram_starts_sport_types ON public.telegram_starts USING gin (sport_types);
CREATE INDEX IF NOT EXISTS idx_telegram_starts_distances ON public.telegram_starts USING gin (distances_km);
