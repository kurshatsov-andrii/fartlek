CREATE TABLE IF NOT EXISTS public.page_view_counts (
  page_key text PRIMARY KEY,
  views bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.page_view_counts TO anon;
GRANT SELECT ON public.page_view_counts TO authenticated;
GRANT ALL ON public.page_view_counts TO service_role;

ALTER TABLE public.page_view_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read page view counts"
ON public.page_view_counts FOR SELECT
TO anon, authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.increment_page_view(_page_key text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v bigint;
BEGIN
  IF _page_key IS NULL OR length(_page_key) = 0 OR length(_page_key) > 200 THEN
    RETURN 0;
  END IF;
  INSERT INTO public.page_view_counts (page_key, views, updated_at)
  VALUES (_page_key, 1, now())
  ON CONFLICT (page_key)
  DO UPDATE SET views = public.page_view_counts.views + 1, updated_at = now()
  RETURNING views INTO v;
  RETURN v;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_page_view(text) TO anon, authenticated;