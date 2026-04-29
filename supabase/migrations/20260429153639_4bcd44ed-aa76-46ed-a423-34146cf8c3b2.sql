-- Enum for club activity types
CREATE TYPE public.club_activity_type AS ENUM ('road_run', 'trail', 'ocr', 'triathlon', 'cycling', 'swimming', 'other');

-- Clubs table
CREATE TABLE public.clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  slug text UNIQUE,
  logo_url text,
  city text,
  description text,
  activity_types public.club_activity_type[] NOT NULL DEFAULT '{}',
  -- Social links
  website_url text,
  instagram_url text,
  facebook_url text,
  telegram_url text,
  strava_url text,
  youtube_url text,
  -- Contacts
  contact_email text,
  contact_phone text,
  -- About
  founded_year integer,
  members_count integer,
  -- Training
  training_location text,
  training_schedule text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clubs_city ON public.clubs(city);
CREATE INDEX idx_clubs_slug ON public.clubs(slug);
CREATE INDEX idx_clubs_owner ON public.clubs(owner_id);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can view all clubs (public catalog)
CREATE POLICY "Anyone views clubs"
  ON public.clubs FOR SELECT
  USING (true);

-- RLS: owner can create their own club
CREATE POLICY "Owner creates own club"
  ON public.clubs FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND (public.has_role(auth.uid(), 'organizer'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))
  );

-- RLS: owner or admin updates
CREATE POLICY "Owner or admin updates club"
  ON public.clubs FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- RLS: owner or admin deletes
CREATE POLICY "Owner or admin deletes club"
  ON public.clubs FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- Slug generator trigger
CREATE OR REPLACE FUNCTION public.generate_club_slug()
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
  IF base IS NULL OR base = '' THEN base := 'club'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.clubs WHERE slug = candidate AND id <> NEW.id) LOOP
    n := n + 1;
    candidate := base || '-' || n;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

CREATE TRIGGER clubs_set_slug
  BEFORE INSERT OR UPDATE OF name ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.generate_club_slug();

CREATE TRIGGER clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Validation: founded_year and members_count sanity
CREATE OR REPLACE FUNCTION public.validate_club()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.founded_year IS NOT NULL AND (NEW.founded_year < 1800 OR NEW.founded_year > EXTRACT(YEAR FROM now())::int) THEN
    RAISE EXCEPTION 'INVALID_FOUNDED_YEAR';
  END IF;
  IF NEW.members_count IS NOT NULL AND NEW.members_count < 0 THEN
    RAISE EXCEPTION 'INVALID_MEMBERS_COUNT';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER clubs_validate
  BEFORE INSERT OR UPDATE ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.validate_club();

-- Storage bucket for club logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-logos', 'club-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read club logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'club-logos');

CREATE POLICY "Authenticated upload own club logo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'club-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated update own club logo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'club-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated delete own club logo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'club-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
