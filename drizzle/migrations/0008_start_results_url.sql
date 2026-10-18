ALTER TABLE public.telegram_starts ADD COLUMN IF NOT EXISTS results_url text;

COMMENT ON COLUMN public.telegram_starts.results_url IS 'Public results page URL, set after the start finishes; replaces the registration button on the start details page';