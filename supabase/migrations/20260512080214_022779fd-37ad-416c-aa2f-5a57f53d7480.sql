-- Organizers profile table (analogous to clubs)
CREATE TABLE public.organizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  slug text UNIQUE,
  logo_url text,
  city text,
  description text,
  activity_types public.club_activity_type[] NOT NULL DEFAULT '{}',
  website_url text,
  instagram_url text,
  facebook_url text,
  telegram_url text,
  strava_url text,
  youtube_url text,
  contact_email text,
  contact_phone text,
  founded_year integer,
  members_count integer,
  training_location text,
  training_schedule text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views organizers" ON public.organizers
  FOR SELECT USING (true);

CREATE POLICY "Owner creates own organizer" ON public.organizers
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid()
    AND (public.has_role(auth.uid(), 'organizer'::public.app_role)
         OR public.has_role(auth.uid(), 'admin'::public.app_role)));

CREATE POLICY "Owner or admin updates organizer" ON public.organizers
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Owner or admin deletes organizer" ON public.organizers
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- Slug generator (mirrors generate_club_slug)
CREATE OR REPLACE FUNCTION public.generate_organizer_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base text;
  candidate text;
  n int := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;
  base := public.slugify(NEW.name);
  IF base IS NULL OR base = '' THEN base := 'organizer'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.organizers WHERE slug = candidate AND id <> NEW.id) LOOP
    n := n + 1;
    candidate := base || '-' || n;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizers_set_slug
  BEFORE INSERT OR UPDATE ON public.organizers
  FOR EACH ROW EXECUTE FUNCTION public.generate_organizer_slug();

CREATE TRIGGER organizers_set_updated_at
  BEFORE UPDATE ON public.organizers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER organizers_validate
  BEFORE INSERT OR UPDATE ON public.organizers
  FOR EACH ROW EXECUTE FUNCTION public.validate_club();

-- Storage bucket for organizer logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('organizer-logos', 'organizer-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Organizer logos public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'organizer-logos');

CREATE POLICY "Users upload own organizer logo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'organizer-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own organizer logo" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'organizer-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own organizer logo" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'organizer-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
