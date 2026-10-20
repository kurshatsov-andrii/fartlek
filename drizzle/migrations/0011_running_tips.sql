CREATE TABLE public.running_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('ekipiruvannia','hodynnyky','trenuvannia','starty','kharchuvannia','vidnovlennia')),
  title text NOT NULL,
  excerpt text,
  content text,
  cover_url text,
  published_on date NOT NULL DEFAULT current_date,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.running_tips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.running_tips TO authenticated;
GRANT ALL ON public.running_tips TO service_role;
ALTER TABLE public.running_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published tips are public" ON public.running_tips FOR SELECT TO anon, authenticated USING (is_published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage tips" ON public.running_tips FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));