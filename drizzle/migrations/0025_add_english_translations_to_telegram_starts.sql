ALTER TABLE public.telegram_starts
  ADD COLUMN title_en text,
  ADD COLUMN description_en text,
  ADD COLUMN city_en text,
  ADD COLUMN region_en text,
  ADD COLUMN seo_title_en text,
  ADD COLUMN seo_description_en text;

COMMENT ON COLUMN public.telegram_starts.title_en IS 'Editable English translation of the Ukrainian start title';
COMMENT ON COLUMN public.telegram_starts.description_en IS 'Editable English translation of the Ukrainian start description';
COMMENT ON COLUMN public.telegram_starts.city_en IS 'Editable English translation of the start city';
COMMENT ON COLUMN public.telegram_starts.region_en IS 'Editable English translation of the start region';
COMMENT ON COLUMN public.telegram_starts.seo_title_en IS 'Editable English search title for the start';
COMMENT ON COLUMN public.telegram_starts.seo_description_en IS 'Editable English search description for the start';