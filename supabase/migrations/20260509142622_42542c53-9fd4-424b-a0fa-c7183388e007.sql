CREATE TABLE public.seo_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL UNIQUE,
  title text,
  description text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads SEO overrides"
  ON public.seo_overrides FOR SELECT
  USING (true);

CREATE POLICY "Admins manage SEO overrides"
  ON public.seo_overrides FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER seo_overrides_set_updated_at
  BEFORE UPDATE ON public.seo_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_seo_overrides_path ON public.seo_overrides(path);