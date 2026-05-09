
-- Carousel slides table
CREATE TABLE public.home_carousel_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  title_uk TEXT,
  title_en TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.home_carousel_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Carousel slides public read"
ON public.home_carousel_slides FOR SELECT USING (true);

CREATE POLICY "Admin can insert carousel slides"
ON public.home_carousel_slides FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update carousel slides"
ON public.home_carousel_slides FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete carousel slides"
ON public.home_carousel_slides FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_updated_at_home_carousel_slides
BEFORE UPDATE ON public.home_carousel_slides
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_home_carousel_slides_position ON public.home_carousel_slides(position);

-- Storage bucket for carousel images
INSERT INTO storage.buckets (id, name, public)
VALUES ('home-carousel', 'home-carousel', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Carousel images public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'home-carousel');

CREATE POLICY "Admin can upload carousel images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'home-carousel' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update carousel images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'home-carousel' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete carousel images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'home-carousel' AND public.has_role(auth.uid(), 'admin'));
