
ALTER TABLE public.distances
  ADD COLUMN IF NOT EXISTS is_virtual boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS virtual_start_date date,
  ADD COLUMN IF NOT EXISTS virtual_end_date date,
  ADD COLUMN IF NOT EXISTS distance_tolerance_percent numeric NOT NULL DEFAULT 5;

CREATE TABLE IF NOT EXISTS public.event_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL UNIQUE,
  event_id uuid NOT NULL,
  distance_id uuid NOT NULL,
  user_id uuid NOT NULL,
  time_seconds integer NOT NULL,
  distance_meters integer,
  moving_time_seconds integer,
  source text NOT NULL DEFAULT 'manual',
  strava_activity_id bigint,
  activity_start_date timestamptz,
  verified boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_results_event ON public.event_results(event_id);
CREATE INDEX IF NOT EXISTS idx_event_results_user ON public.event_results(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_results_strava
  ON public.event_results(user_id, strava_activity_id)
  WHERE strava_activity_id IS NOT NULL;

ALTER TABLE public.event_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views results of visible events"
  ON public.event_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_results.event_id
        AND (e.status IN ('published'::public.event_status, 'completed'::public.event_status)
             OR e.organizer_id = auth.uid()
             OR public.has_role(auth.uid(), 'admin'::public.app_role)
             OR public.is_event_co_organizer(e.id, auth.uid()))
    )
  );

CREATE POLICY "Users insert own results"
  ON public.event_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own results"
  ON public.event_results FOR UPDATE
  USING (auth.uid() = user_id OR public.can_manage_event(event_id, auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.can_manage_event(event_id, auth.uid()));

CREATE POLICY "Managers or owner delete results"
  ON public.event_results FOR DELETE
  USING (auth.uid() = user_id OR public.can_manage_event(event_id, auth.uid()));

CREATE TRIGGER set_event_results_updated_at
  BEFORE UPDATE ON public.event_results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
