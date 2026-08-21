DROP POLICY IF EXISTS "Results are publicly readable" ON public.event_external_results;

CREATE POLICY "Results are readable by registered users"
  ON public.event_external_results
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.event_external_results FROM anon;