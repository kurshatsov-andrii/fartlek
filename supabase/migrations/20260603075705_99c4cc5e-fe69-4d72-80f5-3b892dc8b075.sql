-- Restore full public read on clubs
DROP POLICY IF EXISTS "Authenticated users view clubs" ON public.clubs;
DROP POLICY IF EXISTS "Anon views clubs (non-PII)" ON public.clubs;

CREATE POLICY "Anyone views clubs"
ON public.clubs
FOR SELECT
TO public
USING (true);

GRANT SELECT ON public.clubs TO anon;

-- Restore full public read on organizers
DROP POLICY IF EXISTS "Authenticated users view organizers" ON public.organizers;
DROP POLICY IF EXISTS "Anon views organizers (non-PII)" ON public.organizers;

CREATE POLICY "Anyone views organizers"
ON public.organizers
FOR SELECT
TO public
USING (true);

GRANT SELECT ON public.organizers TO anon;
