-- 1) Hide contact PII on clubs/organizers from anonymous users
-- Strategy: drop public-read policies that expose all columns; replace with
--   (a) authenticated read full row
--   (b) anon read only via column-level grant excluding contact fields

-- CLUBS --------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone views clubs" ON public.clubs;

CREATE POLICY "Authenticated users view clubs"
ON public.clubs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anon views clubs (non-PII)"
ON public.clubs
FOR SELECT
TO anon
USING (true);

-- Revoke broad SELECT from anon and grant only non-PII columns
REVOKE SELECT ON public.clubs FROM anon;
GRANT SELECT
  (id, owner_id, name, slug, logo_url, city, description, activity_types,
   website_url, facebook_url, instagram_url, telegram_url, strava_url,
   youtube_url, founded_year, members_count, training_location,
   training_schedule, created_at, updated_at)
ON public.clubs TO anon;

-- ORGANIZERS ---------------------------------------------------------
DROP POLICY IF EXISTS "Anyone views organizers" ON public.organizers;

CREATE POLICY "Authenticated users view organizers"
ON public.organizers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anon views organizers (non-PII)"
ON public.organizers
FOR SELECT
TO anon
USING (true);

REVOKE SELECT ON public.organizers FROM anon;
GRANT SELECT
  (id, owner_id, name, slug, logo_url, city, description, activity_types,
   website_url, facebook_url, instagram_url, telegram_url, strava_url,
   youtube_url, founded_year, members_count, training_location,
   training_schedule, created_at, updated_at)
ON public.organizers TO anon;

-- 2) Realtime channel authorization
-- Block anonymous role from subscribing to Realtime; authenticated users may.
-- (Reads via REST still governed by table RLS.)
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can subscribe to realtime" ON realtime.messages;
CREATE POLICY "Authenticated users can subscribe to realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);
