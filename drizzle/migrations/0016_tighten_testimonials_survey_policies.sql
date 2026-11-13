DROP POLICY IF EXISTS "Anyone can submit survey response" ON public.survey_responses;
CREATE POLICY "Anyone can submit survey response" ON public.survey_responses
FOR INSERT TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND (contact_email IS NULL OR length(contact_email) <= 255)
  AND (suggestions IS NULL OR length(suggestions) <= 5000)
  AND (liked_most IS NULL OR length(liked_most) <= 5000)
  AND (would_change IS NULL OR length(would_change) <= 5000)
);
DROP POLICY IF EXISTS "Anyone can view testimonials" ON public.testimonials;
CREATE POLICY "Anyone can view testimonials" ON public.testimonials
FOR SELECT TO anon, authenticated
USING (rating BETWEEN 1 AND 5 AND length(btrim(content)) > 0);